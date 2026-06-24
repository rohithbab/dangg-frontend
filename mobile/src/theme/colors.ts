/**
 * Single source of truth for color tokens. Never hard-code `#xxxxxx`
 * outside this file — keep every color literal here so the theme stays
 * swappable from one place.
 *
 * "DANGG · Neue" palette: a pure-black canvas (#000000) with #101012 cards
 * outlined by hairline white borders, a deep saturated magenta-pink accent
 * (#DC308F), and restrained semantic + feature-tint colors. Elevation is flat
 * (borders, not glows) — see shadows.ts.
 */

export const lightColors = {
  // Brand — Neue magenta-pink accent
  primary: '#DC308F',
  primaryDark: '#B81F74',
  primaryLight: '#F25BAE',
  primarySubtle: '#1A0A12',

  // Glow / translucent pink helpers (rgba so they layer over dark surfaces)
  primaryGlow: 'rgba(220, 48, 143, 0.22)',
  primaryOutline: 'rgba(220, 48, 143, 0.35)',
  primaryBorderSoft: 'rgba(220, 48, 143, 0.18)',
  primaryBorderSubtle: 'rgba(220, 48, 143, 0.10)',

  // Background hierarchy — pure-black canvas, near-black raised surfaces.
  background: '#000000',
  surface: '#101012',
  surfaceVariant: '#161618',
  surfaceHigh: '#1C1C20',

  // Text
  onPrimary: '#FFFFFF',
  onSurface: '#FFFFFF',
  onSurfaceMuted: '#8E8E96',
  onSurfaceDisabled: '#5A5A62',
  onError: '#FFFFFF',

  // Borders & dividers — hairline white lines (matches Neue cards)
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  divider: 'rgba(255, 255, 255, 0.07)',

  // Semantic
  success: '#34D399',
  successLight: '#06241B',
  warning: '#F5A524',
  warningLight: '#2A1E08',
  error: '#EF4444',
  errorLight: '#2A1012',
  info: '#457BF1',
  infoLight: '#0C1B38',

  // Status indicators
  onlineGreen: '#34D399',
  offlineGray: '#5A5A62',
  availableYellow: '#F5A524',
  neonGreen: '#34D399',

  // Coin / gold palette
  coinGold: '#F5B53D',
  coinGoldLight: '#FCD34D',
  coinGoldDark: '#D9920B',

  // Feature-card tint anchors (Welcome cards — horizontal fade over surface)
  featureGreen: '#A6CFB8',
  featureMauve: '#D0A8C9',
  featureBlue: '#457BF1',

  // Gradient anchors
  gradientRoseStart: '#F25BAE',
  gradientRoseEnd: '#DC308F',
  gradientRoseSubtleStart: '#160A11',
  gradientRoseSubtleEnd: '#000000',
  gradientVioletStart: '#DC308F',
  gradientVioletEnd: '#7B2CBF',
  splashBackground: '#FF66C4',

  // Utility
  scrim: 'rgba(0,0,0,0.7)',
  shimmerBase: '#141416',
  shimmerHighlight: '#1F1F22',
  transparent: 'transparent',
} as const;

// App is dark-only; dark === light so the proxy below always has a value.
export const darkColors = lightColors;

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
