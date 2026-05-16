import { type Session, type SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import {
  parseUserRole,
  parseVerificationStatus,
  type UserRole,
  VerificationStatus,
} from '@app-types/domain';

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
  const raw = session.user.app_metadata?.role;
  return parseUserRole(raw);
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

/**
 * Wires Supabase Auth's `onAuthStateChange` into the store. Returns the
 * subscription handle — caller can `.unsubscribe()` it on app teardown.
 */
export function subscribeSupabaseAuth(client: SupabaseClient): { unsubscribe: () => void } {
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    useSessionStore.getState().setSession(session);
  });
  return data.subscription;
}

export function parseRoleFromMetadata(meta: unknown): UserRole | null {
  if (typeof meta !== 'object' || meta === null) {
    return null;
  }
  return parseUserRole((meta as Record<string, unknown>).role);
}

export { parseVerificationStatus };
