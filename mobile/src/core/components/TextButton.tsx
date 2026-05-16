import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

export type TextButtonProps = {
  label: string;
  onPress: () => void;
  leftIcon?: React.ReactNode;
  color?: string;
  disabled?: boolean;
  testID?: string;
};

/** Minimal text-only action — "Forgot password?", "Resend OTP", etc. */
function TextButton({
  label,
  onPress,
  leftIcon,
  color = AppColors.brandPrimary,
  disabled = false,
  testID,
}: TextButtonProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        { opacity: pressed && !disabled ? 0.5 : disabled ? 0.4 : 1 },
      ]}
    >
      <View style={styles.row}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: AppSpacing.xs,
    alignSelf: 'flex-start',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: AppSpacing.xs },
  label: AppTypography.labelLarge,
});

export default TextButton;
