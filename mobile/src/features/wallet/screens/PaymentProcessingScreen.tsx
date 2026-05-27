import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { processPayment } from '../api/walletApi';
import { getPackageById, totalCoinsFor } from '../constants';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'PaymentProcessing'>;
type Route = RouteProp<MaleAppStackParamList, 'PaymentProcessing'>;

const CHECK_PATH_LENGTH = 34;
const AnimatedPath = Animated.createAnimatedComponent(Path);

function AnimatedCheckmark(): React.ReactElement {
  const circleScale = useSharedValue(0);
  const checkProgress = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    circleScale.value = withSpring(1, { damping: 10, stiffness: 220, mass: 0.8 });

    const t = setTimeout(() => {
      checkOpacity.value = withTiming(1, { duration: 50 });
      checkProgress.value = withTiming(1, {
        duration: 550,
        easing: Easing.out(Easing.cubic),
      });
    }, 320);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  const checkAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_PATH_LENGTH * (1 - checkProgress.value),
  }));

  return (
    <Animated.View style={[styles.checkCircle, circleStyle]}>
      <Animated.View style={checkStyle}>
        <Svg width={64} height={64} viewBox="0 0 52 52">
          <AnimatedPath
            animatedProps={checkAnimatedProps}
            d="M14 27 l8 8 16-16"
            stroke={AppColors.success}
            strokeWidth={4}
            fill="none"
            strokeDasharray={CHECK_PATH_LENGTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

type SuccessResult = {
  transactionId: string;
  coinsAdded: number;
  bonusCoins: number;
  amountInr: number;
  newBalance: number;
};

function SuccessPhase({
  result,
  onDone,
}: {
  result: SuccessResult;
  onDone: () => void;
}): React.ReactElement {
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(16);

  useEffect(() => {
    contentOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    contentY.value = withDelay(700, withSpring(0, { damping: 16, stiffness: 120 }));

    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  return (
    <View style={styles.body}>
      <AnimatedCheckmark />
      <Animated.View style={[styles.successText, contentStyle]}>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text
          style={styles.successSubtitle}
        >{`${result.coinsAdded} coins added to your wallet`}</Text>
        <Text style={styles.successHint}>Opening receipt…</Text>
      </Animated.View>
    </View>
  );
}

/**
 * Payment-in-flight screen.
 *
 * Phase 1 — spinner while Razorpay/backend processes.
 * Phase 2 — animated tick (mirrors ChatRequestAcceptedScreen) then navigates
 *            to the receipt screen after 2.2 s.
 */
function PaymentProcessingScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { packageId } = route.params;

  const [running, setRunning] = useState(false);
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const handleDone = useCallback(() => {
    if (!successResult) {
      return;
    }
    navigation.replace('PaymentSuccess', {
      transactionId: successResult.transactionId,
      coinsAdded: successResult.coinsAdded,
      bonusCoins: successResult.bonusCoins,
      amountInr: successResult.amountInr,
      newBalance: successResult.newBalance,
    });
  }, [navigation, successResult]);

  const finalize = useCallback(async (): Promise<void> => {
    if (completedRef.current || running) {
      return;
    }
    setRunning(true);
    try {
      const result = await processPayment(packageId);
      completedRef.current = true;
      if (result.ok) {
        setSuccessResult({
          transactionId: result.transactionId,
          coinsAdded: result.coinsAdded,
          bonusCoins: result.bonusCoins,
          amountInr: getPackageById(packageId)?.priceInr ?? 0,
          newBalance: result.newBalance,
        });
      } else {
        navigation.replace('PaymentFailed', { packageId, reason: result.reason });
      }
    } catch (e) {
      logger.error('Payment finalize failed', e);
      navigation.replace('PaymentFailed', {
        packageId,
        reason: 'Something went wrong, try again',
      });
    }
  }, [navigation, packageId, running]);

  useEffect(() => {
    void finalize();
  }, [finalize]);

  const pkg = getPackageById(packageId);

  if (successResult) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <SuccessPhase result={successResult} onDone={handleDone} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text style={styles.brand}>razorpay</Text>
        <View style={styles.spinnerWrap}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
        <Text style={styles.title}>Processing payment…</Text>
        <Text style={styles.subtitle}>Please don't close the app</Text>
        {pkg ? (
          <Text style={styles.amount}>{`₹${pkg.priceInr} for ${totalCoinsFor(pkg)} coins`}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
    gap: AppSpacing.xl,
  },
  checkCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: AppColors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: { alignItems: 'center', gap: AppSpacing.xs },
  successTitle: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    fontWeight: '800',
  },
  successSubtitle: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
  },
  successHint: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
  },
  brand: {
    ...AppTypography.titleLarge,
    color: AppColors.info,
    letterSpacing: 1,
    fontWeight: '700',
  },
  spinnerWrap: { marginTop: AppSpacing.xl },
  title: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.lg,
  },
  subtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.xs,
  },
  amount: {
    ...AppTypography.bodyLarge,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.md,
  },
});

export default PaymentProcessingScreen;
