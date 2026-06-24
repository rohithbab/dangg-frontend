import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { InterFont } from '@theme/typography';

import { type MaleAppStackParamList } from '@navigation/types';

import { WC, WR, WS } from '../walletTheme';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'PaymentFailed'>;
type Route = RouteProp<MaleAppStackParamList, 'PaymentFailed'>;

function AlertIcon(): React.ReactElement {
  return (
    <Svg width={38} height={38} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
        stroke={WC.danger}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M12 9v4" stroke={WC.danger} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M12 17h.01" stroke={WC.danger} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

/** Payment failure result (B10). Retry the charge or go back to the store. */
function PaymentFailedScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { packageId, reason } = route.params;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <AlertIcon />
        </View>
        <Text style={styles.title}>Payment failed</Text>
        <Text style={styles.reason}>{reason}</Text>
        <Text style={styles.reason}>No coins were charged.</Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.replace('PaymentProcessing', { packageId })}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
        >
          <Text style={styles.primaryText}>Try again</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.replace('CoinStore')}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressedSoft]}
        >
          <Text style={styles.secondaryText}>Change package</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WC.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: WC.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: InterFont.medium, fontSize: 20, color: WC.text, marginTop: WS.xl },
  reason: {
    fontFamily: InterFont.regular,
    fontSize: 15,
    color: WC.textDim,
    textAlign: 'center',
    marginTop: WS.xs,
    lineHeight: 21,
  },
  footer: { paddingHorizontal: 24, paddingBottom: WS.xl, gap: WS.sm + 2 },
  primaryBtn: {
    height: 54,
    borderRadius: WR.lg - 2,
    backgroundColor: WC.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontFamily: InterFont.medium, fontSize: 16.5, color: WC.text },
  secondaryBtn: {
    height: 52,
    borderRadius: WR.lg - 2,
    borderWidth: 1,
    borderColor: WC.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontFamily: InterFont.medium, fontSize: 15.5, color: WC.textDim },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  pressedSoft: { opacity: 0.6 },
});

export default PaymentFailedScreen;
