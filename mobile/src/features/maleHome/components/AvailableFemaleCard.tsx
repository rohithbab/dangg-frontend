import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import CoinIcon from '@core/components/CoinIcon';

import { type AvailableFemale } from '../api/maleHomeApi';
import { HC, HR, HS, HShadow } from '../homeTheme';

export type AvailableFemaleCardProps = {
  female: AvailableFemale;
  width: number;
  /** Receives the card's on-screen rect so the caller can expand from it. */
  onPress: (pageX: number, pageY: number, width: number, height: number) => void;
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
    <Svg width={17} height={17} viewBox="0 0 24 24">
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? HC.primary : 'transparent'}
        stroke={filled ? 'transparent' : '#FFFFFF'}
        strokeWidth={filled ? 0 : 2}
      />
    </Svg>
  );
}

/** Bottom-up dark gradient so the name/stats read cleanly over the photo. */
function BottomScrim(): React.ReactElement {
  const id = React.useId();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.4" stopColor="#000000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.9" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** 4:5 premium portrait card used in the Male Home browse grid. */
function AvailableFemaleCard({
  female,
  width,
  onPress,
  onToggleFavorite,
}: AvailableFemaleCardProps): React.ReactElement {
  const cardHeight = (width * 5) / 4;
  const rootRef = React.useRef<View>(null);

  const handlePress = (): void => {
    const node = rootRef.current;
    if (node) {
      node.measure((_x, _y, w, h, pageX, pageY) => onPress(pageX, pageY, w, h));
    } else {
      onPress(0, 0, 0, 0);
    }
  };

  return (
    <Pressable
      ref={rootRef}
      accessibilityRole="button"
      accessibilityLabel={`Profile of ${female.name}, age ${female.age}`}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { width, height: cardHeight },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardInner}>
        <FastImage source={{ uri: female.imageUrl }} style={styles.image} resizeMode="cover" />
        <BottomScrim />

        <View style={styles.topRow}>
          {female.isNew ? (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          ) : (
            <View />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={female.isFavorited ? 'Unfavorite' : 'Add to favorites'}
            onPress={onToggleFavorite}
            hitSlop={8}
            style={styles.heartButton}
          >
            <HeartIcon filled={female.isFavorited} />
          </Pressable>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            {female.isOnline ? <View style={styles.onlineDot} /> : null}
            <Text style={styles.name} numberOfLines={1}>
              {`${female.name}, ${female.age}`}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              <StarIcon color="#FBBF24" size={12} />
              <Text style={styles.rating}>{female.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.coinPill}>
              <CoinIcon size={13} />
              {/* Duration billing: everyone is 1 coin / 3s, not a flat per-chat price. */}
              <Text style={styles.coinPillText}>1/3s</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: HR.card,
    backgroundColor: HC.card,
    position: 'relative',
    borderWidth: 1,
    borderColor: HC.border,
    ...HShadow.card,
  },
  cardInner: {
    flex: 1,
    borderRadius: HR.card,
    overflow: 'hidden',
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.95 },
  image: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: HC.cardHi,
  },
  topRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  newBadge: {
    backgroundColor: HC.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: HR.pill,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  heartButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: HC.glassStrong,
    borderWidth: 1,
    borderColor: HC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: HS.md,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: HC.success,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: HC.glassStrong,
    borderWidth: 1,
    borderColor: HC.hairline,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: HR.pill,
    justifyContent: 'center',
  },
  coinPillText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
});

export default AvailableFemaleCard;
