import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import CoinIcon from '@core/components/CoinIcon';
import { inr } from '@core/utils/formatters';

import { type CoinPackage, totalCoinsFor } from '../constants';
import { WC, WR, WS } from '../walletTheme';

export type CoinPackageCardProps = {
  pkg: CoinPackage;
  selected: boolean;
  onPress: () => void;
};

function Check(): React.ReactElement {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Path
        d="M20 6 9 17l-5-5"
        stroke={WC.text}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type Badge = { label: string; color: string };

function badgeFor(tag: CoinPackage['tag']): Badge | null {
  if (tag === 'popular') {
    return { label: 'Most Popular', color: WC.secondary };
  }
  if (tag === 'bestDeal') {
    return { label: 'Best Deal', color: WC.primary };
  }
  if (tag === 'maxValue') {
    return { label: 'Best Value', color: WC.primary };
  }
  return null;
}

/**
 * Premium subscription-style coin package row (Tinder Gold / Apple plan feel).
 * Radio + name + coins (+ bonus) on the left, price + per-coin on the right,
 * with an optional badge and a gradient border for the flagship pack.
 */
function CoinPackageCard({ pkg, selected, onPress }: CoinPackageCardProps): React.ReactElement {
  const total = totalCoinsFor(pkg);
  const perCoin = total > 0 ? pkg.priceInr / total : 0;
  const badge = badgeFor(pkg.tag);

  const inner = (
    <View style={styles.rowInner}>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <Check /> : null}</View>
      <View style={styles.mid}>
        <Text style={styles.name}>{pkg.name}</Text>
        <View style={styles.coinRow}>
          <CoinIcon size={18} />
          <Text style={styles.coins}>{total.toLocaleString()}</Text>
          {pkg.bonusCoins > 0 ? (
            <Text style={styles.bonus}>{`+${pkg.bonusCoins} bonus`}</Text>
          ) : (
            <Text style={styles.coinsUnit}>coins</Text>
          )}
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>{inr(pkg.priceInr)}</Text>
        <Text style={styles.perCoin}>{`₹${perCoin.toFixed(2)} / coin`}</Text>
      </View>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      {badge ? (
        <View style={[styles.badge, { backgroundColor: badge.color }]}>
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>
      ) : null}

      <View style={[styles.card, selected && styles.cardSelected]}>{inner}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.96 },
  card: {
    backgroundColor: WC.card,
    borderRadius: WR.lg,
    borderWidth: 1,
    borderColor: WC.hairline,
  },
  cardSelected: {
    borderColor: WC.primaryEdge,
    backgroundColor: WC.primarySoft,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: WS.md,
    paddingVertical: WS.md + 2,
    paddingHorizontal: WS.lg,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: WC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: WC.primary, backgroundColor: WC.primary },
  mid: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: WC.textDim },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 2 },
  coins: { fontSize: 20, fontWeight: '800', color: WC.text, letterSpacing: -0.3 },
  coinsUnit: { fontSize: 13, fontWeight: '600', color: WC.textDim },
  bonus: {
    fontSize: 11,
    fontWeight: '700',
    color: WC.successText,
    backgroundColor: WC.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: WR.pill,
    overflow: 'hidden',
  },
  right: { alignItems: 'flex-end' },
  price: { fontSize: 19, fontWeight: '800', color: WC.text },
  perCoin: { fontSize: 11, fontWeight: '500', color: WC.textFaint, marginTop: 1 },
  badge: {
    position: 'absolute',
    top: -9,
    right: 16,
    zIndex: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: WR.pill,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: WC.text,
  },
});

export default CoinPackageCard;
