import { Star } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { InterFont } from '@theme/typography';

import GradientAvatar from './GradientAvatar';

/**
 * Person list row (Neue) — squircle gradient avatar, name + age, rating and
 * per-chat price, and a pink "Chat" CTA. Used on Male Home and reused wherever
 * a tappable person appears in a list.
 */
export type PersonRowProps = {
  name: string;
  age?: number;
  rating: number;
  coinPrice: number;
  imageUrl?: string | null;
  /** Seed for the avatar gradient. Defaults to the name. */
  seed?: string;
  /** She is in an active chat — show a "Busy" state and disable the CTA. */
  isBusy?: boolean;
  onPress?: () => void;
  onChat?: () => void;
};

function PersonRow({
  name,
  age,
  rating,
  imageUrl,
  seed,
  isBusy,
  onPress,
  onChat,
}: PersonRowProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}${age ? `, ${age}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <GradientAvatar
        initials={name}
        seed={seed ?? name}
        uri={imageUrl}
        size={56}
        shape="squircle"
      />
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>
          {age ? `${name}, ${age}` : name}
        </Text>
        <View style={styles.metaRow}>
          <Star size={12} color={AppColors.onSurfaceMuted} fill={AppColors.onSurfaceMuted} />
          <Text style={styles.rating}>{rating.toFixed(1)}</Text>
          {isBusy ? (
            <View style={styles.busyPill}>
              <View style={styles.busyDot} />
              <Text style={styles.busyText}>Busy</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isBusy ? `${name} is busy` : `Chat with ${name}`}
        onPress={isBusy ? undefined : onChat}
        disabled={isBusy}
        style={({ pressed }) => [
          styles.chatBtn,
          isBusy && styles.chatBtnBusy,
          pressed && !isBusy && styles.chatPressed,
        ]}
      >
        <Text style={[styles.chatLabel, isBusy && styles.chatLabelBusy]}>
          {isBusy ? 'Busy' : 'Chat'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 80,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 11,
    paddingRight: 13,
  },
  pressed: { opacity: 0.85 },
  middle: { flex: 1, marginLeft: 12 },
  name: {
    fontFamily: InterFont.medium,
    fontSize: 16,
    color: AppColors.onSurface,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  rating: {
    fontFamily: InterFont.light,
    fontSize: 12.5,
    color: AppColors.onSurfaceMuted,
    marginLeft: 5,
  },

  busyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  busyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.warning,
    marginRight: 4,
  },
  busyText: {
    fontFamily: InterFont.medium,
    fontSize: 12,
    color: AppColors.warning,
  },

  chatBtn: {
    width: 72,
    height: 38,
    borderRadius: 13,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnBusy: { backgroundColor: AppColors.surfaceVariant },
  chatPressed: { opacity: 0.88 },
  chatLabel: {
    fontFamily: InterFont.medium,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  chatLabelBusy: { color: AppColors.onSurfaceMuted },
});

export default PersonRow;
