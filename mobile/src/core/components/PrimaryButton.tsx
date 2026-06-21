import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

export type PrimaryButtonVariant = 'filled' | 'danger' | 'success';

export type PrimaryButtonProps = {
  /** Visible label. Replaced by a spinner when `loading` is true. */
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: PrimaryButtonVariant;
  /** Defaults to full-width. Pass `false` for inline use. */
  fullWidth?: boolean;
  /** Optional leading icon — render any element (e.g. `<Icon />`). */
  leftIcon?: React.ReactNode;
  testID?: string;
};

/**
 * Premium pink gradient fill (#FF66C4 → #FF8EC6) rendered via an absolutely
 * positioned SVG behind the label. The corners are rounded on the SVG `Rect`
 * (rather than clipping the Pressable) so the `e2` neon under-glow is not
 * masked on iOS. A solid `primary` base color sits under the gradient so
 * Android `elevation` still has a surface to cast its glow from.
 */
function GradientFill(): React.ReactElement {
  const gradientId = React.useId();
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={AppColors.gradientRoseStart} />
          <Stop offset="1" stopColor={AppColors.gradientRoseEnd} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" rx={AppRadii.md} fill={`url(#${gradientId})`} />
    </Svg>
  );
}

/**
 * Primary call-to-action button. The default `filled` variant uses a premium
 * pink gradient + neon under-glow; `danger`/`success` keep flat semantic fills.
 * States: default / pressed / disabled / loading. `loading=true` blocks press
 * and swaps the label for a spinner.
 */
function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'filled',
  fullWidth = true,
  leftIcon,
  testID,
}: PrimaryButtonProps): React.ReactElement {
  const isBlocked = disabled || loading;
  const isFilled = variant === 'filled';
  const flatBackground =
    variant === 'danger'
      ? AppColors.error
      : variant === 'success'
        ? AppColors.success
        : AppColors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      onPress={isBlocked ? undefined : onPress}
      disabled={isBlocked}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        fullWidth ? styles.full : styles.inline,
        { backgroundColor: flatBackground },
        isFilled && AppShadows.e2,
        { opacity: pressed && !isBlocked ? 0.9 : 1 },
        isBlocked && styles.disabled,
      ]}
    >
      {isFilled ? <GradientFill /> : null}
      {loading ? (
        <ActivityIndicator color={AppColors.onPrimary} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: AppRadii.md,
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  full: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start' },
  disabled: { opacity: 0.55 },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: AppSpacing.sm },
  label: {
    ...AppTypography.labelLarge,
    color: AppColors.onPrimary,
  },
});

export default PrimaryButton;
