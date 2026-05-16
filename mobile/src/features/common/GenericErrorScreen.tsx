import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';

export type GenericErrorScreenProps = {
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
};

/** Last-resort fallback when an uncaught error bubbles to the top of the tree. */
function GenericErrorScreen({
  message,
  onRetry,
  onGoHome,
}: GenericErrorScreenProps): React.ReactElement {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.iconCircle} />
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          {message ?? 'We hit an unexpected error. Please try again, or head home.'}
        </Text>
        <View style={styles.spacer}>
          {onRetry ? <PrimaryButton label="Retry" onPress={onRetry} /> : null}
          {onRetry && onGoHome ? <View style={styles.gap} /> : null}
          {onGoHome ? <SecondaryButton label="Go home" onPress={onGoHome} /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  body: {
    flex: 1,
    padding: AppSpacing.lg,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.error,
    opacity: 0.18,
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
  spacer: { marginTop: AppSpacing.xl },
  gap: { height: AppSpacing.sm },
});

export default GenericErrorScreen;
