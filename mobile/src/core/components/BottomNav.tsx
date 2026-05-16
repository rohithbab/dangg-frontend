import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { UserRole } from '@app-types/domain';

const iconStyles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.onSurfaceMuted,
  },
  square: {
    width: 12,
    height: 12,
    backgroundColor: AppColors.onSurfaceMuted,
    borderRadius: 2,
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: AppColors.onSurfaceMuted,
  },
});

export type BottomNavItem = {
  label: string;
  /** Render any element — icon library is intentionally not assumed here. */
  icon: React.ReactNode;
};

export type BottomNavProps = {
  role: UserRole;
  currentIndex: number;
  onTabPress: (index: number) => void;
  /** Override defaults if a future feature wants a fourth tab, etc. */
  items?: ReadonlyArray<BottomNavItem>;
};

export const FEMALE_TABS: ReadonlyArray<BottomNavItem> = [
  { label: 'Home', icon: <View style={iconStyles.dot} /> },
  { label: 'Earnings', icon: <View style={iconStyles.square} /> },
  { label: 'Profile', icon: <View style={iconStyles.circle} /> },
];

export const MALE_TABS: ReadonlyArray<BottomNavItem> = [
  { label: 'Wallet', icon: <View style={iconStyles.square} /> },
  { label: 'Home', icon: <View style={iconStyles.dot} /> },
  { label: 'Profile', icon: <View style={iconStyles.circle} /> },
];

/**
 * Role-aware bottom navigation. Default tab sets are shipped as constants
 * (FEMALE_TABS / MALE_TABS) but callers can override via `items`.
 */
function BottomNav({ role, currentIndex, onTabPress, items }: BottomNavProps): React.ReactElement {
  const tabs = items ?? (role === UserRole.Female ? FEMALE_TABS : MALE_TABS);

  return (
    <View style={styles.bar}>
      {tabs.map((tab, i) => {
        const active = i === currentIndex;
        return (
          <Pressable
            key={`${tab.label}-${i}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onTabPress(i)}
            style={styles.tab}
          >
            <View style={styles.iconWrap}>{tab.icon}</View>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: AppColors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
    paddingVertical: AppSpacing.xs,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  label: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  labelActive: { color: AppColors.primary },
});

export default BottomNav;
