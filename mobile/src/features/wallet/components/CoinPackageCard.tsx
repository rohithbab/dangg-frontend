import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import CoinIcon from '@core/components/CoinIcon';

import { type CoinPackage, totalCoinsFor } from '../constants';

export type CoinPackageCardProps = {
  pkg: CoinPackage;
  selected: boolean;
  onPress: () => void;
};

/**
 * Selectable card for a coin package in the Wallet grid.
 */
function CoinPackageCard({ pkg, selected, onPress }: CoinPackageCardProps): React.ReactElement {
  const totalCoins = totalCoinsFor(pkg);

  // Dynamic premium badge labels and colors
  let tagLabel = '';
  let tagColor = '';

  if (pkg.id === 'starter') {
    tagLabel = 'Starter';
    tagColor = AppColors.info;
  } else if (pkg.tag === 'popular') {
    tagLabel = 'Popular';
    tagColor = AppColors.primary;
  } else if (pkg.tag === 'bestDeal' || pkg.tag === 'maxValue') {
    tagLabel = 'Best Value';
    tagColor = AppColors.coinGold;
  }

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
      {tagLabel ? (
        <View style={[styles.tag, { backgroundColor: tagColor }]}>
          <Text style={styles.tagText}>{tagLabel}</Text>
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
    gap: AppSpacing.xs,
    position: 'relative',
  },
  cardSelected: {
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    // soft pink shadow glow
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardUnselected: {
    borderWidth: 0, // borderless
    // premium soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: { opacity: 0.92 },
  tag: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AppRadii.full,
  },
  tagText: {
    ...AppTypography.labelSmall,
    color: AppColors.onPrimary,
    fontWeight: '700',
    letterSpacing: 0.2,
    fontSize: 9,
  },
  coins: {
    ...AppTypography.titleLarge,
    color: AppColors.onSurface,
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
    color: AppColors.primary,
    fontWeight: '700',
    marginTop: AppSpacing.xs,
  },
});

export default CoinPackageCard;
