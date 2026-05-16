import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';

/** Drives the UI from a single discriminator: soft (dismissible) vs force. */
export type UpdateMode = 'soft' | 'force';

export type UpdateRequiredScreenProps = {
  mode: UpdateMode;
  onUpdate: () => void;
  onLater?: () => void;
};

/**
 * Returns `true` when `running` is strictly less than `minimum`.
 * Tolerant of build-suffix (`+123`) and shorter version strings.
 */
export function isUpdateRequired(running: string, minimum: string): boolean {
  const parse = (v: string): number[] =>
    v
      .split('+')[0]
      ?.split('.')
      .map(s => Number.parseInt(s, 10) || 0) ?? [];
  const r = parse(running);
  const m = parse(minimum);
  const len = Math.max(r.length, m.length);
  for (let i = 0; i < len; i++) {
    const a = r[i] ?? 0;
    const b = m[i] ?? 0;
    if (a < b) {
      return true;
    }
    if (a > b) {
      return false;
    }
  }
  return false;
}

function UpdateRequiredScreen({
  mode,
  onUpdate,
  onLater,
}: UpdateRequiredScreenProps): React.ReactElement {
  const forced = mode === 'force';
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.iconCircle} />
        <Text style={styles.title}>{forced ? 'Update required' : 'Update available'}</Text>
        <Text style={styles.subtitle}>
          {forced
            ? 'A newer version of Dangg is required to continue.'
            : 'A newer version of Dangg is available with improvements and fixes.'}
        </Text>
        <View style={styles.spacer} />
        <PrimaryButton label="Update now" onPress={onUpdate} />
        {!forced && onLater ? (
          <View style={styles.gap}>
            <SecondaryButton label="Later" onPress={onLater} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  body: {
    flex: 1,
    padding: AppSpacing.lg,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.brandPrimary,
    opacity: 0.15,
    alignSelf: 'center',
  },
  title: {
    ...AppTypography.headlineMedium,
    textAlign: 'center',
    marginTop: AppSpacing.lg,
  },
  subtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.md,
  },
  spacer: { height: AppSpacing.xl },
  gap: { marginTop: AppSpacing.sm },
});

export default UpdateRequiredScreen;
