import { AppColors } from './colors';
import { AppRadii } from './radii';
import { AppShadows } from './shadows';
import { AppSpacing } from './spacing';
import { AppTypography } from './typography';

/**
 * Combined theme. v1 is light-only — `darkTheme` exists as a slot but
 * returns the same tokens.
 */
export const lightTheme = {
  colors: AppColors,
  typography: AppTypography,
  spacing: AppSpacing,
  radii: AppRadii,
  shadows: AppShadows,
  scheme: 'light',
} as const;

export const darkTheme = lightTheme;

export type Theme = typeof lightTheme;
