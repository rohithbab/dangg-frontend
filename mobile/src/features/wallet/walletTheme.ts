import { type ViewStyle } from 'react-native';

/**
 * Premium fintech design tokens — SCOPED TO THE WALLET FEATURE ONLY.
 *
 * Deliberately separate from the global `@theme` so this redesign does not
 * touch Home / Profile / auth etc. Matte obsidian surfaces, soft glass,
 * restrained accents (no neon glow), large radii — a Revolut / Coinbase /
 * Apple-Wallet aesthetic.
 */
export const WC = {
  bg: '#0B0B0F',
  surface: '#13131A',
  card: '#181820',
  cardHi: '#1F1F29',

  primary: '#FF4FA3',
  secondary: '#A855F7',
  success: '#22C55E',
  successText: '#4ADE80',
  warning: '#F59E0B',
  blue: '#60A5FA',

  text: '#FFFFFF',
  textDim: '#A1A1AA',
  textFaint: '#71717A',

  divider: 'rgba(255,255,255,0.06)',
  hairline: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.05)',

  primarySoft: 'rgba(255,79,163,0.12)',
  primaryEdge: 'rgba(255,79,163,0.55)',
  successSoft: 'rgba(34,197,94,0.12)',
  successEdge: 'rgba(34,197,94,0.25)',
  secondarySoft: 'rgba(168,85,247,0.14)',
  blueSoft: 'rgba(96,165,250,0.14)',
  warnSoft: 'rgba(245,158,11,0.14)',
  scrim: 'rgba(0,0,0,0.72)',
} as const;

/** Border radii — large, premium. */
export const WR = { sm: 12, md: 16, lg: 20, xl: 24, hero: 28, xxl: 32, pill: 999 } as const;

/** Spacing scale. */
export const WS = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, huge: 36 } as const;

/** Subtle dark elevation presets (no neon glow). */
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
    shadowColor: WC.primary,
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
