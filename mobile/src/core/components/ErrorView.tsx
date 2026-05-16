import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import SecondaryButton from './SecondaryButton';

export type ErrorViewProps = {
  title: string;
  body?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Replace the default icon block. */
  icon?: React.ReactNode;
};

/** Inline error block — icon + title + body + optional retry. */
function ErrorView({
  title,
  body,
  onRetry,
  retryLabel = 'Retry',
  icon,
}: ErrorViewProps): React.ReactElement {
  return (
    <View style={styles.root}>
      <View style={styles.iconBlock}>{icon ?? <View style={styles.iconCircle} />}</View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {onRetry ? (
        <View style={styles.action}>
          <SecondaryButton label={retryLabel} onPress={onRetry} fullWidth={false} />
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
  iconBlock: { marginBottom: AppSpacing.md },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.error,
    opacity: 0.15,
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

export default ErrorView;
