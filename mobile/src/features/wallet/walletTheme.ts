import { type ViewStyle } from 'react-native';

/**
 * Wallet feature tokens — reconciled onto the global "DANGG · Neue" palette
 * (see src/theme/colors.ts). Local alias object kept so existing call sites
 * keep compiling; values mirror the central tokens.
 */
export const WC = {
  bg: '#000000',
  surface: '#101013',
  card: '#141417',
  cardHi: '#1C1C20',

  primary: '#DC308F',
  secondary: '#9D5CFF',
  success: '#34D399',
  successText: '#4ADE80',
  warning: '#F5A524',
  blue: '#457BF1',

  text: '#FFFFFF',
  textDim: '#8E8E96',
  textFaint: '#5A5A62',

  divider: 'rgba(255,255,255,0.06)',
  hairline: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.05)',

  primarySoft: 'rgba(220,48,143,0.12)',
  primaryEdge: 'rgba(220,48,143,0.55)',
  successSoft: 'rgba(52,211,153,0.12)',
  successEdge: 'rgba(52,211,153,0.25)',
  secondarySoft: 'rgba(157,92,255,0.14)',
  blueSoft: 'rgba(69,123,241,0.14)',
  warnSoft: 'rgba(245,165,36,0.14)',
  scrim: 'rgba(0,0,0,0.72)',
} as const;

/** Border radii — large, premium. */
export const WR = { sm: 12, md: 16, lg: 20, xl: 24, hero: 28, xxl: 32, pill: 999 } as const;

/** Spacing scale. */
export const WS = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, huge: 36 } as const;

/** Subtle dark elevation presets (flat — no neon glow). */
export const WShadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 5,
  },
  hero: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 10,
  },
  primary: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  nav: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 16,
  },
} satisfies Record<string, ViewStyle>;

/** Pink → purple brand gradient anchors (used sparingly). */
export const WGradient = [WC.primary, WC.secondary] as const;
