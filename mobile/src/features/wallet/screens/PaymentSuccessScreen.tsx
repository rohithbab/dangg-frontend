import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';
import { inr } from '@core/utils/formatters';

import { type MaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'PaymentSuccess'>;
type Route = RouteProp<MaleAppStackParamList, 'PaymentSuccess'>;

/** Receipt screen shown after the animated tick on PaymentProcessingScreen. */
function PaymentSuccessScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { transactionId, coinsAdded, bonusCoins, amountInr, newBalance } = route.params;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text style={styles.title}>Payment Successful!</Text>

        <View style={[styles.receiptCard, AppShadows.e1]}>
          <Text style={styles.coinsAdded}>{`${coinsAdded} coins added`}</Text>
          {bonusCoins > 0 ? <Text style={styles.bonus}>{`+${bonusCoins} bonus coins`}</Text> : null}
          <View style={styles.divider} />
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Amount paid</Text>
            <Text style={styles.receiptValue}>{inr(amountInr)}</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Transaction ID</Text>
            <Text style={styles.receiptValueMuted} numberOfLines={1}>
              {transactionId}
            </Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current balance</Text>
          <Text style={styles.balanceValue}>{`${newBalance} coins`}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue Browsing"
          onPress={() => navigation.replace('MaleTabs', { screen: 'Home' })}
        />
        <SecondaryButton
          label="View Wallet"
          onPress={() => navigation.replace('MaleTabs', { screen: 'Wallet' })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.gradientRoseSubtleStart },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  title: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    textAlign: 'center',
    marginTop: AppSpacing.lg,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.md,
    padding: AppSpacing.md,
    marginTop: AppSpacing.lg,
  },
  coinsAdded: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    textAlign: 'center',
  },
  bonus: {
    ...AppTypography.bodyMedium,
    color: AppColors.success,
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.divider,
    marginVertical: AppSpacing.sm,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  receiptLabel: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
  receiptValue: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
    fontWeight: '600',
  },
  receiptValueMuted: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    flexShrink: 1,
    marginLeft: AppSpacing.sm,
  },
  balanceCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.md,
    padding: AppSpacing.md,
    marginTop: AppSpacing.md,
    alignItems: 'center',
    gap: 4,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  balanceLabel: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
  },
  balanceValue: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  footer: {
    padding: AppSpacing.md,
    gap: AppSpacing.xs,
    alignItems: 'center',
  },
});

export default PaymentSuccessScreen;
