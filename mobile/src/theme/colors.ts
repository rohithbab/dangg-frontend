/**
 * Single source of truth for color tokens. Never hard-code `#xxxxxx`
 * outside this file — ESLint will flag any drift.
 */

export const lightColors = {
  // Brand — vibrant pink accent
  primary: '#E91E63',
  primaryDark: '#B5179E',
  primaryLight: '#FF6B9D',
  primarySubtle: '#3A1321',

  // Background hierarchy. `background` is a clean neutral, NOT pink-tinted.
  background: '#1C1C1C',
  surface: '#242424',
  surfaceVariant: '#2E2E2E',
  surfaceHigh: '#242424',

  // Text
  onPrimary: '#FFFFFF',
  onSurface: '#FFFFFF',
  onSurfaceMuted: '#A0A0A8',
  onSurfaceDisabled: '#4A4A55',
  onError: '#FFFFFF',

  // Borders & dividers — neutral, not pink-tinted
  border: '#3A3A3A',
  borderStrong: '#3A3A3A',
  divider: '#3A3A3A',

  // Semantic — modern fintech/social status colors
  success: '#10B981',
  successLight: '#062E21',
  warning: '#FF8020',
  warningLight: '#2D1E0C',
  error: '#EF4444',
  errorLight: '#3B1212',
  info: '#3B82F6',
  infoLight: '#0E2347',

  // Status indicators
  onlineGreen: '#10B981',
  offlineGray: '#4A4A55',
  availableYellow: '#EAB308',

  // Coin / gold palette
  coinGold: '#F59E0B',
  coinGoldLight: '#FDE047',
  coinGoldDark: '#D97706',

  // Gradient anchors
  gradientRoseStart: '#E91E63',
  gradientRoseEnd: '#FF6B9D',
  gradientRoseSubtleStart: '#1F0E16',
  gradientRoseSubtleEnd: '#1C1C1C',
  splashBackground: '#FF66C4',

  // Utility
  scrim: 'rgba(0,0,0,0.7)',
  shimmerBase: '#242424',
  shimmerHighlight: '#3A3A3A',
  transparent: 'transparent',
} as const;

export const darkColors = {
  // Brand — vibrant pink accent
  primary: '#E91E63',
  primaryDark: '#B5179E',
  primaryLight: '#FF6B9D',
  primarySubtle: '#3A1321',

  // Background hierarchy
  background: '#1C1C1C',
  surface: '#242424',
  surfaceVariant: '#2E2E2E',
  surfaceHigh: '#242424',

  // Text
  onPrimary: '#FFFFFF',
  onSurface: '#FFFFFF',
  onSurfaceMuted: '#A0A0A8',
  onSurfaceDisabled: '#4A4A55',
  onError: '#FFFFFF',

  // Borders & dividers
  border: '#3A3A3A',
  borderStrong: '#3A3A3A',
  divider: '#3A3A3A',

  // Semantic
  success: '#34D399',
  successLight: '#062E21',
  warning: '#FF8020',
  warningLight: '#2D1E0C',
  error: '#EF4444',
  errorLight: '#3B1212',
  info: '#3B82F6',
  infoLight: '#0E2347',

  // Status indicators
  onlineGreen: '#34D399',
  offlineGray: '#4A4A55',
  availableYellow: '#EAB308',

  // Coin / gold palette
  coinGold: '#F59E0B',
  coinGoldLight: '#FDE047',
  coinGoldDark: '#D97706',

  // Gradient anchors
  gradientRoseStart: '#E91E63',
  gradientRoseEnd: '#FF6B9D',
  gradientRoseSubtleStart: '#1F0E16',
  gradientRoseSubtleEnd: '#1C1C1C',
  splashBackground: '#FF66C4',

  // Utility
  scrim: 'rgba(0,0,0,0.7)',
  shimmerBase: '#242424',
  shimmerHighlight: '#3A3A3A',
  transparent: 'transparent',
} as const;

let themeScheme: 'light' | 'dark' = 'dark';

export function setThemeScheme(_scheme: 'light' | 'dark') {
  themeScheme = 'dark';
}

export function isDarkMode() {
  return true;
}

export const AppColors = new Proxy(lightColors, {
  get(_target, prop) {
    const key = prop as keyof typeof lightColors;
    if (themeScheme === 'dark') {
      return darkColors[key] ?? lightColors[key];
    }
    return lightColors[key];
  },
}) as typeof lightColors;

export type AppColorKey = keyof typeof lightColors;

/** @deprecated Use AppColorKey — alias kept so older imports compile. */
export type AppColor = AppColorKey;
