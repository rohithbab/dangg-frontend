import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { UserRole } from '@app-types/domain';

const VARIANT_STYLES = {
  [UserRole.Female]: {
    background: AppColors.primarySubtle,
    iconBackground: AppColors.primary,
    chevron: AppColors.primary,
    titleColor: AppColors.primaryDark,
  },
  [UserRole.Male]: {
    background: AppColors.surface,
    iconBackground: AppColors.primaryDark,
    chevron: AppColors.primaryDark,
    titleColor: AppColors.primaryDark,
  },
} as const;

export type AccountTypeCardProps = {
  role: UserRole.Female | UserRole.Male;
  title: string;
  subtitle: string;
  /** Letter shown inside the avatar — F / M today, swap for an asset later. */
  iconGlyph: string;
  onPress: () => void;
};

/**
 * Tappable card used on the role-selection screen.
 *
 * Press feedback uses Reanimated `withTiming` for a subtle 0.98 scale dip
 * instead of `Pressable`'s pressed-opacity, so the colored backgrounds
 * don't visibly wash out under touch.
 */
function AccountTypeCard({
  role,
  title,
  subtitle,
  iconGlyph,
  onPress,
}: AccountTypeCardProps): React.ReactElement {
  const variant = VARIANT_STYLES[role];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPressIn={() => {
        scale.value = withTiming(0.98, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      onPress={onPress}
    >
      <Animated.View
        style={[styles.card, AppShadows.e1, { backgroundColor: variant.background }, animatedStyle]}
      >
        <View style={[styles.iconCircle, { backgroundColor: variant.iconBackground }]}>
          <Text style={styles.iconGlyph}>{iconGlyph}</Text>
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: variant.titleColor }]}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Text style={[styles.chevron, { color: variant.chevron }]}>{'›'}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 140,
    borderRadius: AppRadii.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: AppSpacing.md,
  },
  iconGlyph: {
    ...AppTypography.headlineMedium,
    color: AppColors.onPrimary,
  },
  textBlock: { flex: 1 },
  title: AppTypography.titleLarge,
  subtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.xs,
  },
  chevron: {
    fontSize: 32,
    lineHeight: 32,
    marginLeft: AppSpacing.sm,
  },
});

export default AccountTypeCard;
