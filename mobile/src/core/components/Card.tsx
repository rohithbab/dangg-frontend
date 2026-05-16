import React from 'react';
import { Pressable, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows, type ElevationToken } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';

export type CardProps = ViewProps & {
  children: React.ReactNode;
  padding?: number;
  /** Elevation level 0..3 (mirrors AppShadows tokens). */
  elevation?: ElevationToken;
  /** Becomes tappable when set — renders Pressable with ink-style feedback. */
  onPress?: () => void;
  /** Override the outer container style (use sparingly). */
  containerStyle?: ViewStyle;
};

/**
 * Standard card wrapper: consistent radius/padding/shadow.
 * Pass `onPress` for the tappable variant.
 */
function Card({
  children,
  padding = AppSpacing.md,
  elevation = 'e1',
  onPress,
  containerStyle,
  ...rest
}: CardProps): React.ReactElement {
  const elev = AppShadows[elevation];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          elev,
          { padding },
          { opacity: pressed ? 0.85 : 1 },
          containerStyle,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View {...rest} style={[styles.base, elev, { padding }, containerStyle]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
  },
});

export default Card;
