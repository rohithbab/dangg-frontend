import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Animated, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { InterFont } from '@theme/typography';

import CoinIcon from '@core/components/CoinIcon';

import { type MaleAppStackParamList } from '@navigation/types';

import { WC, WR, WS } from '../walletTheme';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'PaymentSuccess'>;
type Route = RouteProp<MaleAppStackParamList, 'PaymentSuccess'>;

function CheckBadge(): React.ReactElement {
  const scale = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 11,
      stiffness: 200,
      mass: 0.7,
    }).start();
  }, [scale]);

  return (
    <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
      <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
        <Path
          d="M5 13l4 4L19 7"
          stroke={WC.text}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

/** Payment success result (B10). Single "Done" CTA returns to the Wallet. */
function PaymentSuccessScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { coinsAdded, newBalance } = route.params;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <CheckBadge />
        <Text style={styles.title}>Payment successful</Text>
        <Text
          style={styles.subtitle}
        >{`+${coinsAdded.toLocaleString()} coins added to your wallet`}</Text>
        <View style={styles.balanceChip}>
          <CoinIcon size={16} />
          <Text style={styles.balanceChipText}>{`Balance: ${newBalance.toLocaleString()}`}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.replace('MaleTabs', { screen: 'Wallet' })}
          style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
        >
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WC.bg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: WC.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: InterFont.medium,
    fontSize: 20,
    color: WC.text,
    marginTop: WS.xl,
  },
  subtitle: {
    fontFamily: InterFont.regular,
    fontSize: 15,
    color: WC.textDim,
    marginTop: WS.sm + 2,
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingLeft: 16,
    paddingRight: 18,
    borderRadius: WR.lg + 2,
    backgroundColor: WC.surfaceDeep,
    borderWidth: 1,
    borderColor: WC.hairline,
    marginTop: WS.xl,
  },
  balanceChipText: { fontFamily: InterFont.regular, fontSize: 15, color: WC.text },

  footer: { paddingHorizontal: 24, paddingBottom: WS.xl },
  doneBtn: {
    height: 54,
    borderRadius: WR.lg - 2,
    backgroundColor: WC.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { fontFamily: InterFont.medium, fontSize: 16.5, color: WC.bg },
  pressed: { opacity: 0.85 },
});

export default PaymentSuccessScreen;
