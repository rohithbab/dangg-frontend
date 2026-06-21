import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { WC, WGradient } from '../walletTheme';

/**
 * Rounded-rect linear-gradient fill that sits behind a view.
 *
 * The `<Svg>` is wrapped in an absolute-fill `<View>` (rather than putting
 * `absoluteFill` on the `<Svg>` itself) so the SVG's `100%` width/height
 * resolve against a concrete parent box — otherwise react-native-svg can
 * collapse the height and the gradient only fills part of the container.
 */
export function GradientFill({
  radius = 16,
  colors = WGradient,
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

/**
 * Frosted balance-card backdrop: matte base with two soft, low-opacity radial
 * glows (purple top-right, pink bottom-left) — premium, not neon.
 */
export function HeroBackdrop({ radius = 28 }: { radius?: number }): React.ReactElement {
  const base = React.useId();
  const glowA = React.useId();
  const glowB = React.useId();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={base} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1A1A22" />
            <Stop offset="1" stopColor="#141419" />
          </LinearGradient>
          <RadialGradient id={glowA} cx="88%" cy="2%" r="72%">
            <Stop offset="0" stopColor={WC.secondary} stopOpacity="0.24" />
            <Stop offset="1" stopColor={WC.secondary} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={glowB} cx="2%" cy="100%" r="72%">
            <Stop offset="0" stopColor={WC.primary} stopOpacity="0.16" />
            <Stop offset="1" stopColor={WC.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={`url(#${base})`} />
        <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={`url(#${glowA})`} />
        <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={`url(#${glowB})`} />
      </Svg>
    </View>
  );
}
