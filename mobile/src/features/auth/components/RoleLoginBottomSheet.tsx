import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, ClipPath, G, Defs, Ellipse } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import BottomSheet from '@core/components/BottomSheet';

import { UserRole } from '@app-types/domain';

export type RoleLoginBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (role: UserRole.Female | UserRole.Male) => void;
};

/**
 * Centered Female Face SVG Avatar silhouette.
 */
function FemaleFaceIcon(): React.ReactElement {
  return (
    <Svg width={72} height={72} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id="female-clip">
          <Circle cx={50} cy={50} r={46} />
        </ClipPath>
      </Defs>

      {/* Outer border circle */}
      <Circle cx={50} cy={50} r={46} fill="#FFFFFF" stroke="#E91E63" strokeWidth={4} />

      <G clipPath="url(#female-clip)">
        {/* Shirt/Shoulders */}
        <Path d="M 12 95 C 12 70 30 58 50 58 C 70 58 88 70 88 95 Z" fill="#E91E63" />

        {/* White Collar V shape */}
        <Path d="M 40 58 L 60 58 L 50 68 Z" fill="#FFFFFF" />

        {/* Vertical line down shirt */}
        <Path d="M 50 68 L 50 95" stroke="#FFFFFF" strokeWidth={1.5} />

        {/* Buttons */}
        <Circle cx={50} cy={74} r={2} fill="#FFFFFF" />
        <Circle cx={50} cy={81} r={2} fill="#FFFFFF" />
        <Circle cx={50} cy={88} r={2} fill="#FFFFFF" />

        {/* Neck */}
        <Path d="M 43 48 L 57 48 L 50 60 Z" fill="#FFFFFF" />

        {/* Face */}
        <Ellipse cx={50} cy={42} rx={16.5} ry={18} fill="#FFFFFF" />

        {/* Bob Cut Hair */}
        <Path
          d="M 50 21.5 C 32 21.5 28 34.5 28 58.5 C 33 58.5 35 52.5 35 43.5 C 35 34.5 42 32.5 50 32.5 C 58 32.5 65 34.5 65 43.5 C 65 52.5 67 58.5 72 58.5 C 72 34.5 68 21.5 50 21.5 Z"
          fill="#E91E63"
        />

        {/* Ears/Earrings */}
        <Circle cx={33} cy={43} r={3} fill="#FFFFFF" />
        <Circle cx={67} cy={43} r={3} fill="#FFFFFF" />
      </G>
    </Svg>
  );
}

/**
 * Centered Male Face SVG Avatar silhouette.
 */
function MaleFaceIcon(): React.ReactElement {
  return (
    <Svg width={72} height={72} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id="male-clip">
          <Circle cx={50} cy={50} r={46} />
        </ClipPath>
      </Defs>

      {/* Outer border circle */}
      <Circle cx={50} cy={50} r={46} fill="#FFFFFF" stroke="#1976D2" strokeWidth={4} />

      <G clipPath="url(#male-clip)">
        {/* Shirt/Shoulders */}
        <Path d="M 12 95 C 12 70 30 58 50 58 C 70 58 88 70 88 95 Z" fill="#1976D2" />

        {/* White Tie line down the shirt */}
        <Path d="M 50 58 L 50 95" stroke="#FFFFFF" strokeWidth={3.5} strokeLinecap="round" />

        {/* Neck */}
        <Path d="M 43 46 L 57 46 L 50 58 Z" fill="#FFFFFF" />

        {/* Ears */}
        <Circle cx={31.5} cy={41.5} r={3.5} fill="#FFFFFF" />
        <Circle cx={68.5} cy={41.5} r={3.5} fill="#FFFFFF" />

        {/* Face */}
        <Ellipse cx={50} cy={40} rx={16.5} ry={18} fill="#FFFFFF" />

        {/* Beard */}
        <Path
          d="M 33.5 37 C 33.5 53 40 57 50 57 C 60 57 66.5 53 66.5 37 C 66.5 47 58 50 50 50 C 42 50 33.5 47 33.5 37 Z"
          fill="#1976D2"
        />

        {/* Hair */}
        <Path
          d="M 31.5 35.5 C 30.5 28.5 36 21.5 47 21.5 C 59 21.5 68.5 25 68.5 36 C 65.5 31.5 57 29.5 48.5 31.5 C 40 33.5 33.5 35.5 31.5 35.5 Z"
          fill="#1976D2"
        />
      </G>
    </Svg>
  );
}

type RoleCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  borderColor: string;
  shadowColor: string;
};

/**
 * Tappable card for role login.
 * Uses Reanimated to scale down on press for premium interaction feel.
 */
function RoleCard({
  title,
  description,
  icon,
  onPress,
  borderColor,
  shadowColor,
}: RoleCardProps): React.ReactElement {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      style={styles.cardPressable}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.card,
          {
            borderColor,
            shadowColor,
          },
          animatedStyle,
        ]}
      >
        <View style={styles.iconWrapper}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Bottom sheet shown when an existing user taps "Login".
 * Displays side-by-side cards with stylized female/male faces and role descriptions.
 */
function RoleLoginBottomSheet({
  visible,
  onClose,
  onPick,
}: RoleLoginBottomSheetProps): React.ReactElement {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Login as">
      <View style={styles.body}>
        <RoleCard
          title="Female"
          description="Chat and earn"
          icon={<FemaleFaceIcon />}
          borderColor={AppColors.border}
          shadowColor={AppColors.primary}
          onPress={() => {
            onPick(UserRole.Female);
            onClose();
          }}
        />
        <RoleCard
          title="Male"
          description="Browse and chat"
          icon={<MaleFaceIcon />}
          borderColor="#EAD5DA"
          shadowColor={AppColors.primaryDark}
          onPress={() => {
            onPick(UserRole.Male);
            onClose();
          }}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    gap: AppSpacing.md,
    paddingTop: AppSpacing.sm,
  },
  cardPressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: AppRadii.lg,
    borderWidth: 1.5,
    backgroundColor: AppColors.surface,
    paddingVertical: AppSpacing.lg,
    paddingHorizontal: AppSpacing.sm,
    // Premium soft glowing shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  iconWrapper: {
    marginBottom: AppSpacing.sm,
  },
  cardTitle: {
    ...AppTypography.titleMedium,
    fontWeight: '700',
    color: AppColors.onSurface,
    textAlign: 'center',
    marginBottom: AppSpacing.xs,
  },
  cardDescription: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    paddingHorizontal: AppSpacing.xs,
  },
});

export default RoleLoginBottomSheet;
