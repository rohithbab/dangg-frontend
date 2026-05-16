import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import SecondaryButton from '@core/components/SecondaryButton';

export type MaintenanceScreenProps = {
  estimatedReturn?: string;
  onRetry?: () => void;
};

/** Full-screen blocker shown when the backend flags maintenance mode. */
function MaintenanceScreen({
  estimatedReturn,
  onRetry,
}: MaintenanceScreenProps): React.ReactElement {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.iconCircle} />
        <Text style={styles.title}>We&apos;re working on Dangg</Text>
        <Text style={styles.subtitle}>
          {estimatedReturn
            ? `We'll be back ${estimatedReturn}. Thanks for your patience.`
            : "We'll be back shortly. Thanks for your patience."}
        </Text>
        {onRetry ? (
          <View style={styles.spacer}>
            <SecondaryButton label="Try again" onPress={onRetry} />
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
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.warning,
    opacity: 0.2,
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
});

export default MaintenanceScreen;
