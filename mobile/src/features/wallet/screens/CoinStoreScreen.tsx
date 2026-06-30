import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { InterFont } from '@theme/typography';

import CoinIcon from '@core/components/CoinIcon';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { fetchWalletSnapshot } from '../api/walletApi';
import { COIN_PACKAGES, type CoinPackage, totalCoinsFor } from '../constants';
import { useCoinBalance } from '../store/walletStore';
import { WC, WR, WS } from '../walletTheme';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'CoinStore'>;

const PAD = 24;

// Per-package gradient intensity: the cheapest pack (30) gets the lightest
// mauve wash, ramping up to the flagship's existing strength for the biggest.
const MIN_GRADIENT_STRENGTH = 0.12;
const MAX_GRADIENT_STRENGTH = 0.6;

function badgeLabel(tag: CoinPackage['tag']): string | null {
  if (tag === 'maxValue') {
    return 'BEST VALUE';
  }
  if (tag === 'bestDeal') {
    return 'BEST DEAL';
  }
  if (tag === 'popular') {
    return 'POPULAR';
  }
  return null;
}

/** Horizontal color wash (left → transparent) behind a card. */
function Wash({
  radius,
  color,
  strength = 0.6,
}: {
  radius: number;
  color: string;
  strength?: number;
}): React.ReactElement {
  const id = React.useId();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={color} stopOpacity={String(strength)} />
            <Stop offset="0.6" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={WC.surfaceDeep} />
        <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

type PackageCardProps = {
  pkg: CoinPackage;
  selected: boolean;
  /** Mauve wash strength for this pack (0 = none, ~0.6 = flagship). */
  gradientStrength: number;
  onSelect: () => void;
  onBuy: () => void;
};

function PackageCard({
  pkg,
  selected,
  gradientStrength,
  onSelect,
  onBuy,
}: PackageCardProps): React.ReactElement {
  const total = totalCoinsFor(pkg);
  const highlight = pkg.tag === 'maxValue';
  const label = badgeLabel(pkg.tag);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={[styles.card, highlight && styles.cardHighlight, selected && styles.cardSelected]}
    >
      {selected ? (
        <Wash radius={WR.lg - 2} color={WC.primary} strength={0.55} />
      ) : (
        <Wash radius={WR.lg - 2} color={WC.mauve} strength={gradientStrength} />
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardInfo}>
          {label ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{label}</Text>
            </View>
          ) : null}
          <View style={styles.coinRow}>
            <Text style={styles.coins}>{total.toLocaleString()}</Text>
            <Text style={styles.coinsUnit}>coins</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.price}>{`₹ ${pkg.priceInr.toLocaleString()}`}</Text>
            {pkg.bonusCoins > 0 ? (
              <View style={styles.bonusPill}>
                <Text style={styles.bonusText}>{`+${pkg.bonusCoins} bonus`}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Buy ${total} coins`}
          onPress={onBuy}
          style={({ pressed }) => [styles.buyBtn, pressed && styles.pressed]}
        >
          <Text style={styles.buyText}>Buy</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

/**
 * Coin Store (B9) — the male buys coins here. Renders the live coin-package
 * catalogue in the Neue card style; tapping "Buy" launches the payment flow
 * (PaymentProcessing → Razorpay). The package data is the source of truth, so
 * bonus pills and the flagship highlight reflect whatever the catalogue holds.
 */
function CoinStoreScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const coinBalance = useCoinBalance();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWalletSnapshot().catch(e => logger.warn('Coin store snapshot failed', e));
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={26} color={WC.text} strokeWidth={2} />
        </Pressable>
        <View style={styles.balanceChip}>
          <CoinIcon size={16} />
          <Text style={styles.balanceChipText}>{coinBalance.toLocaleString()}</Text>
        </View>
      </View>

      <Text style={styles.title}>Get coins</Text>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {COIN_PACKAGES.map((pkg, index) => (
          <Animated.View key={pkg.id} entering={FadeInDown.duration(360).delay(index * 50)}>
            <PackageCard
              pkg={pkg}
              gradientStrength={
                MIN_GRADIENT_STRENGTH +
                (MAX_GRADIENT_STRENGTH - MIN_GRADIENT_STRENGTH) *
                  (index / Math.max(1, COIN_PACKAGES.length - 1))
              }
              selected={selectedId === pkg.id}
              onSelect={() => setSelectedId(pkg.id)}
              onBuy={() => navigation.navigate('PaymentProcessing', { packageId: pkg.id })}
            />
          </Animated.View>
        ))}
      </ScrollView>

      <Text style={styles.footer}>Secure payment via Razorpay</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WC.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: WS.xl,
    height: 44,
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 36,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: WR.lg - 2,
    backgroundColor: WC.surfaceDeep,
    borderWidth: 1,
    borderColor: WC.hairline,
  },
  balanceChipText: { fontFamily: InterFont.medium, fontSize: 15, color: WC.text },

  title: {
    fontFamily: InterFont.light,
    fontSize: 30,
    letterSpacing: -0.75,
    color: WC.text,
    paddingHorizontal: PAD,
    marginTop: WS.md,
    marginBottom: WS.lg,
  },

  scroll: { paddingHorizontal: PAD, paddingBottom: WS.xl, gap: WS.md },

  card: {
    borderRadius: WR.lg - 2,
    backgroundColor: WC.surfaceDeep,
    borderWidth: 1,
    borderColor: WC.hairline,
    overflow: 'hidden',
  },
  cardHighlight: {
    borderColor: WC.borderStrong,
    backgroundColor: WC.transparent,
  },
  cardSelected: {
    borderColor: WC.primaryEdge,
    backgroundColor: WC.transparent,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: WC.primary,
    borderRadius: WR.pill,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: InterFont.medium,
    fontSize: 10.5,
    letterSpacing: 0.63,
    color: WC.text,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: WS.md,
    paddingHorizontal: WS.xl,
    paddingVertical: WS.lg + 2,
  },
  cardInfo: { flex: 1, gap: 8 },
  coinRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  coins: { fontFamily: InterFont.light, fontSize: 26, color: WC.text, letterSpacing: -0.3 },
  coinsUnit: { fontFamily: InterFont.regular, fontSize: 13, color: WC.textDim },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { fontFamily: InterFont.regular, fontSize: 14, color: WC.textDim },
  bonusPill: {
    backgroundColor: WC.successSoft,
    borderRadius: WR.sm,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  bonusText: { fontFamily: InterFont.medium, fontSize: 12, color: WC.successText },

  buyBtn: {
    width: 72,
    height: 40,
    borderRadius: WR.lg,
    backgroundColor: WC.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: { fontFamily: InterFont.medium, fontSize: 14, color: WC.text },
  pressed: { transform: [{ scale: 0.96 }], opacity: 0.92 },

  footer: {
    fontFamily: InterFont.regular,
    fontSize: 13,
    color: WC.textFaint,
    textAlign: 'center',
    paddingVertical: WS.md,
  },
});

export default CoinStoreScreen;
