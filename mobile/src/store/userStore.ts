import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { type User } from '@app-types/domain';

export type UserState = {
  currentUser: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (value: boolean) => void;
  clear: () => void;
};

/**
 * Current user's profile row. Loaded after session is established (the
 * actual fetch hook will live in `features/auth/hooks/` in the next prompt).
 */
export const useUserStore = create<UserState>()(
  subscribeWithSelector(set => ({
    currentUser: null,
    isLoading: false,
    setUser: (user): void => set({ currentUser: user }),
    setLoading: (value): void => set({ isLoading: value }),
    clear: (): void => set({ currentUser: null, isLoading: false }),
  })),
);

export const useCurrentUser = (): User | null => useUserStore(s => s.currentUser);
