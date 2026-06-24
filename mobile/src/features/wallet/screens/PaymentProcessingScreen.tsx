import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { InterFont } from '@theme/typography';

import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { processPayment } from '../api/walletApi';
import { getPackageById } from '../constants';
import { WC, WS } from '../walletTheme';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'PaymentProcessing'>;
type Route = RouteProp<MaleAppStackParamList, 'PaymentProcessing'>;

const RING = 88;
const R = 38;
const C = 2 * Math.PI * R;

/** Pink three-segment ring that spins while the payment is in flight. */
function Spinner(): React.ReactElement {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 1100, easing: Easing.linear }), -1, false);
  }, [rot]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  return (
    <Animated.View style={style}>
      <Svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`}>
        <Circle cx={44} cy={44} r={R} stroke={WC.hairline} strokeWidth={6} fill="none" />
        <Circle
          cx={44}
          cy={44}
          r={R}
          stroke={WC.primary}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`18 ${(C - 3 * 18) / 3}`}
        />
      </Svg>
    </Animated.View>
  );
}

/**
 * Payment-in-flight screen (B10). Runs the create-order → Razorpay → verify
 * flow, then replaces itself with the success or failed result screen. The
 * back gesture is blocked while a charge may be in progress.
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
        <Spinner />
        {pkg ? <Text style={styles.amount}>{`₹ ${pkg.priceInr.toLocaleString()}`}</Text> : null}
        <Text style={styles.title}>Processing payment…</Text>
        <Text style={styles.hint}>Please don&apos;t close this screen</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WC.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  amount: {
    fontFamily: InterFont.light,
    fontSize: 40,
    color: WC.text,
    marginTop: WS.xxl + WS.md,
  },
  title: {
    fontFamily: InterFont.medium,
    fontSize: 18,
    color: WC.text,
    marginTop: WS.lg,
  },
  hint: { fontFamily: InterFont.regular, fontSize: 14, color: WC.textDim, marginTop: WS.xs + 2 },
});

export default PaymentProcessingScreen;
