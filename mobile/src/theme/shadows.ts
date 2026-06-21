import { type ViewStyle } from 'react-native';

import { AppColors } from './colors';

/**
 * Elevation tokens — combines iOS shadow props and Android `elevation` so a
 * single spread works on both platforms.
 *
 * v2 "Neon Glow": instead of black drop shadows, elevated surfaces cast a
 * vibrant pink (#FF66C4) under-glow so cards, sheets and modals feel lit.
 *
 *   <View style={[styles.card, AppShadows.e1]} />
 */
type Elevation = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export const AppShadows = {
  /** No shadow. */
  e0: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } satisfies Elevation,

  /** Light neon glow — cards, tags, tappable tiles. */
  e1: {
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  } satisfies Elevation,

  /** Medium neon glow — bottom sheets, buttons, status segments. */
  e2: {
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  } satisfies Elevation,

  /** High intense glow — confirmation overlays, active modals, active profiles. */
  e3: {
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 10,
  } satisfies Elevation,
} as const;

export type ElevationToken = keyof typeof AppShadows;
