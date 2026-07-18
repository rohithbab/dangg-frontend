import { type RealtimeChannel, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus } from 'react-native';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { USE_MOCK_DATA } from '@core/config/env';
import { fcmService } from '@core/services/fcmService';
import { SecureKey, secureStorage } from '@core/storage/secureStorage';
import { logger } from '@core/utils/logger';

import {
  parseUserRole,
  parseVerificationStatus,
  UserRole,
  VerificationStatus,
} from '@app-types/domain';

import { useChatRequestStore } from '../features/chatRequests/store/chatRequestStore';

import { useDeviceKickStore } from './deviceKickStore';

export type SessionState = {
  session: Session | null;
  role: UserRole | null;
  verificationStatus: VerificationStatus;
  setSession: (session: Session | null) => void;
  setVerificationStatus: (status: VerificationStatus) => void;
  clear: () => void;
};

function deriveRole(session: Session | null): UserRole | null {
  if (!session) {
    return null;
  }
  // Check app_metadata.role first (e.g. admin or custom claim)
  const appRole = parseUserRole(session.user.app_metadata?.role);
  if (appRole) {
    return appRole;
  }
  // Fall back to user_metadata.role set during signup
  return parseUserRole(session.user.user_metadata?.role);
}

/**
 * Global auth state.
 *
 * Components subscribe via selector functions (`useSessionStore(s => s.role)`)
 * to avoid rebuilds on unrelated slice changes — never call
 * `useSessionStore()` without a selector.
 *
 * Supabase Auth state changes are wired into this store from `App.tsx` via
 * `subscribeSupabaseAuth()` below.
 */
export const useSessionStore = create<SessionState>()(
  subscribeWithSelector(set => ({
    session: null,
    role: null,
    verificationStatus: VerificationStatus.None,

    setSession: (session): void => set({ session, role: deriveRole(session) }),

    setVerificationStatus: (status): void => set({ verificationStatus: status }),

    clear: (): void =>
      set({ session: null, role: null, verificationStatus: VerificationStatus.None }),
  })),
);

/** Selector hooks for ergonomic, narrow subscriptions. */
export const useSession = (): Session | null => useSessionStore(s => s.session);
export const useIsAuthenticated = (): boolean => useSessionStore(s => s.session !== null);
export const useSessionRole = (): UserRole | null => useSessionStore(s => s.role);
export const useVerificationStatus = (): VerificationStatus =>
  useSessionStore(s => s.verificationStatus);

let activeChannel: RealtimeChannel | null = null;
let chatRequestsChannel: RealtimeChannel | null = null;
let deviceSessionChannel: RealtimeChannel | null = null;
let deviceSessionPollId: ReturnType<typeof setInterval> | null = null;
let deviceSessionAppStateSub: { remove: () => void } | null = null;

const DEVICE_SESSION_POLL_MS = 30000;

function generateDeviceSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function teardownDeviceSession(client: SupabaseClient): void {
  if (deviceSessionChannel) {
    void client.removeChannel(deviceSessionChannel);
    deviceSessionChannel = null;
  }
  if (deviceSessionPollId) {
    clearInterval(deviceSessionPollId);
    deviceSessionPollId = null;
  }
  if (deviceSessionAppStateSub) {
    deviceSessionAppStateSub.remove();
    deviceSessionAppStateSub = null;
  }
}

/**
 * Another device claimed this account (single-device login). Tear down our
 * own device-session watchers, sign out (revokes little locally — the real
 * revocation already happened server-side via GOTRUE_SESSIONS_SINGLE_PER_USER
 * — but keeps local state honest), and flag it so a global notice can tell
 * the user why.
 */
async function handleDeviceKicked(client: SupabaseClient): Promise<void> {
  teardownDeviceSession(client);
  useDeviceKickStore.getState().setKicked(true);
  try {
    const { error } = await client.auth.signOut();
    if (error) {
      logger.warn('handleDeviceKicked: signOut returned an error', error);
    }
  } catch (e) {
    logger.warn('handleDeviceKicked: signOut threw', e);
  } finally {
    useSessionStore.getState().clear();
  }
}

/**
 * Single-device login (see migration `20260718120000_users_active_session.sql`
 * for the full design). This device claims "current" by writing a fresh id to
 * `public.users.active_session_id` and remembering it locally, then watches
 * for another device overwriting it — via Realtime (fast path) plus a 30s
 * poll and an app-foreground recheck, since this stack is known to drop
 * `postgres_changes` events (see presence-liveness-model memory).
 */
async function registerDeviceSession(client: SupabaseClient, session: Session): Promise<void> {
  // Defensive: idempotent, closes a race where two onAuthStateChange events
  // fire back-to-back and would otherwise leak a duplicate channel/poll.
  teardownDeviceSession(client);

  const userId = session.user.id;
  const myId = generateDeviceSessionId();

  try {
    await secureStorage.setItem(SecureKey.DeviceSessionId, myId);
    const { error } = await client
      .from('users')
      .update({ active_session_id: myId })
      .eq('id', userId);
    if (error) {
      logger.warn('registerDeviceSession: failed to claim session', error);
      return;
    }
  } catch (e) {
    logger.warn('registerDeviceSession: exception claiming session', e);
    return;
  }

  const checkForKick = async (): Promise<void> => {
    try {
      const { data, error } = await client
        .from('users')
        .select('active_session_id')
        .eq('id', userId)
        .maybeSingle();
      if (error || !data) {
        return;
      }
      const currentId = (data as { active_session_id?: string | null }).active_session_id;
      if (currentId && currentId !== myId) {
        await handleDeviceKicked(client);
      }
    } catch (e) {
      logger.warn('registerDeviceSession: poll check failed', e);
    }
  };

  deviceSessionChannel = client
    .channel(`public:users:device-session:${userId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
      payload => {
        const newId = (payload.new as { active_session_id?: string | null } | undefined)
          ?.active_session_id;
        if (newId && newId !== myId) {
          void handleDeviceKicked(client);
        }
      },
    )
    .subscribe();

  deviceSessionPollId = setInterval(() => {
    void checkForKick();
  }, DEVICE_SESSION_POLL_MS);

  deviceSessionAppStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      void checkForKick();
    }
  });
}

/**
 * Wires Supabase Auth's `onAuthStateChange` into the store. Returns the
 * subscription handle — caller can `.unsubscribe()` it on app teardown.
 */
export function subscribeSupabaseAuth(client: SupabaseClient): { unsubscribe: () => void } {
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    const store = useSessionStore.getState();

    // CRITICAL: Clear persisted mock session if we are running against real database (USE_MOCK_DATA === false)
    if (session && !USE_MOCK_DATA) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        session.user.id,
      );
      if (!isUuid) {
        logger.info(
          'Detected persisted mock session while USE_MOCK_DATA is false. Clearing session...',
        );
        setTimeout(() => {
          client.auth.signOut().catch(err => {
            logger.error('Failed to sign out mock session', err);
          });
        }, 0);
        return;
      }
    }

    store.setSession(session);

    if (activeChannel) {
      void client.removeChannel(activeChannel);
      activeChannel = null;
    }
    if (chatRequestsChannel) {
      void client.removeChannel(chatRequestsChannel);
      chatRequestsChannel = null;
    }
    teardownDeviceSession(client);

    if (!session) {
      return;
    }

    // DEV_MODE: derive verification status synchronously from the phone — no
    // network, so it's safe to run inside the callback.
    if (USE_MOCK_DATA) {
      if (deriveRole(session) === UserRole.Female) {
        const phone = session.user.phone;
        let status = VerificationStatus.Verified;
        if (phone) {
          const last = phone.charAt(phone.length - 1);
          if (last === '2') {
            status = VerificationStatus.Pending;
          } else if (last === '3') {
            status = VerificationStatus.None;
          }
        }
        store.setVerificationStatus(status);
      }
      return;
    }

    // CRITICAL: never `await` Supabase calls directly inside this callback.
    // supabase-js holds the GoTrue auth lock for the duration of the callback;
    // an awaited PostgREST/auth call re-acquires that same lock and deadlocks,
    // leaving the triggering verifyOtp / updateUser promise pending forever.
    // Defer the async hydration so the lock is released first.
    setTimeout(() => {
      void hydrateSessionRoleAndStatus(client, session);
    }, 0);

    // Register this device's FCM token now that we're authenticated (deferred
    // so the GoTrue auth lock is released first — same reason as above).
    setTimeout(() => {
      void fcmService.syncToken();
    }, 0);

    // Claim single-device login for this account (deferred — same lock reason
    // as above).
    setTimeout(() => {
      void registerDeviceSession(client, session);
    }, 0);

    // Subscribe to realtime updates on females table for the current user to get live verification status updates
    if (deriveRole(session) === UserRole.Female) {
      const femaleId = session.user.id;
      activeChannel = client
        .channel(`public:females:id=eq.${femaleId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'females',
            filter: `id=eq.${femaleId}`,
          },
          payload => {
            const newStatus = payload.new?.verification_status;
            if (newStatus) {
              store.setVerificationStatus(parseVerificationStatus(newStatus));
            }
          },
        )
        .subscribe();

      // Subscribe to realtime updates on chat_requests table to show the incoming request modal
      chatRequestsChannel = client
        .channel(`public:chat_requests:female_id=eq.${femaleId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_requests',
            filter: `female_id=eq.${femaleId}`,
          },
          async payload => {
            if (payload.eventType === 'INSERT') {
              const req = payload.new;
              if (req && req.status === 'pending') {
                try {
                  const { data: maleData, error: maleError } = await client
                    .from('users')
                    .select('name, profile_picture_url')
                    .eq('id', req.male_id)
                    .maybeSingle();

                  if (!maleError && maleData) {
                    useChatRequestStore.getState().setIncoming({
                      id: req.id,
                      requesterName: maleData.name,
                      requesterAvatarUrl: maleData.profile_picture_url,
                      coinAmount: req.chat_cost_coins,
                      receivedAt: new Date(req.sent_at || Date.now()),
                    });
                  }
                } catch (e) {
                  logger.error('Failed to handle incoming chat request realtime event', e);
                }
              }
            } else if (payload.eventType === 'UPDATE') {
              const req = payload.new;
              const currentIncoming = useChatRequestStore.getState().incoming;
              if (
                req &&
                currentIncoming &&
                req.id === currentIncoming.id &&
                req.status !== 'pending'
              ) {
                useChatRequestStore.getState().clear();
              }
            }
          },
        )
        .subscribe();
    }
  });

  return {
    unsubscribe: () => {
      data.subscription.unsubscribe();
      if (activeChannel) {
        void client.removeChannel(activeChannel);
        activeChannel = null;
      }
      if (chatRequestsChannel) {
        void client.removeChannel(chatRequestsChannel);
        chatRequestsChannel = null;
      }
      teardownDeviceSession(client);
    },
  };
}

/**
 * Deferred (post-lock) hydration of role + female verification status from the
 * database. Called via setTimeout from the auth-state-change callback so the
 * GoTrue auth lock is already released — see the comment at the call site.
 */
async function hydrateSessionRoleAndStatus(
  client: SupabaseClient,
  session: Session,
): Promise<void> {
  const store = useSessionStore.getState();
  let role = deriveRole(session);

  // Fallback: if the JWT didn't carry a usable role, read it from public.users.
  if (!role) {
    try {
      const { data: dbUser, error: dbError } = await client
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!dbError && dbUser) {
        const parsed = parseUserRole(dbUser.role);
        if (parsed) {
          role = parsed;
          store.setSession({
            ...session,
            user: {
              ...session.user,
              user_metadata: { ...session.user.user_metadata, role },
            },
          });
        }
      }
    } catch (e) {
      logger.error('Failed to fetch user role from db', e);
    }
  }

  if (role === UserRole.Female) {
    try {
      const { data: resData, error } = await client
        .from('females')
        .select('verification_status')
        .eq('id', session.user.id)
        .maybeSingle();
      if (error) {
        logger.error('Failed to fetch female verification status', error);
        return;
      }
      store.setVerificationStatus(parseVerificationStatus(resData?.verification_status));
    } catch (err) {
      logger.error(
        'Failed to fetch female verification status',
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}

export function parseRoleFromMetadata(meta: unknown): UserRole | null {
  if (typeof meta !== 'object' || meta === null) {
    return null;
  }
  return parseUserRole((meta as Record<string, unknown>).role);
}

export { parseVerificationStatus };
