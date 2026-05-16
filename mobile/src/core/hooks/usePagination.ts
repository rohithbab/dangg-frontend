import { useCallback, useState } from 'react';

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../config/constants';

export type PaginationState = {
  page: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type PaginationApi = PaginationState & {
  nextPage: () => void;
  prevPage: () => void;
  setHasMore: (value: boolean) => void;
  reset: () => void;
};

/**
 * Offset-based pagination state for list screens. For cursor-based, see
 * [`useCursorPagination`] below.
 */
export function usePagination(initialLimit: number = DEFAULT_PAGE_SIZE): PaginationApi {
  const limit = Math.min(Math.max(initialLimit, 1), MAX_PAGE_SIZE);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const nextPage = useCallback(() => {
    if (hasMore) {
      setPage(p => p + 1);
    }
  }, [hasMore]);

  const prevPage = useCallback(() => setPage(p => Math.max(0, p - 1)), []);

  const reset = useCallback(() => {
    setPage(0);
    setHasMore(true);
  }, []);

  return {
    page,
    limit,
    offset: page * limit,
    hasMore,
    nextPage,
    prevPage,
    setHasMore,
    reset,
  };
}

export type CursorPagination<TCursor> = {
  cursor: TCursor | null;
  setCursor: (cursor: TCursor | null) => void;
  hasMore: boolean;
  setHasMore: (value: boolean) => void;
  reset: () => void;
};

/** Cursor-based variant for endpoints that return a `next_cursor`. */
export function useCursorPagination<TCursor>(): CursorPagination<TCursor> {
  const [cursor, setCursor] = useState<TCursor | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const reset = useCallback(() => {
    setCursor(null);
    setHasMore(true);
  }, []);

  return { cursor, setCursor, hasMore, setHasMore, reset };
}
