import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

export type SecondaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  testID?: string;
};

/** Outlined variant. Mirrors [PrimaryButton]'s API for direct swap-in. */
function SecondaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  testID,
}: SecondaryButtonProps): React.ReactElement {
  const isBlocked = disabled || loading;

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
        { opacity: pressed && !isBlocked ? 0.6 : 1 },
        isBlocked && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={AppColors.primary} />
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
    backgroundColor: AppColors.surface,
    borderWidth: 1.5,
    borderColor: AppColors.border,
  },
  full: { alignSelf: 'stretch' },
  inline: { alignSelf: 'flex-start' },
  disabled: { opacity: 0.55 },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: AppSpacing.sm },
  label: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
  },
});

export default SecondaryButton;
