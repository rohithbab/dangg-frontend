import { create } from 'zustand';

export type DeviceKickState = {
  kicked: boolean;
  setKicked: (kicked: boolean) => void;
};

/**
 * Set by sessionStore's device-session guard when another device logs in on
 * this account (single-device login, see migration
 * `20260718120000_users_active_session.sql`). A global notice mounted in
 * App.tsx watches this to show "logged out — signed in elsewhere" — kept
 * separate from sessionStore so the UI layer doesn't need to import auth
 * internals.
 */
export const useDeviceKickStore = create<DeviceKickState>()(set => ({
  kicked: false,
  setKicked: kicked => set({ kicked }),
}));
