import { type RealtimeChannel, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { USE_MOCK_DATA } from '@core/config/env';
import { logger } from '@core/utils/logger';

import {
  parseUserRole,
  parseVerificationStatus,
  UserRole,
  VerificationStatus,
} from '@app-types/domain';

import { useChatRequestStore } from '../features/chatRequests/store/chatRequestStore';

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

/**
 * Wires Supabase Auth's `onAuthStateChange` into the store. Returns the
 * subscription handle — caller can `.unsubscribe()` it on app teardown.
 */
export function subscribeSupabaseAuth(client: SupabaseClient): { unsubscribe: () => void } {
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    const store = useSessionStore.getState();
    store.setSession(session);

    if (activeChannel) {
      void client.removeChannel(activeChannel);
      activeChannel = null;
    }
    if (chatRequestsChannel) {
      void client.removeChannel(chatRequestsChannel);
      chatRequestsChannel = null;
    }

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
