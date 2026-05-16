import { lightTheme, type Theme } from './theme';

/**
 * Returns the current theme. v1 always returns `lightTheme`; the hook
 * shape lets us swap to context-based theming later (dark mode toggle)
 * without touching every call site.
 */
export function useTheme(): Theme {
  return lightTheme;
}
