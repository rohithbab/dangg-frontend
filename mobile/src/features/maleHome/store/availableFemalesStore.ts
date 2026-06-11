import { create } from 'zustand';

import { type AvailableFemale } from '../api/maleHomeApi';

/**
 * Cache for the Male Home "Available Now" grid.
 *
 * The list is the single source of truth for the FlashList. Two write paths
 * feed it and they MUST stay deduplicated:
 *   * Pagination (`reset` / `appendPage`) — cursor reads from `browse_females`.
 *   * Realtime merge (`upsert` / `remove`) — a single female toggled presence.
 *
 * Dedup is by `id`. `upsert` puts a freshly-online female at the TOP (most
 * recently available first, matching the default sort), and replaces in place
 * if she's already cached (e.g. a favorite/price change). `remove` drops her
 * the instant she goes offline / loses verification. This means a realtime
 * event costs O(1)–O(n) array work and at most ONE single-row fetch — never a
 * full re-browse — so thousands of concurrent males don't stampede the RPC.
 */
type AvailableFemalesState = {
  items: AvailableFemale[];
  /** id set mirrors `items` for O(1) contains checks during merge. */
  ids: Set<string>;
  totalOnline: number;
  hasMore: boolean;

  /** First page / pull-to-refresh — replaces the whole cache. */
  reset: (items: ReadonlyArray<AvailableFemale>, hasMore: boolean, totalOnline: number) => void;
  /** Infinite-scroll page — appends only ids not already present. */
  appendPage: (items: ReadonlyArray<AvailableFemale>, hasMore: boolean) => void;
  /** Realtime: female came online or her public profile changed. */
  upsert: (female: AvailableFemale) => void;
  /** Realtime: female went offline / unverified / deleted. */
  remove: (femaleId: string) => void;
  /** Optimistic favorite flip from the card heart, kept across re-renders. */
  setFavorited: (femaleId: string, isFavorited: boolean) => void;
  clear: () => void;
};

export const useAvailableFemalesStore = create<AvailableFemalesState>(set => ({
  items: [],
  ids: new Set<string>(),
  totalOnline: 0,
  hasMore: true,

  reset: (items, hasMore, totalOnline): void =>
    set({
      items: [...items],
      ids: new Set(items.map(f => f.id)),
      hasMore,
      totalOnline,
    }),

  appendPage: (items, hasMore): void =>
    set(state => {
      const fresh = items.filter(f => !state.ids.has(f.id));
      if (fresh.length === 0) {
        return { hasMore };
      }
      const ids = new Set(state.ids);
      fresh.forEach(f => ids.add(f.id));
      return { items: [...state.items, ...fresh], ids, hasMore };
    }),

  upsert: (female): void =>
    set(state => {
      if (state.ids.has(female.id)) {
        // Replace in place — keeps scroll position stable.
        return {
          items: state.items.map(f => (f.id === female.id ? female : f)),
        };
      }
      const ids = new Set(state.ids);
      ids.add(female.id);
      return {
        items: [female, ...state.items],
        ids,
        totalOnline: state.totalOnline + 1,
      };
    }),

  remove: (femaleId): void =>
    set(state => {
      if (!state.ids.has(femaleId)) {
        return {};
      }
      const ids = new Set(state.ids);
      ids.delete(femaleId);
      return {
        items: state.items.filter(f => f.id !== femaleId),
        ids,
        totalOnline: Math.max(0, state.totalOnline - 1),
      };
    }),

  setFavorited: (femaleId, isFavorited): void =>
    set(state => ({
      items: state.items.map(f => (f.id === femaleId ? { ...f, isFavorited } : f)),
    })),

  clear: (): void => set({ items: [], ids: new Set<string>(), totalOnline: 0, hasMore: true }),
}));
