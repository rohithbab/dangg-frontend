import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

export type AppBarProps = {
  title: string;
  subtitle?: string;
  /** Show the back chevron (auto-hidden if there's nothing to pop). */
  showBack?: boolean;
  /** Right-side actions slot. */
  actions?: React.ReactNode;
  /** Override the default back behavior. */
  onBack?: () => void;
};

/**
 * Themed header. Uses React Navigation's `useNavigation()` to drive the
 * default back behavior — pass `onBack` to override.
 */
function AppBar({
  title,
  subtitle,
  showBack = true,
  actions,
  onBack,
}: AppBarProps): React.ReactElement {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();
  const renderBack = showBack && canGoBack;

  const handleBack = (): void => {
    if (onBack) {
      onBack();
    } else if (canGoBack) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.bar}>
      <View style={styles.leading}>
        {renderBack ? (
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backChevron}>{'‹'}</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: Platform.OS === 'android' ? 56 + (StatusBar.currentHeight ?? 0) : 56,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.md,
    backgroundColor: AppColors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.divider,
  },
  leading: { width: 40, alignItems: 'flex-start' },
  backChevron: {
    fontSize: 30,
    lineHeight: 30,
    color: AppColors.primary,
    fontWeight: '500',
  },
  backSpacer: { width: 40 },
  titleBlock: { flex: 1, marginHorizontal: AppSpacing.sm },
  title: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
  },
  subtitle: {
    ...AppTypography.labelSmall,
    color: AppColors.primary,
  },
  actions: { flexDirection: 'row', alignItems: 'center' },
});

export default AppBar;
