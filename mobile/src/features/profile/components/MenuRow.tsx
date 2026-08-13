import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { moderateScale, scaleFont } from '@theme/responsive';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

export type MenuRowProps = {
  title: string;
  subtitle?: string;
  /** Single-character glyph rendered inline with the title (e.g., "🔒"). */
  glyph?: string;
  /** Inline SVG icon (preferred). */
  renderIcon?: (color: string) => React.ReactElement;
  destructive?: boolean;
  hideChevron?: boolean;
  onPress: () => void;
  /** Renders without the bottom border (use on the last row of a group). */
  last?: boolean;
};

function Chevron({ color }: { color: string }): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" fill={color} />
    </Svg>
  );
}

/** Tappable row used in Profile, About, and Settings menus. */
function MenuRow({
  title,
  subtitle,
  glyph,
  renderIcon,
  destructive = false,
  hideChevron = false,
  onPress,
  last = false,
}: MenuRowProps): React.ReactElement {
  const accentColor = destructive ? AppColors.error : AppColors.primary;
  const titleColor = destructive ? AppColors.error : AppColors.onSurface;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, last ? null : styles.divider, pressed && styles.pressed]}
    >
      <View style={styles.iconSlot}>
        {renderIcon ? (
          renderIcon(accentColor)
        ) : glyph ? (
          <Text style={[styles.glyph, { color: accentColor }]}>{glyph}</Text>
        ) : null}
      </View>
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {hideChevron ? null : <Chevron color={AppColors.onSurfaceMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    gap: AppSpacing.sm,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.divider,
  },
  pressed: { backgroundColor: AppColors.primarySubtle },
  iconSlot: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: scaleFont(20),
    lineHeight: scaleFont(22),
  },
  titleBlock: { flex: 1 },
  title: AppTypography.bodyLarge,
  subtitle: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: moderateScale(2),
  },
});

export default MenuRow;
