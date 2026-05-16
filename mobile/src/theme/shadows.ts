import { type ViewStyle } from 'react-native';

/**
 * Elevation tokens — combines iOS shadow props and Android `elevation` so a
 * single spread works on both platforms.
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

  /** Light surface lift — cards, tappable tiles. */
  e1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  } satisfies Elevation,

  /** Sheets, popovers. */
  e2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  } satisfies Elevation,

  /** Modals, full-screen overlays. */
  e3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  } satisfies Elevation,
} as const;

export type ElevationToken = keyof typeof AppShadows;
