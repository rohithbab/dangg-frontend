import { useMemo } from 'react';
import { type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SafeAreaStyles = {
  top: ViewStyle;
  bottom: ViewStyle;
  vertical: ViewStyle;
  horizontal: ViewStyle;
  all: ViewStyle;
};

/**
 * Memoised padding styles derived from current safe-area insets. Spread
 * directly into a `View` style array — saves having to thread `insets`
 * through every component.
 */
export function useSafeAreaStyles(): SafeAreaStyles {
  const insets = useSafeAreaInsets();
  return useMemo<SafeAreaStyles>(
    () => ({
      top: { paddingTop: insets.top },
      bottom: { paddingBottom: insets.bottom },
      vertical: { paddingTop: insets.top, paddingBottom: insets.bottom },
      horizontal: { paddingLeft: insets.left, paddingRight: insets.right },
      all: {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      },
    }),
    [insets.top, insets.bottom, insets.left, insets.right],
  );
}
