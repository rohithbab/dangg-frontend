import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import CoinIcon from '@core/components/CoinIcon';

import { type CoinPackage, type CoinPackageTag, totalCoinsFor } from '../constants';

export type CoinPackageCardProps = {
  pkg: CoinPackage;
  selected: boolean;
  onPress: () => void;
};

const TAG_LABEL: Record<CoinPackageTag, string> = {
  popular: 'POPULAR',
  bestDeal: 'BEST DEAL',
  maxValue: 'MAX VALUE',
};

const TAG_COLOR: Record<CoinPackageTag, string> = {
  popular: AppColors.primary,
  bestDeal: AppColors.coinGoldDark,
  maxValue: AppColors.success,
};

/**
 * Selectable card for a coin package in the Wallet grid.
 *
 * Minimal layout: optional tag ribbon, brand coin, total coins as the hero
 * number, optional bonus line (only when present), price. No per-coin
 * breakdown, no "COINS" label — the icon already says that.
 */
function CoinPackageCard({ pkg, selected, onPress }: CoinPackageCardProps): React.ReactElement {
  const totalCoins = totalCoinsFor(pkg);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : styles.cardUnselected,
        pressed && styles.cardPressed,
      ]}
    >
      {pkg.tag ? (
        <View style={[styles.tag, { backgroundColor: TAG_COLOR[pkg.tag] }]}>
          <Text style={styles.tagText}>{TAG_LABEL[pkg.tag]}</Text>
        </View>
      ) : null}

      <CoinIcon size={40} />

      <Text style={styles.coins}>{totalCoins.toLocaleString()}</Text>

      {pkg.bonusCoins > 0 ? <Text style={styles.bonus}>{`+${pkg.bonusCoins} bonus`}</Text> : null}

      <Text style={styles.price}>{`₹${pkg.priceInr}`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    paddingVertical: AppSpacing.lg,
    paddingHorizontal: AppSpacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: AppSpacing.xs,
    // floating lift
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 10,
  },
  cardSelected: {
    borderColor: AppColors.primary,
    shadowColor: AppColors.primary,
    shadowOpacity: 0.28,
  },
  cardUnselected: {
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  cardPressed: { opacity: 0.94 },
  tag: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: AppRadii.sm,
  },
  tagText: {
    ...AppTypography.labelSmall,
    color: AppColors.onPrimary,
    fontWeight: '800',
    letterSpacing: 0.3,
    fontSize: 10,
  },
  coins: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
    fontWeight: '800',
    fontSize: 24,
    marginTop: AppSpacing.xs,
  },
  bonus: {
    ...AppTypography.labelSmall,
    color: AppColors.success,
    fontWeight: '700',
  },
  price: {
    ...AppTypography.titleMedium,
    color: AppColors.onSurface,
    fontWeight: '700',
    marginTop: AppSpacing.xs,
  },
});

export default CoinPackageCard;
