import { type TextStyle } from 'react-native';

import { AppColors } from './colors';

/**
 * Type-scale tokens.
 *
 * `fontFamily` is left undefined (system default) for v1. To swap to Inter
 * later, drop `assets/fonts/Inter-*.ttf` files, link them, and set
 * `fontFamily: 'Inter'` here. Explicit `lineHeight` + `letterSpacing` are
 * set on every style so layout stays deterministic across devices.
 */
const base: Pick<TextStyle, 'color'> = {
  color: AppColors.onSurface,
};

export const AppTypography = {
  displayLarge: {
    ...base,
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 46,
    letterSpacing: -0.5,
  } satisfies TextStyle,

  headlineLarge: {
    ...base,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.25,
  } satisfies TextStyle,

  headlineMedium: {
    ...base,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
  } satisfies TextStyle,

  titleLarge: {
    ...base,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  } satisfies TextStyle,

  titleMedium: {
    ...base,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  } satisfies TextStyle,

  bodyLarge: {
    ...base,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  } satisfies TextStyle,

  bodyMedium: {
    ...base,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } satisfies TextStyle,

  bodySmall: {
    ...base,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: AppColors.onSurfaceMuted,
  } satisfies TextStyle,

  labelLarge: {
    ...base,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.1,
  } satisfies TextStyle,

  labelSmall: {
    ...base,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.3,
    color: AppColors.onSurfaceMuted,
  } satisfies TextStyle,
} as const;

export type TypographyToken = keyof typeof AppTypography;
