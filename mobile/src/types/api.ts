/** Shared API response envelope shape (when an endpoint returns one). */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};
