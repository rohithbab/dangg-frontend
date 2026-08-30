import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type IncomingChatRequest = {
  id: string;
  requesterName: string;
  requesterAvatarUrl: string | null;
  coinAmount: number;
  receivedAt: Date;
  /** Absolute request expiry in epoch ms (server clock) — drives the card's
   *  countdown and matches the male's waiting screen + the backend's accept
   *  guard, so both sides end at the same moment. */
  expiresAt: number;
  requesterRating?: number;
  requesterTotalChats?: number;
  requesterOnlineStatus?: 'online' | 'offline' | 'away' | 'busy';
};

type ChatRequestState = {
  incoming: IncomingChatRequest | null;
  /** Id of the last request the female resolved (accepted / declined / timed
   *  out). Any driver — the poll in IncomingChatRequestListener AND the
   *  realtime subscription in sessionStore — that tries to re-surface the SAME
   *  id is ignored, so a just-cleared card can't loop back while the backend
   *  status flip is still in flight. */
  dismissedId: string | null;
  setIncoming: (request: IncomingChatRequest | null) => void;
  /** Resolve + remember: clears the card and blocks this id from re-appearing. */
  dismiss: (id: string) => void;
  clear: () => void;
};

/**
 * Single-slot store for the currently-displayed incoming chat request.
 *
 * Only one request can be visible at a time. If a new request arrives while
 * one is still on-screen, the newer one wins (the older request will have
 * already auto-declined or been actioned by then, in practice).
 *
 * Subscribe with a selector — `useChatRequestStore(s => s.incoming)`.
 */
export const useChatRequestStore = create<ChatRequestState>()(
  subscribeWithSelector((set, get) => ({
    incoming: null,
    dismissedId: null,
    setIncoming: (request): void => {
      // Ignore a re-surface of an already-resolved request (loop guard). A
      // brand-new request (different id) always passes through.
      if (request && request.id === get().dismissedId) {
        return;
      }
      set({ incoming: request });
    },
    dismiss: (id): void => set({ incoming: null, dismissedId: id }),
    clear: (): void => set({ incoming: null }),
  })),
);
