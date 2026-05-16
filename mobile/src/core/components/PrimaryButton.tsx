import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
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
 * Primary call-to-action button. Filled background, white label. States:
 * default / pressed / disabled / loading. `loading=true` blocks press and
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
  const background =
    variant === 'danger'
      ? AppColors.error
      : variant === 'success'
        ? AppColors.success
        : AppColors.brandPrimary;

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
        { backgroundColor: background, opacity: pressed && !isBlocked ? 0.85 : 1 },
        isBlocked && styles.disabled,
      ]}
    >
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
