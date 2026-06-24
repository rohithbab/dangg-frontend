import { type ViewStyle } from 'react-native';

/**
 * Female-home feature tokens — reconciled onto the global "DANGG · Neue"
 * palette (see src/theme/colors.ts). Local alias object kept so existing call
 * sites keep compiling; values mirror the central tokens.
 */
export const FC = {
  bg: '#000000',
  surface: '#101013',
  card: '#141417',
  cardHi: '#1C1C20',

  primary: '#DC308F',
  secondary: '#9D5CFF',
  success: '#34D399',
  successText: '#4ADE80',
  warning: '#F5A524',
  error: '#EF4444',

  text: '#FFFFFF',
  textDim: '#8E8E96',
  textFaint: '#5A5A62',

  border: 'rgba(255,255,255,0.06)',
  hairline: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.05)',
  glassStrong: 'rgba(0,0,0,0.45)',

  primarySoft: 'rgba(220,48,143,0.14)',
  primaryEdge: 'rgba(220,48,143,0.55)',
  successSoft: 'rgba(52,211,153,0.12)',
  secondarySoft: 'rgba(157,92,255,0.14)',
  errorSoft: 'rgba(239,68,68,0.12)',
  scrim: 'rgba(0,0,0,0.72)',
  overlay: 'rgba(0,0,0,0.78)',

  onlineGreen: '#34D399',
  offlineGray: '#5A5A62',
} as const;

export const FR = { sm: 12, md: 16, lg: 20, xl: 24, hero: 28, pill: 999 } as const;
export const FS = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, huge: 36 } as const;

export const FShadow = {
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
  hero: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 10,
  },
} satisfies Record<string, ViewStyle>;

export const FGradient = [FC.primary, FC.secondary] as const;
