import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import Card from '@core/components/Card';
import CoinIcon from '@core/components/CoinIcon';
import PrimaryButton from '@core/components/PrimaryButton';
import TextField from '@core/components/TextField';
import { MIN_PAYOUT_AMOUNT_INR } from '@core/config/constants';
import { AppException } from '@core/network/apiException';
import { inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import { getEarningsBalance, getPayoutDetails, requestPayout } from '../api/earningsApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'PayoutRequest'>;

function WarningIcon(): React.ReactElement {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24">
      <Path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill={AppColors.warning} />
    </Svg>
  );
}

function PayoutRequestScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [payoutDetails, setPayoutDetails] =
    useState<Awaited<ReturnType<typeof getPayoutDetails>>>(null);
  const [amountStr, setAmountStr] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      const [bal, details] = await Promise.all([getEarningsBalance(), getPayoutDetails()]);
      setAvailableBalance(bal.availableInr);
      setPayoutDetails(details);
      setAmountStr(String(bal.availableInr));
    } catch (e) {
      logger.error('PayoutRequestScreen.loadData failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const handleAmountChange = (text: string): void => {
    setAmountStr(text);
    setSubmitError(null);

    const amt = parseInt(text, 10);
    if (isNaN(amt)) {
      setErrorText('Please enter a valid amount');
      return;
    }
    if (amt < MIN_PAYOUT_AMOUNT_INR) {
      setErrorText(`Minimum payout is ${MIN_PAYOUT_AMOUNT_INR.toLocaleString()} coins`);
      return;
    }
    if (amt > availableBalance) {
      setErrorText('Insufficient balance');
      return;
    }
    setErrorText(null);
  };

  const handleMaxPress = (): void => {
    handleAmountChange(String(availableBalance));
  };

  const handleSubmit = async (): Promise<void> => {
    const amt = parseInt(amountStr, 10);
    if (isNaN(amt) || amt < MIN_PAYOUT_AMOUNT_INR || amt > availableBalance) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      await requestPayout(amt);

      const methodLabel = payoutDetails
        ? payoutDetails.kind === 'upi'
          ? `UPI (${payoutDetails.upiId})`
          : `Bank (${payoutDetails.holderName} - A/C ending in ${payoutDetails.accountNumberMasked})`
        : 'Linked details';

      navigation.navigate('PayoutInReview', {
        amount: amt,
        payoutMethod: methodLabel,
      });
    } catch (e) {
      if (e instanceof AppException) {
        setSubmitError(e.message);
      } else {
        logger.error('Payout request failed', e);
        setSubmitError('Failed to request payout, try again');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <AppBar title="Request Payout" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const showWarning = !payoutDetails;
  const isInputInvalid = !!errorText || !amountStr || parseInt(amountStr, 10) <= 0;
  const submitDisabled = showWarning || isInputInvalid || submitting;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Request Payout" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Balance card */}
          <Card padding={AppSpacing.lg} containerStyle={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available balance</Text>
            <View style={styles.balanceRow}>
              <CoinIcon size={32} />
              <Text style={styles.balanceValue}>{availableBalance.toLocaleString()}</Text>
            </View>
            <Text style={styles.inrEquivalent}>≈ {inr(availableBalance)}</Text>
          </Card>

          {showWarning ? (
            <Card padding={AppSpacing.lg} containerStyle={styles.warningCard}>
              <View style={styles.warningHeader}>
                <WarningIcon />
                <Text style={styles.warningTitle}>Payout Details Required</Text>
              </View>
              <Text style={styles.warningText}>
                You need to link your bank account or UPI details before you can withdraw your
                earnings.
              </Text>
              <PrimaryButton
                label="Add Payout Details"
                onPress={() => navigation.navigate('BankUpiUpdate')}
              />
            </Card>
          ) : (
            <>
              {/* Linked Payout Info Card */}
              <Card padding={AppSpacing.lg} containerStyle={styles.methodCard}>
                <Text style={styles.cardHeader}>Withdrawing to</Text>
                {payoutDetails.kind === 'upi' ? (
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodType}>UPI Transfer</Text>
                    <Text style={styles.methodDetail}>{payoutDetails.upiId}</Text>
                  </View>
                ) : (
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodType}>Bank Transfer</Text>
                    <Text style={styles.methodDetail}>{payoutDetails.holderName}</Text>
                    <Text style={styles.methodSubDetail}>
                      A/C: {payoutDetails.accountNumberMasked} | IFSC: {payoutDetails.ifsc}
                    </Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit payout details"
                  onPress={() => navigation.navigate('BankUpiUpdate')}
                  style={styles.editBtn}
                >
                  <Text style={styles.editBtnText}>Edit details</Text>
                </Pressable>
              </Card>

              {/* Input Card */}
              <Card padding={AppSpacing.lg} containerStyle={styles.inputCard}>
                <View style={styles.inputHeader}>
                  <Text style={styles.cardHeader}>Enter Amount</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Use maximum available balance"
                    onPress={handleMaxPress}
                    style={styles.maxBtn}
                  >
                    <Text style={styles.maxBtnText}>Withdraw Max</Text>
                  </Pressable>
                </View>

                <TextField
                  label="Amount (Coins)"
                  value={amountStr}
                  onChangeText={handleAmountChange}
                  keyboardType="number-pad"
                  maxLength={7}
                  placeholder="Minimum 1,000"
                  errorText={errorText ?? undefined}
                />

                <Text style={styles.hintText}>
                  Min withdrawal is {MIN_PAYOUT_AMOUNT_INR.toLocaleString()} coins. 1 coin = ₹1.
                </Text>
              </Card>

              <PrimaryButton
                label="Request Payout"
                onPress={() => {
                  void handleSubmit();
                }}
                loading={submitting}
                disabled={submitDisabled}
              />
            </>
          )}

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  scroll: { padding: AppSpacing.md, gap: AppSpacing.md },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Balance Card
  balanceCard: {
    alignItems: 'center',
    backgroundColor: AppColors.primarySubtle,
    borderWidth: 1,
    borderColor: AppColors.primaryLight,
  },
  balanceLabel: {
    ...AppTypography.bodyMedium,
    color: AppColors.primaryDark,
    opacity: 0.8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
    marginTop: AppSpacing.xs,
  },
  balanceValue: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    fontWeight: '800',
  },
  inrEquivalent: {
    ...AppTypography.bodyMedium,
    color: AppColors.primaryDark,
    opacity: 0.7,
    marginTop: 2,
  },

  // Warning Card
  warningCard: {
    gap: AppSpacing.md,
    alignItems: 'center',
    borderColor: AppColors.warningLight,
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  warningTitle: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  warningText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Method Card
  methodCard: { gap: AppSpacing.sm, position: 'relative' },
  cardHeader: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  methodInfo: {
    marginTop: 4,
    gap: 2,
  },
  methodType: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
  },
  methodDetail: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    fontWeight: '600',
  },
  methodSubDetail: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
  },
  editBtn: {
    position: 'absolute',
    top: AppSpacing.lg,
    right: AppSpacing.lg,
  },
  editBtnText: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
    fontWeight: '600',
  },

  // Input Card
  inputCard: { gap: AppSpacing.sm },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  maxBtn: {},
  maxBtnText: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
    fontWeight: '600',
  },
  hintText: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 4,
  },

  // Errors
  submitError: {
    ...AppTypography.bodyMedium,
    color: AppColors.error,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
});

export default PayoutRequestScreen;
