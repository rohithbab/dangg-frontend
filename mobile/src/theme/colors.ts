/**
 * Single source of truth for color tokens.
 *
 * Never hard-code `#xxxxxx` outside this file. Material-style component
 * styling lives in `theme.ts`; raw token values live here.
 */
export const AppColors = {
  // Female palette — soft coral / pink.
  femalePrimary: '#EC5A86',
  femalePrimaryLight: '#FFD0DD',
  femalePrimaryDark: '#C83D69',

  // Male palette — soft blue / teal.
  malePrimary: '#2E86C1',
  malePrimaryLight: '#BDE2F4',
  malePrimaryDark: '#1F5F8B',

  // Brand-neutral primary (used in role-agnostic screens like onboarding).
  brandPrimary: '#2C2C54',

  // Neutrals.
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F3F4F6',
  onSurface: '#1F2937',
  onSurfaceMuted: '#6B7280',
  divider: '#E5E7EB',
  border: '#D1D5DB',

  // Semantic.
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#2563EB',

  // Status indicators.
  onlineGreen: '#22C55E',
  offlineGray: '#9CA3AF',
  availableYellow: '#FACC15',

  // On-color tokens.
  onPrimary: '#FFFFFF',
  onError: '#FFFFFF',

  // Overlay / scrim.
  scrim: 'rgba(0,0,0,0.6)',
  shimmerBase: '#E0E0E0',
  shimmerHighlight: '#F5F5F5',
  transparent: 'transparent',
} as const;

export type AppColor = keyof typeof AppColors;
