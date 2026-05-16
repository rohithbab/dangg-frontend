import { useEffect, useState } from 'react';

import { SEARCH_DEBOUNCE_MS } from '../config/constants';

/**
 * Returns a value that updates only after `delayMs` has elapsed without
 * further changes. Use to gate network calls behind search input.
 */
export function useDebounce<T>(value: T, delayMs: number = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
