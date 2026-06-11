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
const fontFamilyHeadings = 'Poppins';
const fontFamilyBody = 'Plus Jakarta Sans';
const fontFamilyUI = 'Nunito';

const base: Pick<TextStyle, 'color'> = {
  color: AppColors.onSurface,
};

export const AppTypography = {
  // Page Title (H1)
  displayLarge: {
    ...base,
    fontFamily: fontFamilyHeadings,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  } satisfies TextStyle,

  headlineLarge: {
    ...base,
    fontFamily: fontFamilyHeadings,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  } satisfies TextStyle,

  // Section Title (H2)
  headlineMedium: {
    ...base,
    fontFamily: fontFamilyHeadings,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
  } satisfies TextStyle,

  // Card Title (H3)
  titleLarge: {
    ...base,
    fontFamily: fontFamilyHeadings,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  } satisfies TextStyle,

  titleMedium: {
    ...base,
    fontFamily: fontFamilyHeadings,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  } satisfies TextStyle,

  // Body Text
  bodyLarge: {
    ...base,
    fontFamily: fontFamilyBody,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  } satisfies TextStyle,

  // Caption (14px)
  bodyMedium: {
    ...base,
    fontFamily: fontFamilyUI,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } satisfies TextStyle,

  // Small Text
  bodySmall: {
    ...base,
    fontFamily: fontFamilyUI,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: AppColors.onSurfaceMuted,
  } satisfies TextStyle,

  // UI labels & badges
  labelLarge: {
    ...base,
    fontFamily: fontFamilyUI,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.1,
  } satisfies TextStyle,

  labelSmall: {
    ...base,
    fontFamily: fontFamilyUI,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.3,
    color: AppColors.onSurfaceMuted,
  } satisfies TextStyle,
} as const;

export type TypographyToken = keyof typeof AppTypography;
