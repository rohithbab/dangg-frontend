import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type IncomingChatRequest = {
  id: string;
  requesterName: string;
  requesterAvatarUrl: string | null;
  coinAmount: number;
  receivedAt: Date;
  requesterRating?: number;
  requesterTotalChats?: number;
  requesterOnlineStatus?: 'online' | 'offline' | 'away' | 'busy';
};

type ChatRequestState = {
  incoming: IncomingChatRequest | null;
  setIncoming: (request: IncomingChatRequest | null) => void;
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
  subscribeWithSelector(set => ({
    incoming: null,
    setIncoming: (request): void => set({ incoming: request }),
    clear: (): void => set({ incoming: null }),
  })),
);
