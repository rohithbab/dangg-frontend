import { type TextStyle } from 'react-native';

import { AppColors } from './colors';

/**
 * Type-scale tokens — "DANGG · Neue".
 *
 * Font: Inter, bundled as five static weights (see src/assets/fonts +
 * react-native.config.js). Inter's Light/Medium/SemiBold cuts each ship under
 * their OWN family name, so weight selection by `fontWeight` is unreliable on
 * Android. We therefore select the cut explicitly via its PostScript name
 * (`Inter-Light`, `Inter-Regular`, …) which resolves on both iOS (PostScript
 * name) and Android (asset filename). Do NOT also set `fontWeight` — the
 * explicit family already carries the weight.
 *
 * Neue leans on the Light cut for large display text (page titles, balances)
 * with negative tracking, Medium for titles/labels/buttons, Regular for body.
 */
export const InterFont = {
  light: 'Inter-Light',
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

const base: Pick<TextStyle, 'color'> = {
  color: AppColors.onSurface,
};

export const AppTypography = {
  // Hero / page title (H1) — light + tight tracking
  displayLarge: {
    ...base,
    fontFamily: InterFont.light,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -0.8,
  } satisfies TextStyle,

  // Large screen title ("Discover", "Wallet")
  headlineLarge: {
    ...base,
    fontFamily: InterFont.light,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6,
  } satisfies TextStyle,

  // Giant thin numerals — coin balance / earnings ("8,420")
  displayNumeric: {
    ...base,
    fontFamily: InterFont.light,
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: -1.6,
  } satisfies TextStyle,

  // Section title (H2)
  headlineMedium: {
    ...base,
    fontFamily: InterFont.regular,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  } satisfies TextStyle,

  // Accent heading — magenta-pink, legible on black
  headlineAccent: {
    ...base,
    fontFamily: InterFont.medium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: AppColors.primary,
  } satisfies TextStyle,

  // Card title (H3)
  titleLarge: {
    ...base,
    fontFamily: InterFont.medium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  } satisfies TextStyle,

  titleMedium: {
    ...base,
    fontFamily: InterFont.medium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.1,
  } satisfies TextStyle,

  // Body text
  bodyLarge: {
    ...base,
    fontFamily: InterFont.regular,
    fontSize: 16,
    lineHeight: 24,
  } satisfies TextStyle,

  // Caption (14px)
  bodyMedium: {
    ...base,
    fontFamily: InterFont.regular,
    fontSize: 14,
    lineHeight: 20,
  } satisfies TextStyle,

  // Small text
  bodySmall: {
    ...base,
    fontFamily: InterFont.regular,
    fontSize: 12,
    lineHeight: 16,
    color: AppColors.onSurfaceMuted,
  } satisfies TextStyle,

  // UI labels & buttons
  labelLarge: {
    ...base,
    fontFamily: InterFont.medium,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  } satisfies TextStyle,

  labelSmall: {
    ...base,
    fontFamily: InterFont.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    color: AppColors.onSurfaceMuted,
  } satisfies TextStyle,
} as const;

export type TypographyToken = keyof typeof AppTypography;
