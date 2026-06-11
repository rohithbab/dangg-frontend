import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { UserRole } from '@app-types/domain';

export type AccountTypeCardProps = {
  role: UserRole.Female | UserRole.Male;
  title: string;
  subtitle: string;
  onPress: () => void;
};

/**
 * Venus symbol (♀) inside a pink/rose gradient circle.
 */
function FemaleIcon(): React.ReactElement {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="femaleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={AppColors.splashBackground} />
          <Stop offset="100%" stopColor={AppColors.primary} />
        </LinearGradient>
      </Defs>
      <Circle cx={32} cy={32} r={32} fill="url(#femaleGradient)" />
      <Circle cx={32} cy={24} r={9} stroke="white" strokeWidth={3.5} fill="none" />
      <Line
        x1={32}
        y1={33}
        x2={32}
        y2={49}
        stroke="white"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Line
        x1={25}
        y1={41}
        x2={39}
        y2={41}
        stroke="white"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Mars symbol (♂) inside a dark purple/rose gradient circle.
 */
function MaleIcon(): React.ReactElement {
  return (
    <Svg width={64} height={64} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="maleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={AppColors.primaryDark} />
          <Stop offset="100%" stopColor={AppColors.primary} />
        </LinearGradient>
      </Defs>
      <Circle cx={32} cy={32} r={32} fill="url(#maleGradient)" />
      <Circle cx={25} cy={39} r={9} stroke="white" strokeWidth={3.5} fill="none" />
      <Line
        x1={31.5}
        y1={32.5}
        x2={47}
        y2={17}
        stroke="white"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Line
        x1={38}
        y1={17}
        x2={47}
        y2={17}
        stroke="white"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1={47}
        y1={17}
        x2={47}
        y2={26}
        stroke="white"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Vector SVG Chevron Right icon.
 */
function ChevronRight({ color }: { color: string }): React.ReactElement {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5l7 7-7 7"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Tappable card used on the role-selection screen.
 *
 * Press feedback uses Reanimated `withTiming` for a subtle 0.98 scale dip.
 * Rebuilt for a premium, expensive aesthetic: clean white background, soft
 * rose borders, dynamic vector-based gender icons, and glowing drop shadows.
 */
function AccountTypeCard({
  role,
  title,
  subtitle,
  onPress,
}: AccountTypeCardProps): React.ReactElement {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isFemale = role === UserRole.Female;
  const chevronColor = isFemale ? AppColors.primary : AppColors.primaryDark;

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
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.iconContainer}>{isFemale ? <FemaleIcon /> : <MaleIcon />}</View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <ChevronRight color={chevronColor} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 110,
    borderRadius: AppRadii.lg,
    borderWidth: 1,
    borderColor: AppColors.gradientRoseSubtleStart, // #FFE4EC
    backgroundColor: AppColors.surface, // #FFFFFF
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.md,
    // Premium soft pink shadow
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 4,
  },
  iconContainer: {
    marginRight: AppSpacing.md,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...AppTypography.titleLarge,
    color: AppColors.onSurface,
    fontWeight: '700',
  },
  subtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.xs,
  },
});

export default AccountTypeCard;
