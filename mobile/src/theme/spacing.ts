import { moderateScale } from './responsive';

/**
 * Spacing scale. Use these tokens instead of raw numeric padding/margin.
 * Composable: `AppSpacing.md + AppSpacing.sm` is fine.
 *
 * Each step is width-responsive (see `responsive.ts`): the baseline values
 * below are what you get on a ~393dp phone, and they scale gently up/down on
 * wider/narrower devices so padding never looks cramped or loose.
 */
export const AppSpacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
} as const;

export type SpacingToken = keyof typeof AppSpacing;
