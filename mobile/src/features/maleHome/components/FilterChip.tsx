import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { moderateScale } from '@theme/responsive';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

export type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Renders a small leading dot — used for the "Online" chip. */
  leadingDotColor?: string;
};

/** Reusable rose-themed pill — used in chip rows, filter sheets, etc. */
function FilterChip({
  label,
  active,
  onPress,
  leadingDotColor,
}: FilterChipProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
        pressed && styles.chipPressed,
      ]}
    >
      {leadingDotColor ? <View style={[styles.dot, { backgroundColor: leadingDotColor }]} /> : null}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: AppSpacing.md,
    borderRadius: AppRadii.full,
    borderWidth: 1,
    gap: moderateScale(6),
  },
  chipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  chipInactive: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
  },
  chipPressed: { transform: [{ scale: 0.96 }] },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
  },
  labelActive: { color: AppColors.onPrimary },
});

export default FilterChip;
