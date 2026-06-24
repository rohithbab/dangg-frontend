import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { InterFont } from '@theme/typography';

/**
 * Informational feature tile (Welcome screen, Neue). A surface card with a
 * left-to-right tint wash, a leading icon, and a title + subtitle.
 */
export type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** Hex tint that washes from the left edge (e.g. '#A6CFB8'). */
  tint: string;
};

function FeatureCard({ icon, title, subtitle, tint }: FeatureCardProps): React.ReactElement {
  const gradientId = React.useId();
  return (
    <View style={styles.card}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={tint} stopOpacity={0.78} />
            <Stop offset="1" stopColor={tint} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
      </Svg>
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 80,
    borderRadius: AppRadii.card,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  iconWrap: { width: 24, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1, marginLeft: 16 },
  title: {
    fontFamily: InterFont.medium,
    fontSize: 16.5,
    color: AppColors.onSurface,
  },
  subtitle: {
    fontFamily: InterFont.light,
    fontSize: 13,
    lineHeight: 17,
    color: '#9999A1',
    marginTop: 3,
  },
});

export default FeatureCard;
