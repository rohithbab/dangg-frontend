/**
 * Single source of truth for color tokens. Never hard-code `#xxxxxx`
 * outside this file — ESLint will flag any drift.
 *
 * v2 palette: vibrant rose throughout. The app sits on a faint rose-white
 * `background`, with white `surface` reserved for cards and elevated areas
 * that pop against the rose base. Role differentiation (male vs female)
 * lives in iconography, copy, and screen content — not in color.
 */
export const AppColors = {
  // Brand — vibrant rose
  primary: '#D81B60',
  primaryDark: '#880E4F',
  primaryLight: '#F8BBD0',
  primarySubtle: '#FCE4EC',

  // Background hierarchy. `background` is rose-tinted, NOT pure white.
  background: '#FFF5F8',
  surface: '#FFFFFF',
  surfaceVariant: '#FFE4EC',
  surfaceHigh: '#FFFFFF',

  // Text
  onPrimary: '#FFFFFF',
  onSurface: '#1A0E11',
  onSurfaceMuted: '#7A5560',
  onSurfaceDisabled: '#C2A8B0',
  onError: '#FFFFFF',

  // Borders & dividers
  border: '#F4C2D0',
  borderStrong: '#E89AB0',
  divider: '#FCE4EC',

  // Semantic — neutral hues, distinct from brand rose
  success: '#2E7D32',
  successLight: '#C8E6C9',
  warning: '#ED6C02',
  warningLight: '#FFE0B2',
  error: '#C62828',
  errorLight: '#FFCDD2',
  info: '#1976D2',
  infoLight: '#BBDEFB',

  // Status indicators
  onlineGreen: '#4CAF50',
  offlineGray: '#9E9E9E',
  availableYellow: '#FFB300',

  // Gradient anchors (splash, account-type cards, hero areas)
  gradientRoseStart: '#FF4081',
  gradientRoseEnd: '#D81B60',
  gradientRoseSubtleStart: '#FFE4EC',
  gradientRoseSubtleEnd: '#FFF5F8',

  // Utility
  scrim: 'rgba(26,14,17,0.6)',
  shimmerBase: '#F4C2D0',
  shimmerHighlight: '#FFE4EC',
  transparent: 'transparent',
} as const;

export type AppColorKey = keyof typeof AppColors;

/** @deprecated Use AppColorKey — alias kept so older imports compile. */
export type AppColor = AppColorKey;
