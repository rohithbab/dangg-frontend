import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { HGradient } from '../homeTheme';

/**
 * Rounded-rect linear-gradient fill that sits behind a view (absolute fill).
 * The `<Svg>` is wrapped in an absolute-fill `<View>` so its `100%` dimensions
 * resolve against a concrete box (react-native-svg can otherwise collapse the
 * height). Used for the favorites gradient ring and the primary CTA.
 */
export function GradientFill({
  radius = 16,
  colors = HGradient,
}: {
  radius?: number;
  colors?: readonly [string, string];
}): React.ReactElement {
  const id = React.useId();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
