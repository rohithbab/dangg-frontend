import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Card from '@core/components/Card';
import PrimaryButton from '@core/components/PrimaryButton';
import { inr } from '@core/utils/formatters';

import { type FemaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'PayoutInReview'>;
type Route = RouteProp<FemaleAppStackParamList, 'PayoutInReview'>;

function ClockIcon(): React.ReactElement {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24">
      <Path
        d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.1.8-1.2-4.5-2.7V7z"
        fill={AppColors.warning}
      />
    </Svg>
  );
}

function PayoutInReviewScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { amount, payoutMethod } = route.params;

  const scale = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });
    pulse.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 1000 }), withTiming(1.0, { duration: 1000 })),
      -1,
      true,
    );
  }, [pulse, scale]);

  useEffect(() => {
    const backAction = (): boolean => true;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const handleDone = (): void => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'FemaleTabs', params: { screen: 'Earnings' } }],
    });
  };

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 1 - (pulse.value - 1) * 3, // fades out as it expands
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.body}>
          {/* Animated Clock Icon wrapper */}
          <View style={styles.iconContainer}>
            <Animated.View style={[styles.pulseCircle, pulseStyle]} />
            <Animated.View style={[styles.iconCircle, scaleStyle]}>
              <ClockIcon />
            </Animated.View>
          </View>

          {/* Text headings */}
          <View style={styles.textBlock}>
            <Text style={styles.title}>Payout In Review</Text>
            <Text style={styles.subtitle}>Your request has been submitted</Text>
          </View>

          {/* Request details card */}
          <Card padding={AppSpacing.lg} containerStyle={styles.detailsCard}>
            <View style={styles.row}>
              <Text style={styles.label}>Withdrawal Amount</Text>
              <Text style={styles.value}>{inr(amount)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Payout Destination</Text>
              <Text style={styles.valueDetail} numberOfLines={1} ellipsizeMode="tail">
                {payoutMethod}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Request Status</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>In Review</Text>
              </View>
            </View>
          </Card>

          {/* Informational help text */}
          <Text style={styles.infoText}>
            Your payout request is being verified. Funds are typically deposited into your linked
            account within 24 to 48 hours.
          </Text>

          <View style={styles.buttonWrapper}>
            <PrimaryButton label="Back to Earnings" onPress={handleDone} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: {
    flexGrow: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.xl,
    gap: AppSpacing.lg,
  },

  // Icon
  iconContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: AppSpacing.sm,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pulseCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.warningLight,
    opacity: 0.4,
    zIndex: 1,
  },

  // Headings
  textBlock: { alignItems: 'center', gap: AppSpacing.xs },
  title: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
    fontWeight: '800',
  },
  subtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
  },

  // Details Card
  detailsCard: {
    width: '100%',
    gap: AppSpacing.md,
    marginTop: AppSpacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: AppSpacing.md,
  },
  label: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    flex: 1,
  },
  value: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    fontWeight: '800',
    textAlign: 'right',
  },
  valueDetail: {
    ...AppTypography.bodyMedium,
    color: AppColors.primaryDark,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.divider,
    width: '100%',
  },
  badge: {
    backgroundColor: AppColors.warningLight,
    borderRadius: AppRadii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: AppColors.warningLight,
  },
  badgeText: {
    ...AppTypography.labelLarge,
    color: AppColors.warning,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Info
  infoText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: AppSpacing.md,
  },

  buttonWrapper: {
    width: '100%',
    marginTop: AppSpacing.md,
  },
});

export default PayoutInReviewScreen;
