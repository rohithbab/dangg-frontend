import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

/**
 * Compact brand mark — the gradient dot used beside the "Dangg" wordmark in
 * app headers (Neue). For the full glyph logotype (splash) use `DanggLogo`.
 */
export type LogoMarkProps = {
  size?: number;
  style?: ViewStyle;
};

function LogoMark({ size = 26, style }: LogoMarkProps): React.ReactElement {
  const gradientId = React.useId();
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#F25BAE" />
            <Stop offset="1" stopColor="#9D5CFF" />
          </LinearGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill={`url(#${gradientId})`} />
      </Svg>
    </View>
  );
}

export default LogoMark;
