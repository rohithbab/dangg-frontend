/**
 * Spacing scale. Use these tokens instead of raw numeric padding/margin.
 * Composable: `AppSpacing.md + AppSpacing.sm` is fine.
 */
export const AppSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type SpacingToken = keyof typeof AppSpacing;
