/**
 * Single source of truth for color tokens. Never hard-code `#xxxxxx`
 * outside this file — keep every color literal here so the theme stays
 * swappable from one place.
 *
 * v2 "Vibrant Splash" palette: the splash pink (#FF66C4) is now the brand
 * primary, layered over a deep obsidian surface stack so neon-pink glows and
 * gradients pop.
 */

export const lightColors = {
  // Brand — vibrant splash pink accent
  primary: '#FF66C4',
  primaryDark: '#E64DB0',
  primaryLight: '#FF8EC6',
  primarySubtle: '#1F0E16',

  // Glow / translucent pink helpers (rgba so they layer over dark surfaces)
  primaryGlow: 'rgba(255, 102, 196, 0.25)',
  primaryOutline: 'rgba(255, 102, 196, 0.3)',
  primaryBorderSoft: 'rgba(255, 102, 196, 0.15)',
  primaryBorderSubtle: 'rgba(255, 102, 196, 0.08)',

  // Background hierarchy — deep obsidian so surfaces & glows stand out.
  background: '#0B0B0C',
  surface: '#141416',
  surfaceVariant: '#1D1D21',
  surfaceHigh: '#202024',

  // Text
  onPrimary: '#FFFFFF',
  onSurface: '#FFFFFF',
  onSurfaceMuted: '#A0A0A8',
  onSurfaceDisabled: '#4A4A55',
  onError: '#FFFFFF',

  // Borders & dividers — high-contrast boundary lines
  border: '#242429',
  borderStrong: '#2E2E34',
  divider: '#242429',

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
  neonGreen: '#39FF8B',

  // Coin / gold palette
  coinGold: '#F59E0B',
  coinGoldLight: '#FDE047',
  coinGoldDark: '#D97706',

  // Gradient anchors
  gradientRoseStart: '#FF66C4',
  gradientRoseEnd: '#FF8EC6',
  gradientRoseSubtleStart: '#1F0E16',
  gradientRoseSubtleEnd: '#0B0B0C',
  gradientVioletStart: '#FF66C4',
  gradientVioletEnd: '#7B2CBF',
  splashBackground: '#FF66C4',

  // Utility
  scrim: 'rgba(0,0,0,0.7)',
  shimmerBase: '#1D1D21',
  shimmerHighlight: '#2A2A30',
  transparent: 'transparent',
} as const;

export const darkColors = {
  // Brand — vibrant splash pink accent
  primary: '#FF66C4',
  primaryDark: '#E64DB0',
  primaryLight: '#FF8EC6',
  primarySubtle: '#1F0E16',

  // Glow / translucent pink helpers (rgba so they layer over dark surfaces)
  primaryGlow: 'rgba(255, 102, 196, 0.25)',
  primaryOutline: 'rgba(255, 102, 196, 0.3)',
  primaryBorderSoft: 'rgba(255, 102, 196, 0.15)',
  primaryBorderSubtle: 'rgba(255, 102, 196, 0.08)',

  // Background hierarchy — deep obsidian so surfaces & glows stand out.
  background: '#0B0B0C',
  surface: '#141416',
  surfaceVariant: '#1D1D21',
  surfaceHigh: '#202024',

  // Text
  onPrimary: '#FFFFFF',
  onSurface: '#FFFFFF',
  onSurfaceMuted: '#A0A0A8',
  onSurfaceDisabled: '#4A4A55',
  onError: '#FFFFFF',

  // Borders & dividers — high-contrast boundary lines
  border: '#242429',
  borderStrong: '#2E2E34',
  divider: '#242429',

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
  neonGreen: '#39FF8B',

  // Coin / gold palette
  coinGold: '#F59E0B',
  coinGoldLight: '#FDE047',
  coinGoldDark: '#D97706',

  // Gradient anchors
  gradientRoseStart: '#FF66C4',
  gradientRoseEnd: '#FF8EC6',
  gradientRoseSubtleStart: '#1F0E16',
  gradientRoseSubtleEnd: '#0B0B0C',
  gradientVioletStart: '#FF66C4',
  gradientVioletEnd: '#7B2CBF',
  splashBackground: '#FF66C4',

  // Utility
  scrim: 'rgba(0,0,0,0.7)',
  shimmerBase: '#1D1D21',
  shimmerHighlight: '#2A2A30',
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
