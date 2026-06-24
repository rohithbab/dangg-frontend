import { type ViewStyle } from 'react-native';

/**
 * Elevation tokens — combines iOS shadow props and Android `elevation` so a
 * single spread works on both platforms.
 *
 * "DANGG · Neue" is FLAT: surfaces are defined by hairline borders (see
 * colors.ts `border`), not glows. Shadows are reserved for genuinely floating
 * chrome — the bottom nav, bottom sheets, and modals — and are neutral black,
 * not pink.
 *
 *   <View style={[styles.card, AppShadows.e1]} />
 */
type Elevation = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export const AppShadows = {
  /** No shadow — the default for bordered cards. */
  e0: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } satisfies Elevation,

  /** Subtle lift — tappable tiles that sit slightly above the canvas. */
  e1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  } satisfies Elevation,

  /** Soft float — buttons, bottom sheets. */
  e2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  } satisfies Elevation,

  /** Strong float — floating nav, active modals, overlays. */
  e3: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 16,
  } satisfies Elevation,
} as const;

export type ElevationToken = keyof typeof AppShadows;
