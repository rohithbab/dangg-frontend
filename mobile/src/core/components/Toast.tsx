import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

export type ToastProps = {
  /** Message to show; `null` hides the toast. */
  message: string | null;
  /** Called after the toast has faded out — clear the driving state here. */
  onHide: () => void;
  /** How long the message stays fully visible before fading out. */
  durationMs?: number;
};

/**
 * Lightweight themed confirmation toast. Fades up from the bottom, holds, then
 * fades out and calls `onHide`. Render once near a screen's root and drive it
 * with a `message` state. Non-interactive (passes touches through).
 */
function Toast({ message, onHide, durationMs = 2400 }: ToastProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    if (!message) {
      return undefined;
    }
    opacity.value = withTiming(1, { duration: 180 });
    translateY.value = withTiming(0, { duration: 180 });
    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(12, { duration: 200 }, finished => {
        if (finished) {
          runOnJS(onHide)();
        }
      });
    }, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, onHide, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) {
    return null;
  }
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { bottom: insets.bottom + AppSpacing.xl }, style]}
    >
      <Text style={[styles.toast, AppShadows.e2]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: AppSpacing.lg,
    right: AppSpacing.lg,
    alignItems: 'center',
  },
  toast: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
    textAlign: 'center',
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.full,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.sm + 2,
  },
});

export default Toast;
