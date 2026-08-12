import { type RealtimeChannel, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus } from 'react-native';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { USE_MOCK_DATA } from '@core/config/env';
import { fcmService } from '@core/services/fcmService';
import { PrefsKey, prefsStorage } from '@core/storage/prefsStorage';
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
  /**
   * One-shot flag: she went pending → verified during this session and hasn't
   * seen the celebratory toast yet. Set only on a genuine approval (realtime
   * promotion or the "Got it" re-check), consumed on the female home screen.
   * Transient — never persisted, reset on logout, so an already-verified user
   * logging in does not see it.
   */
  justVerified: boolean;
  /**
   * False until the first Supabase auth event has been processed AND (when a
   * session was restored) role + verification status have been hydrated.
   *
   * Navigation must not route while this is false: the Keychain restore is
   * async, so the first frames always look logged-out. Routing on that stale
   * state is what bounced restored users back to Login.
   */
  bootstrapped: boolean;
  setSession: (session: Session | null) => void;
  setVerificationStatus: (status: VerificationStatus) => void;
  setJustVerified: (value: boolean) => void;
  setBootstrapped: (value: boolean) => void;
  clear: () => void;
};

/**
 * Last-known verification status, mirrored to MMKV on every write.
 *
 * Reads are sub-millisecond, so this is safe to call during store creation —
 * which is the point: the very first render already knows whether she is
 * pending, and doesn't bounce her out of the verification flow.
 */
function readPersistedVerificationStatus(): VerificationStatus {
  try {
    return parseVerificationStatus(prefsStorage.getString(PrefsKey.LastVerificationStatus));
  } catch (e) {
    logger.warn('readPersistedVerificationStatus failed', e);
    return VerificationStatus.None;
  }
}

function persistVerificationStatus(status: VerificationStatus): void {
  try {
    prefsStorage.setString(PrefsKey.LastVerificationStatus, status);
  } catch (e) {
    logger.warn('persistVerificationStatus failed', e);
  }
}

function clearPersistedVerification(): void {
  try {
    prefsStorage.remove(PrefsKey.LastVerificationStatus);
    prefsStorage.remove(PrefsKey.LastUserId);
  } catch (e) {
    logger.warn('clearPersistedVerification failed', e);
  }
}

/**
 * Drops a persisted status that belongs to a different account. Without this,
 * signing in as a second female on the same device would inherit the previous
 * user's verification state for the first frame.
 */
function reconcilePersistedUser(userId: string): void {
  try {
    const previous = prefsStorage.getString(PrefsKey.LastUserId);
    if (previous !== userId) {
      prefsStorage.remove(PrefsKey.LastVerificationStatus);
      prefsStorage.setString(PrefsKey.LastUserId, userId);
    }
  } catch (e) {
    logger.warn('reconcilePersistedUser failed', e);
  }
}

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
    // Seeded from the last hydration so a cold start routes correctly on the
    // first frame — including offline, where the network refresh never lands.
    verificationStatus: readPersistedVerificationStatus(),
    justVerified: false,
    bootstrapped: false,

    setSession: (session): void => set({ session, role: deriveRole(session) }),

    setVerificationStatus: (status): void => {
      persistVerificationStatus(status);
      set({ verificationStatus: status });
    },

    setJustVerified: (value): void => set({ justVerified: value }),

    setBootstrapped: (value): void => set({ bootstrapped: value }),

    clear: (): void => {
      // A logged-out user must receive nothing — drop any pending incoming
      // chat-request card so the global modal can't linger after sign-out.
      useChatRequestStore.getState().clear();
      clearPersistedVerification();
      // `bootstrapped` deliberately survives a logout: boot already happened,
      // and resetting it would drop the app back to the splash gate.
      set({
        session: null,
        role: null,
        verificationStatus: VerificationStatus.None,
        justVerified: false,
      });
    },
  })),
);

/** Selector hooks for ergonomic, narrow subscriptions. */
export const useSession = (): Session | null => useSessionStore(s => s.session);
export const useIsAuthenticated = (): boolean => useSessionStore(s => s.session !== null);
export const useSessionRole = (): UserRole | null => useSessionStore(s => s.role);
export const useVerificationStatus = (): VerificationStatus =>
  useSessionStore(s => s.verificationStatus);
export const useJustVerified = (): boolean => useSessionStore(s => s.justVerified);
export const useIsBootstrapped = (): boolean => useSessionStore(s => s.bootstrapped);
/**
 * Authenticated, but signup never got past the Profile step — `public.users`
 * has no role for them. Routing sends these users back to SignupProfile
 * instead of Login so a force-close mid-signup resumes where it left off.
 */
export const useNeedsProfile = (): boolean =>
  useSessionStore(s => s.session !== null && s.role === null);

let activeChannel: RealtimeChannel | null = null;
let chatRequestsChannel: RealtimeChannel | null = null;
let deviceSessionChannel: RealtimeChannel | null = null;
let deviceSessionPollId: ReturnType<typeof setInterval> | null = null;
let deviceSessionAppStateSub: { remove: () => void } | null = null;

const DEVICE_SESSION_POLL_MS = 30000;

/**
 * Bumped on every `registerDeviceSession` call so overlapping invocations can
 * tell whether they are still the current one.
 *
 * Without it the function was self-defeating: it tears down synchronously but
 * then awaits before installing its watchers, so two auth events (a cold-start
 * INITIAL_SESSION followed closely by TOKEN_REFRESHED, say) interleave —
 *
 *   A: teardown → await claim (writes id A)
 *   B: teardown (nothing installed yet) → await claim (writes id B)
 *   A: resumes, installs a poll holding myId = A
 *   B: resumes, overwrites the module handles — A's interval is never cleared
 *
 * A's orphaned poll then reads the server's id B, sees B !== A, concludes
 * another device took over, and signs the user out. One device, no second
 * login, spontaneous logout.
 */
let deviceSessionGeneration = 0;

/**
 * Serialises registrations so two never interleave.
 *
 * The generation guard alone is not enough: a superseded invocation could
 * still have written its id to `users.active_session_id` before noticing, and
 * if that write landed last the *current* watcher would read an id it did not
 * recognise and sign the user out. Queuing means a stale invocation is
 * recognised as stale before it writes anything at all.
 */
let deviceSessionChain: Promise<void> = Promise.resolve();

/**
 * Math.random-based UUID v4. Not cryptographically strong, but doesn't need
 * to be — this is a device-liveness marker for equality comparison, not a
 * security token (see the migration header for the real security boundary).
 * Must be a real UUID string: `active_session_id` is a UUID column.
 */
function generateDeviceSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const value = char === 'x' ? Math.floor(Math.random() * 16) : 8 + Math.floor(Math.random() * 4);
    return value.toString(16);
  });
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
 * — but keeps local state honest), clear the now-stale local device id, and
 * flag it so a global notice can tell the user why.
 */
async function handleDeviceKicked(client: SupabaseClient): Promise<void> {
  teardownDeviceSession(client);
  useDeviceKickStore.getState().setKicked(true);
  try {
    await secureStorage.removeItem(SecureKey.DeviceSessionId);
  } catch (e) {
    logger.warn('handleDeviceKicked: failed to clear local device id', e);
  }
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
 * Writes a fresh device-session id for `userId`, both locally and on the
 * row, and returns it. Callers use the returned id to key the Realtime/poll
 * comparisons below.
 */
async function claimDeviceSession(client: SupabaseClient, userId: string): Promise<string | null> {
  const myId = generateDeviceSessionId();
  try {
    await secureStorage.setItem(SecureKey.DeviceSessionId, myId);
    const { error } = await client
      .from('users')
      .update({ active_session_id: myId })
      .eq('id', userId);
    if (error) {
      logger.warn('claimDeviceSession: failed to claim session', error);
      return null;
    }
    return myId;
  } catch (e) {
    logger.warn('claimDeviceSession: exception claiming session', e);
    return null;
  }
}

/**
 * Single-device login (see migration `20260718120000_users_active_session.sql`
 * for the full design). A genuine fresh login (`isFreshSignIn`) claims "current"
 * outright. A session *restore* (cold start / token refresh) checks the row
 * against the id we last claimed BEFORE writing anything — if another device
 * claimed it while this device was closed, this is where that surfaces: the
 * kicked notice fires the moment the app is reopened, instead of this device
 * silently re-claiming itself and un-kicking. Either way, once "current" is
 * settled, this device watches for another device overwriting it — via
 * Realtime (fast path) plus a 30s poll and an app-foreground recheck, since
 * this stack is known to drop `postgres_changes` events (see
 * presence-liveness-model memory).
 */
function registerDeviceSession(
  client: SupabaseClient,
  session: Session,
  isFreshSignIn: boolean,
): Promise<void> {
  const generation = ++deviceSessionGeneration;
  deviceSessionChain = deviceSessionChain
    .then(() => runRegisterDeviceSession(client, session, isFreshSignIn, generation))
    .catch(e => {
      logger.warn('registerDeviceSession failed', e);
    });
  return deviceSessionChain;
}

async function runRegisterDeviceSession(
  client: SupabaseClient,
  session: Session,
  isFreshSignIn: boolean,
  generation: number,
): Promise<void> {
  /** True once a newer registration has been requested; this one must not act. */
  const superseded = (): boolean => generation !== deviceSessionGeneration;

  // Checked before anything is written. A registration that was queued behind
  // a newer one drops out here, so it can never leave a stale id on the row.
  if (superseded()) {
    return;
  }

  teardownDeviceSession(client);

  const userId = session.user.id;
  let myId: string | null = null;

  if (isFreshSignIn) {
    myId = await claimDeviceSession(client, userId);
  } else {
    const priorLocalId = await secureStorage.getItem(SecureKey.DeviceSessionId);
    if (superseded()) {
      return;
    }
    if (priorLocalId) {
      const { data, error } = await client
        .from('users')
        .select('active_session_id')
        .eq('id', userId)
        .maybeSingle();
      if (superseded()) {
        return;
      }
      const serverId = (data as { active_session_id?: string | null } | null)?.active_session_id;
      if (!error && serverId && serverId !== priorLocalId) {
        await handleDeviceKicked(client);
        return;
      }
      // Already the current device — keep the existing id instead of minting a
      // new one. Re-claiming on every auth event (each token refresh included)
      // rewrote the row constantly for no benefit, and every write was another
      // chance for an in-flight watcher to see an id it did not recognise.
      if (serverId && serverId === priorLocalId) {
        myId = priorLocalId;
      }
    }
    if (!myId) {
      myId = await claimDeviceSession(client, userId);
    }
  }

  if (!myId || superseded()) {
    return;
  }

  // A newer invocation may have installed watchers while we awaited; drop them
  // before installing ours so only one set is ever live.
  teardownDeviceSession(client);

  const checkForKick = async (): Promise<void> => {
    // Signing the user out is the most destructive thing this module does, so
    // a closure that has been superseded must never reach that call.
    if (superseded()) {
      return;
    }
    try {
      const { data, error } = await client
        .from('users')
        .select('active_session_id')
        .eq('id', userId)
        .maybeSingle();
      if (error || !data || superseded()) {
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
        if (superseded()) {
          return;
        }
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
    if (state === 'active' && !superseded()) {
      void checkForKick();
    }
  });
}

/**
 * Wires Supabase Auth's `onAuthStateChange` into the store. Returns the
 * subscription handle — caller can `.unsubscribe()` it on app teardown.
 */
export function subscribeSupabaseAuth(client: SupabaseClient): { unsubscribe: () => void } {
  const { data } = client.auth.onAuthStateChange((event, session) => {
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
      // Signed out — explicit logout OR token/refresh expiry. Drop any pending
      // incoming chat-request card so nothing pops up while logged out (this
      // path doesn't run `clear()`).
      useChatRequestStore.getState().clear();
      // Nothing to hydrate: routing can proceed immediately.
      store.setBootstrapped(true);
      return;
    }

    // Guard against inheriting the previous account's persisted routing state.
    reconcilePersistedUser(session.user.id);

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
      store.setBootstrapped(true);
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
    // as above). A fresh SIGNED_IN claims outright; any other event with a
    // session (cold-start restore, token refresh) checks first — see
    // registerDeviceSession's doc comment for why that distinction matters.
    setTimeout(() => {
      void registerDeviceSession(client, session, event === 'SIGNED_IN');
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
              const parsed = parseVerificationStatus(newStatus);
              // Pending → verified promotion: flag it so the female home shows a
              // one-time "you're verified" toast when RootNavigator lands her.
              const prev = useSessionStore.getState().verificationStatus;
              if (parsed === VerificationStatus.Verified && prev !== VerificationStatus.Verified) {
                store.setJustVerified(true);
              }
              store.setVerificationStatus(parsed);
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
  try {
    await hydrateSessionRoleAndStatusInner(client, session);
  } finally {
    // Routing unblocks even when hydration failed (offline, expired token).
    // The persisted verification status seeded at store creation carries the
    // routing decision in that case, so a pending female still lands on the
    // "waiting for approval" screen rather than being bounced to Login.
    useSessionStore.getState().setBootstrapped(true);
  }
}

async function hydrateSessionRoleAndStatusInner(
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
      // Best-effort hydration — role falls back to the JWT-derived value, so a
      // transient failure (e.g. an access token expiring right before
      // auto-refresh catches up) is not fatal. warn, not error, so it doesn't
      // trip the dev red-box for an expected/recoverable condition.
      logger.warn('Failed to fetch user role from db', e);
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
        logger.warn('Failed to fetch female verification status', error);
        return;
      }
      store.setVerificationStatus(parseVerificationStatus(resData?.verification_status));
    } catch (err) {
      logger.warn(
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
