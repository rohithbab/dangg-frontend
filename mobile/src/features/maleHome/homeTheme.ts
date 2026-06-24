import { type ViewStyle } from 'react-native';

/**
 * Male-home feature tokens — now reconciled onto the global "DANGG · Neue"
 * palette (see src/theme/colors.ts). Kept as a local alias object so the
 * feature's existing call sites keep compiling; values mirror the central
 * tokens. New work should import from `@theme` directly.
 */
export const HC = {
  bg: '#000000',
  surface: '#101013',
  card: '#141417',
  cardHi: '#1C1C20',

  primary: '#DC308F',
  secondary: '#9D5CFF',
  success: '#34D399',
  successText: '#4ADE80',

  text: '#FFFFFF',
  textDim: '#8E8E96',
  textFaint: '#5A5A62',

  border: 'rgba(255,255,255,0.06)',
  hairline: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.05)',
  glassStrong: 'rgba(0,0,0,0.45)',

  primarySoft: 'rgba(220,48,143,0.14)',
  secondarySoft: 'rgba(157,92,255,0.14)',
  scrim: 'rgba(0,0,0,0.72)',
  overlay: 'rgba(0,0,0,0.78)',
} as const;

export const HR = { sm: 12, md: 16, lg: 20, xl: 24, card: 22, pill: 999 } as const;
export const HS = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

/** Soft dark elevation (flat — no neon glow). */
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
