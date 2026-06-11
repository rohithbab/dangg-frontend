/**
 * Single source of truth for color tokens. Never hard-code `#xxxxxx`
 * outside this file — ESLint will flag any drift.
 */

export const lightColors = {
  // Brand — vibrant pink accent
  primary: '#E91E63',
  primaryDark: '#B5179E',
  primaryLight: '#FF6B9D',
  primarySubtle: '#FDE8E9',

  // Background hierarchy. `background` is a clean neutral, NOT pink-tinted.
  background: '#FAFAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F3F4F6',
  surfaceHigh: '#FFFFFF',

  // Text
  onPrimary: '#FFFFFF',
  onSurface: '#121212',
  onSurfaceMuted: '#6B7280',
  onSurfaceDisabled: '#9CA3AF',
  onError: '#FFFFFF',

  // Borders & dividers — neutral, not pink-tinted
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  divider: '#F3F4F6',

  // Semantic — modern fintech/social status colors
  success: '#10B981',
  successLight: '#E6F9F0',
  warning: '#FF8020',
  warningLight: '#FFEDD5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Status indicators
  onlineGreen: '#10B981',
  offlineGray: '#9CA3AF',
  availableYellow: '#EAB308',

  // Coin / gold palette
  coinGold: '#F59E0B',
  coinGoldLight: '#FDE047',
  coinGoldDark: '#D97706',

  // Gradient anchors
  gradientRoseStart: '#E91E63',
  gradientRoseEnd: '#FF6B9D',
  gradientRoseSubtleStart: '#FFF0F5',
  gradientRoseSubtleEnd: '#FAFAFC',
  splashBackground: '#FF66C4',

  // Utility
  scrim: 'rgba(18,18,18,0.5)',
  shimmerBase: '#E5E7EB',
  shimmerHighlight: '#F3F4F6',
  transparent: 'transparent',
} as const;

export const darkColors = {
  // Brand — vibrant pink accent
  primary: '#E91E63',
  primaryDark: '#B5179E',
  primaryLight: '#FF6B9D',
  primarySubtle: '#3A1321',

  // Background hierarchy
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2D2D2D',
  surfaceHigh: '#222222',

  // Text
  onPrimary: '#FFFFFF',
  onSurface: '#F3F4F6',
  onSurfaceMuted: '#9CA3AF',
  onSurfaceDisabled: '#6B7280',
  onError: '#FFFFFF',

  // Borders & dividers
  border: '#2D2D2D',
  borderStrong: '#3F3F46',
  divider: '#1F1F1F',

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
  offlineGray: '#6B7280',
  availableYellow: '#EAB308',

  // Coin / gold palette
  coinGold: '#F59E0B',
  coinGoldLight: '#FDE047',
  coinGoldDark: '#D97706',

  // Gradient anchors
  gradientRoseStart: '#E91E63',
  gradientRoseEnd: '#FF6B9D',
  gradientRoseSubtleStart: '#1F0E16',
  gradientRoseSubtleEnd: '#121212',
  splashBackground: '#FF66C4',

  // Utility
  scrim: 'rgba(0,0,0,0.7)',
  shimmerBase: '#2D2D2D',
  shimmerHighlight: '#333333',
  transparent: 'transparent',
} as const;

let themeScheme: 'light' | 'dark' = 'light';

export function setThemeScheme(scheme: 'light' | 'dark') {
  themeScheme = scheme;
}

export function isDarkMode() {
  return themeScheme === 'dark';
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
