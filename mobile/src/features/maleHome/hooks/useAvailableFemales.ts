import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRealtimeChannel } from '@core/hooks/useRealtimeChannel';
import { logger } from '@core/utils/logger';

import {
  browseFemales,
  fetchOnlineFemaleIds,
  getFemaleById,
  type AvailableFemale,
} from '../api/maleHomeApi';
import { useAvailableFemalesStore } from '../store/availableFemalesStore';
import { type FemaleFilters, useFemaleFiltersStore } from '../store/femaleFiltersStore';

const PAGE_SIZE = 20;

/**
 * Minimal female row shape delivered by Supabase Realtime on `public.females`.
 * Only the fields the merge logic reads. The realtime payload carries the
 * `females` row (NOT the joined `users` profile), so going-online inserts
 * fetch the public profile separately via `getFemaleById`.
 */
type FemaleRealtimeRow = {
  id: string;
  is_online: boolean;
  verification_status: string;
};

/**
 * Client-side mirror of the `browse_females` filter predicate, used to decide
 * whether a realtime-arriving female belongs in the CURRENT filtered view.
 * Without this, a female who comes online while the male has e.g. a price
 * filter active would wrongly pop into the grid. Online-only is guaranteed by
 * the caller (we only upsert online + verified rows).
 */
function matchesFilters(f: AvailableFemale, filters: FemaleFilters): boolean {
  if (f.age < filters.ageMin || f.age > filters.ageMax) {
    return false;
  }
  if (filters.quick === 'new' && !f.isNew) {
    return false;
  }
  if (filters.quick === 'topRated' && f.rating < 4.5) {
    return false;
  }
  if (filters.quick === 'favorites' && !f.isFavorited) {
    return false;
  }
  if (filters.rating === '3plus' && f.rating < 3) {
    return false;
  }
  if (filters.rating === '4plus' && f.rating < 4) {
    return false;
  }
  if (filters.rating === '4_5plus' && f.rating < 4.5) {
    return false;
  }
  if (filters.price === 'le50' && f.coinPrice > 50) {
    return false;
  }
  if (filters.price === '51to100' && (f.coinPrice <= 50 || f.coinPrice > 100)) {
    return false;
  }
  if (filters.price === '100plus' && f.coinPrice <= 100) {
    return false;
  }
  return true;
}

export type UseAvailableFemales = {
  items: ReadonlyArray<AvailableFemale>;
  totalOnline: number;
  hasMore: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  initialLoaded: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  setFavorited: (femaleId: string, isFavorited: boolean) => void;
};

/**
 * Drives the Male Home discovery grid: cursor pagination + live presence.
 *
 * Pagination reads pages from `browse_females` (online-only, server-filtered)
 * and appends them deduped. A single Realtime channel on `public.females`
 * merges presence changes into the same cache:
 *   * online (transition) / new verified-online row  → fetch public profile,
 *     apply active filters, upsert at the top.
 *   * offline / unverified / delete                  → remove by id.
 *   * still-online metadata-only change (heartbeat)  → ignored (no refetch).
 *
 * RLS guarantees the male only receives events for verified, browseable
 * females (see migration `females_select_browseable`), so we never leak
 * non-browseable rows.
 */
export function useAvailableFemales(): UseAvailableFemales {
  const filters = useFemaleFiltersStore();
  const items = useAvailableFemalesStore(s => s.items);
  const totalOnline = useAvailableFemalesStore(s => s.totalOnline);
  const hasMore = useAvailableFemalesStore(s => s.hasMore);
  const reset = useAvailableFemalesStore(s => s.reset);
  const appendPage = useAvailableFemalesStore(s => s.appendPage);
  const upsert = useAvailableFemalesStore(s => s.upsert);
  const remove = useAvailableFemalesStore(s => s.remove);
  const setFavorited = useAvailableFemalesStore(s => s.setFavorited);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const filtersSnapshot = useMemo<FemaleFilters>(
    () => ({
      quick: filters.quick,
      onlineOnly: filters.onlineOnly,
      ageMin: filters.ageMin,
      ageMax: filters.ageMax,
      rating: filters.rating,
      price: filters.price,
      sortBy: filters.sortBy,
    }),
    [
      filters.quick,
      filters.onlineOnly,
      filters.ageMin,
      filters.ageMax,
      filters.rating,
      filters.price,
      filters.sortBy,
    ],
  );

  // Keep the latest filter snapshot reachable from the realtime callback
  // without re-subscribing the channel on every filter change.
  const filtersRef = useRef(filtersSnapshot);
  filtersRef.current = filtersSnapshot;

  const loadFirstPage = useCallback(async (): Promise<void> => {
    try {
      const {
        items: page,
        hasMore: more,
        totalOnline: online,
      } = await browseFemales(filtersSnapshot, PAGE_SIZE, 0);
      reset(page, more, online);
      setInitialLoaded(true);
    } catch (e) {
      logger.warn('useAvailableFemales.loadFirstPage failed', e);
    }
  }, [filtersSnapshot, reset]);

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  const loadMore = useCallback(async (): Promise<void> => {
    if (loadingMore || !useAvailableFemalesStore.getState().hasMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const offset = useAvailableFemalesStore.getState().items.length;
      const { items: more, hasMore: stillMore } = await browseFemales(
        filtersSnapshot,
        PAGE_SIZE,
        offset,
      );
      appendPage(more, stillMore);
    } catch (e) {
      logger.warn('useAvailableFemales.loadMore failed', e);
    } finally {
      setLoadingMore(false);
    }
  }, [appendPage, filtersSnapshot, loadingMore]);

  // Re-page from scratch whenever the filters change.
  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  // Realtime can miss the "went offline" event (the local stack drops
  // postgres_changes), leaving a card up for a female who toggled off or
  // force-closed her app — she's swept offline server-side but the male never
  // hears about it. Reconcile every 20s: re-check the shown females' online
  // status and drop any that are no longer online. Belt-and-suspenders to the
  // realtime channel below; non-disruptive (no re-paging).
  useEffect(() => {
    const RECONCILE_MS = 20_000;
    const tick = async (): Promise<void> => {
      const shown = useAvailableFemalesStore.getState().items;
      if (shown.length === 0) {
        return;
      }
      try {
        const stillOnline = await fetchOnlineFemaleIds(shown.map(f => f.id));
        for (const f of shown) {
          if (!stillOnline.has(f.id)) {
            remove(f.id);
          }
        }
      } catch (e) {
        logger.debug('useAvailableFemales reconcile failed', e);
      }
    };
    const interval = setInterval(() => {
      void tick();
    }, RECONCILE_MS);
    return () => clearInterval(interval);
  }, [remove]);

  // ── Realtime presence merge ────────────────────────────────────────────
  useRealtimeChannel(
    'male_home_available_females',
    channel =>
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'females' },
        payload => {
          const evt = payload.eventType;
          const oldRow = payload.old as Partial<FemaleRealtimeRow> | null;
          const newRow = payload.new as FemaleRealtimeRow | null;

          if (evt === 'DELETE') {
            if (oldRow?.id) {
              remove(oldRow.id);
            }
            return;
          }
          if (!newRow?.id) {
            return;
          }

          const verifiedOnline =
            newRow.is_online === true && newRow.verification_status === 'verified';

          if (!verifiedOnline) {
            remove(newRow.id);
            return;
          }

          // Skip metadata-only churn (e.g. heartbeat) for someone already shown.
          const wasOnline = oldRow?.is_online === true;
          if (wasOnline && useAvailableFemalesStore.getState().ids.has(newRow.id)) {
            return;
          }

          // Transitioned to online (or appeared) — hydrate public profile,
          // honour the active filters, then merge. One single-row read.
          void getFemaleById(newRow.id)
            .then(f => {
              if (f && f.isOnline && matchesFilters(f, filtersRef.current)) {
                upsert(f);
              } else {
                remove(newRow.id);
              }
            })
            .catch(e => logger.warn('useAvailableFemales realtime hydrate failed', e));
        },
      ),
    [remove, upsert],
  );

  return {
    items,
    totalOnline,
    hasMore,
    refreshing,
    loadingMore,
    initialLoaded,
    refresh,
    loadMore,
    setFavorited,
  };
}
