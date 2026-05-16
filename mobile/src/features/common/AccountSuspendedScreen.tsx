import React from 'react';
import { Linking, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import { SUPPORT_EMAIL } from '@core/config/constants';

export type AccountSuspendedScreenProps = {
  reason?: string;
};

/** Final state for accounts the backend has blocked. Only escape is support. */
function AccountSuspendedScreen({ reason }: AccountSuspendedScreenProps): React.ReactElement {
  const contactSupport = (): void => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Account%20suspended`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.iconCircle} />
        <Text style={styles.title}>Your account has been suspended</Text>
        {reason ? <Text style={styles.subtitle}>{reason}</Text> : null}
        <View style={styles.spacer}>
          <PrimaryButton label="Contact support" onPress={contactSupport} />
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
});

export default AccountSuspendedScreen;
