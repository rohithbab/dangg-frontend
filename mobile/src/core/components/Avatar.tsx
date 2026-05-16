import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';

import { AppColors } from '@theme/colors';
import { AppTypography } from '@theme/typography';

/**
 * Kept for API back-compat. With the unified rose palette every variant
 * resolves to the same fallback colors — gender now drives default
 * illustrations (when added), not background tint.
 */
export enum AvatarGender {
  Female = 'female',
  Male = 'male',
  Neutral = 'neutral',
}

export type AvatarProps = {
  uri?: string | null;
  size?: number;
  gender?: AvatarGender;
  /** Two-letter initials shown when there's no image. */
  initials?: string;
  borderColor?: string;
  borderWidth?: number;
};

/**
 * Circular avatar — cached via FastImage with an initials fallback.
 * Never reach for `<Image source={{ uri }}>` — always go through this.
 */
function Avatar({
  uri,
  size = 48,
  initials = '?',
  borderColor,
  borderWidth = 0,
}: AvatarProps): React.ReactElement {
  const radius = size / 2;
  const border =
    borderWidth > 0 ? { borderColor: borderColor ?? AppColors.surface, borderWidth } : null;

  if (uri && uri.length > 0) {
    return (
      <View style={[{ width: size, height: size, borderRadius: radius }, border]}>
        <FastImage
          source={{ uri, priority: FastImage.priority.normal }}
          style={[styles.image, { width: size, height: size, borderRadius: radius }]}
          resizeMode={FastImage.resizeMode.cover}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
        border,
      ]}
    >
      <Text style={[styles.text, { fontSize: Math.round(size * 0.4) }]}>
        {initials.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: AppColors.primarySubtle },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primarySubtle,
  },
  text: {
    ...AppTypography.titleMedium,
    color: AppColors.primary,
  },
});

export default Avatar;
