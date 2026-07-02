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
  onPress?: () => void;
  onChat?: () => void;
};

function PersonRow({
  name,
  age,
  rating,
  imageUrl,
  seed,
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
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Chat with ${name}`}
        onPress={onChat}
        style={({ pressed }) => [styles.chatBtn, pressed && styles.chatPressed]}
      >
        <Text style={styles.chatLabel}>Chat</Text>
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

  chatBtn: {
    width: 72,
    height: 38,
    borderRadius: 13,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatPressed: { opacity: 0.88 },
  chatLabel: {
    fontFamily: InterFont.medium,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
});

export default PersonRow;
