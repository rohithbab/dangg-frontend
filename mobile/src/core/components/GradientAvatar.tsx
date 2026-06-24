import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { InterFont } from '@theme/typography';

/**
 * Deterministic gradient avatars — "DANGG · Neue". When there's no photo we
 * render a vertical brand-tint gradient with a centered initial. The gradient
 * is chosen from a fixed palette by hashing a seed (usually the name) so a
 * given person always gets the same color.
 */
const AVATAR_GRADIENTS: ReadonlyArray<readonly [string, string]> = [
  ['#A6CFB8', '#669980'],
  ['#D0A8C9', '#805980'],
  ['#457BF1', '#294799'],
  ['#DC308F', '#801A59'],
  ['#480C33', '#803366'],
  ['#F5B53D', '#B87E1A'],
];

export function gradientForSeed(seed: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) % 2147483647;
  }
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length] as readonly [string, string];
}

export type GradientAvatarShape = 'circle' | 'squircle';

export type GradientAvatarProps = {
  initials: string;
  size?: number;
  shape?: GradientAvatarShape;
  /** Seed for the gradient palette pick. Defaults to `initials`. */
  seed?: string;
  /** Remote photo — when present, replaces the gradient + initial. */
  uri?: string | null;
  /** Show a green online dot at the bottom-right. */
  online?: boolean;
  /** Border color the online dot punches out against (defaults to canvas black). */
  dotBorderColor?: string;
  style?: ViewStyle;
};

function GradientAvatar({
  initials,
  size = 56,
  shape = 'circle',
  seed,
  uri,
  online = false,
  dotBorderColor = AppColors.background,
  style,
}: GradientAvatarProps): React.ReactElement {
  const radius = shape === 'circle' ? size / 2 : Math.round(size * 0.32);
  const [from, to] = gradientForSeed(seed ?? initials);
  const gradientId = React.useId();
  const dot = Math.round(size * 0.23);

  return (
    <View style={[{ width: size, height: size }, style]}>
      {uri && uri.length > 0 ? (
        <FastImage
          source={{ uri, priority: FastImage.priority.normal }}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={[styles.clip, { width: size, height: size, borderRadius: radius }]}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={from} />
                <Stop offset="1" stopColor={to} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
          </Svg>
          <View style={styles.center}>
            <Text style={[styles.initial, { fontSize: Math.round(size * 0.36) }]}>
              {initials.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        </View>
      )}
      {online ? (
        <View
          style={[
            styles.dot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              borderColor: dotBorderColor,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  initial: {
    fontFamily: InterFont.medium,
    color: '#FFFFFF',
  },
  dot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    backgroundColor: AppColors.onlineGreen,
    borderWidth: 2.5,
  },
});

export default GradientAvatar;
