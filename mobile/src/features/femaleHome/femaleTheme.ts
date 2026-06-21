import { type ViewStyle } from 'react-native';

export const FC = {
  bg: '#09090B',
  surface: '#121217',
  card: '#18181F',
  cardHi: '#20202A',

  primary: '#FF4FA3',
  secondary: '#9D5CFF',
  success: '#22C55E',
  successText: '#4ADE80',
  warning: '#F59E0B',
  error: '#EF4444',

  text: '#FFFFFF',
  textDim: '#A1A1AA',
  textFaint: '#71717A',

  border: 'rgba(255,255,255,0.06)',
  hairline: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.05)',
  glassStrong: 'rgba(0,0,0,0.45)',

  primarySoft: 'rgba(255,79,163,0.14)',
  primaryEdge: 'rgba(255,79,163,0.55)',
  successSoft: 'rgba(34,197,94,0.12)',
  secondarySoft: 'rgba(157,92,255,0.14)',
  errorSoft: 'rgba(239,68,68,0.12)',
  scrim: 'rgba(0,0,0,0.72)',
  overlay: 'rgba(0,0,0,0.78)',

  onlineGreen: '#22C55E',
  offlineGray: '#52525B',
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
