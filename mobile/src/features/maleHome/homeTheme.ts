import { type ViewStyle } from 'react-native';

/**
 * Premium fintech/dating design tokens — SCOPED TO THE MALE-HOME FEATURE ONLY.
 *
 * Kept separate from the global `@theme` so this visual refresh doesn't touch
 * the rest of the app. Matte obsidian surfaces, soft glass, restrained pink↔
 * violet accents (no neon glow).
 */
export const HC = {
  bg: '#09090B',
  surface: '#121217',
  card: '#18181F',
  cardHi: '#20202A',

  primary: '#FF4FA3',
  secondary: '#9D5CFF',
  success: '#22C55E',
  successText: '#4ADE80',

  text: '#FFFFFF',
  textDim: '#A1A1AA',
  textFaint: '#71717A',

  border: 'rgba(255,255,255,0.06)',
  hairline: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.06)',
  glassStrong: 'rgba(0,0,0,0.45)',

  primarySoft: 'rgba(255,79,163,0.14)',
  secondarySoft: 'rgba(157,92,255,0.14)',
  scrim: 'rgba(0,0,0,0.72)',
  overlay: 'rgba(0,0,0,0.78)',
} as const;

export const HR = { sm: 12, md: 16, lg: 20, xl: 24, card: 24, pill: 999 } as const;
export const HS = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

/** Soft dark elevation (no neon glow). */
export const HShadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 6,
  },
  float: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
} satisfies Record<string, ViewStyle>;

/** Pink → violet brand gradient (used sparingly: rings, primary CTA). */
export const HGradient = [HC.primary, HC.secondary] as const;
