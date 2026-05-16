import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from './PrimaryButton';

export type EmptyStateProps = {
  title: string;
  body?: string;
  /** Replace the default placeholder illustration with any element. */
  illustration?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

/** Empty-list placeholder. Title + optional body + optional CTA. */
function EmptyState({
  title,
  body,
  illustration,
  actionLabel,
  onAction,
}: EmptyStateProps): React.ReactElement {
  return (
    <View style={styles.root}>
      <View style={styles.illustration}>
        {illustration ?? <View style={styles.placeholderIllustration} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PrimaryButton label={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: AppSpacing.lg,
    alignItems: 'center',
  },
  illustration: { marginBottom: AppSpacing.md },
  placeholderIllustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: AppColors.surfaceVariant,
  },
  title: {
    ...AppTypography.titleMedium,
    textAlign: 'center',
  },
  body: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
  action: { marginTop: AppSpacing.lg },
});

export default EmptyState;
