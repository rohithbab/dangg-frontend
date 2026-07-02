import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

export type PrimaryButtonVariant = 'filled' | 'white' | 'danger' | 'success';

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
 * Primary call-to-action button — "DANGG · Neue".
 *
 * Flat fills (no gradient/glow), 18px corners, Inter Medium label. Variants:
 *  - `filled`  magenta-pink fill, white label (default CTA)
 *  - `white`   white fill, black label (Welcome "Get started", high-contrast)
 *  - `danger` / `success` flat semantic fills
 *
 * States: default / pressed / disabled / loading. `loading` blocks press and
 * swaps the label for a spinner.
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
  const isWhite = variant === 'white';

  const background = disabled
    ? '#2C2C30'
    : variant === 'danger'
      ? AppColors.error
      : variant === 'success'
        ? AppColors.success
        : isWhite
          ? '#FFFFFF'
          : AppColors.primary;

  const labelColor = disabled
    ? AppColors.onSurfaceDisabled
    : isWhite
      ? '#000000'
      : AppColors.onPrimary;

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
        { backgroundColor: background },
        AppShadows.e2,
        { opacity: pressed && !isBlocked ? 0.9 : 1 },
        loading && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: AppRadii.button,
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start' },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: AppSpacing.sm },
  label: {
    fontFamily: InterFont.medium,
    fontSize: 16,
    letterSpacing: 0,
  },
});

export default PrimaryButton;
