import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { Env } from '@core/config/env';

type WalletState = {
  /** Current coin balance. Shared across Home pill, Wallet hero, request flows. */
  coinBalance: number;
  /** Total coins ever purchased — lifetime stat shown on Profile. */
  totalCoinsPurchased: number;
  /** Lifetime chats started — Profile stat. */
  chatsStarted: number;
  setBalance: (next: number) => void;
  /** Optimistic local mutation; reconcile with backend on next refetch. */
  spend: (coins: number) => void;
  credit: (coins: number) => void;
  setTotals: (data: { totalCoinsPurchased: number; chatsStarted: number }) => void;
};

/**
 * Male wallet store. The coin balance lives here so every consumer reads
 * the same number — the Home pill, the Wallet hero, the Female Profile
 * Preview CTA, and the chat-request confirmation modal stay in sync.
 *
 * Subscribe with selectors only — `useWalletStore(s => s.coinBalance)` —
 * to avoid re-rendering on unrelated slice changes.
 */
export const useWalletStore = create<WalletState>()(
  subscribeWithSelector((set, get) => ({
    coinBalance: Env.devMode ? 500 : 0,
    totalCoinsPurchased: Env.devMode ? 1000 : 0,
    chatsStarted: Env.devMode ? 14 : 0,

    setBalance: (next): void => set({ coinBalance: Math.max(0, next) }),

    spend: (coins): void => {
      const current = get().coinBalance;
      set({ coinBalance: Math.max(0, current - coins) });
    },

    credit: (coins): void => {
      const current = get().coinBalance;
      set({ coinBalance: current + coins });
    },

    setTotals: ({ totalCoinsPurchased, chatsStarted }): void =>
      set({ totalCoinsPurchased, chatsStarted }),
  })),
);

export const useCoinBalance = (): number => useWalletStore(s => s.coinBalance);
