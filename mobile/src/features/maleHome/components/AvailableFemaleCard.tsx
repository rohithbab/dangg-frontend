import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import CoinIcon from '@core/components/CoinIcon';

import { type AvailableFemale } from '../api/maleHomeApi';

export type AvailableFemaleCardProps = {
  female: AvailableFemale;
  width: number;
  onPress: () => void;
  onToggleFavorite: () => void;
};

function StarIcon({ color, size }: { color: string; size: number }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={color}
      />
    </Svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }): React.ReactElement {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? AppColors.primary : AppColors.transparent}
        stroke={filled ? AppColors.transparent : AppColors.onSurfaceMuted}
        strokeWidth={filled ? 0 : 2}
      />
    </Svg>
  );
}

function CoinPill({ amount }: { amount: number }): React.ReactElement {
  return (
    <View style={styles.coinPill}>
      <CoinIcon size={14} />
      <Text style={styles.coinPillText}>{String(amount)}</Text>
    </View>
  );
}

/** 4:5 ratio card used in the Male Home browse grid. */
function AvailableFemaleCard({
  female,
  width,
  onPress,
  onToggleFavorite,
}: AvailableFemaleCardProps): React.ReactElement {
  const cardHeight = (width * 5) / 4;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Profile of ${female.name}, age ${female.age}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width, height: cardHeight },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardInner}>
        <FastImage source={{ uri: female.imageUrl }} style={styles.image} resizeMode="cover" />

        <View style={styles.topRow}>
          {female.isNew ? (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          ) : (
            <View />
          )}
          {female.isOnline ? <View style={styles.statusDot} /> : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={female.isFavorited ? 'Unfavorite' : 'Add to favorites'}
          onPress={onToggleFavorite}
          hitSlop={8}
          style={styles.heartButton}
        >
          <HeartIcon filled={female.isFavorited} />
        </Pressable>

        <View style={styles.infoStrip}>
          <Text style={styles.name} numberOfLines={1}>
            {`${female.name}, ${female.age}`}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              <StarIcon color={AppColors.warning} size={12} />
              <Text style={styles.rating}>{female.rating.toFixed(1)}</Text>
            </View>
            <CoinPill amount={female.coinPrice} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: AppRadii.md,
    backgroundColor: AppColors.surface,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: AppColors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cardInner: {
    flex: 1,
    borderRadius: AppRadii.md,
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.92 },
  image: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppColors.primarySubtle,
  },
  topRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  newBadge: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: AppRadii.sm,
  },
  newBadgeText: {
    ...AppTypography.labelSmall,
    color: AppColors.onPrimary,
    fontWeight: '700',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.onlineGreen,
    borderWidth: 1.5,
    borderColor: AppColors.surface,
  },
  heartButton: {
    position: 'absolute',
    top: 32,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    opacity: 0.92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColors.surface,
    padding: AppSpacing.sm,
  },
  name: {
    ...AppTypography.bodyLarge,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurface,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primarySubtle,
    paddingHorizontal: 6,
    height: 22,
    borderRadius: AppRadii.sm,
    justifyContent: 'center',
  },
  coinPillText: {
    ...AppTypography.labelSmall,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
});

export default AvailableFemaleCard;
