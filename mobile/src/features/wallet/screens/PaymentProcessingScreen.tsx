import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { processPayment } from '../api/walletApi';
import { getPackageById, totalCoinsFor } from '../constants';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'PaymentProcessing'>;
type Route = RouteProp<MaleAppStackParamList, 'PaymentProcessing'>;

/**
 * Payment-in-flight screen.
 *
 * Auto-runs the payment as soon as the screen mounts. In production this is
 * where Razorpay's checkout overlay will open; here the API call returns
 * success/failure based on the backend response and we route to the matching
 * outcome screen.
 */
function PaymentProcessingScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { packageId } = route.params;

  const [running, setRunning] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const finalize = useCallback(async (): Promise<void> => {
    if (completedRef.current || running) {
      return;
    }
    setRunning(true);
    try {
      const result = await processPayment(packageId);
      completedRef.current = true;
      if (result.ok) {
        navigation.replace('PaymentSuccess', {
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
