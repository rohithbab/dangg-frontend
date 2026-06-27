import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Landmark } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import { MIN_PAYOUT_AMOUNT_INR } from '@core/config/constants';
import { inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import { getEarningsBalance, getPayoutDetails } from '../api/earningsApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'WithdrawAmount'>;

/** F6 · Withdraw amount — enter how much to withdraw to the saved method. */
function WithdrawAmountScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const [available, setAvailable] = useState<number | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void getEarningsBalance()
        .then(b => setAvailable(b.availableInr))
        .catch(e => logger.error('WithdrawAmountScreen.balance failed', e));
      void getPayoutDetails()
        .then(d =>
          setDestination(
            d == null
              ? null
              : d.kind === 'upi'
                ? d.upiId
                : `Bank •••• ${d.accountNumberMasked.slice(-4)}`,
          ),
        )
        .catch(e => logger.warn('WithdrawAmountScreen.details failed', e));
    }, []),
  );

  const amountNum = Number.parseInt(amount.replace(/\D/g, ''), 10);
  const valid = useMemo(
    () =>
      Number.isFinite(amountNum) &&
      amountNum >= MIN_PAYOUT_AMOUNT_INR &&
      available != null &&
      amountNum <= available,
    [amountNum, available],
  );

  const handleReview = useCallback((): void => {
    if (available != null && amountNum > available) {
      setError('Amount exceeds your available balance');
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum < MIN_PAYOUT_AMOUNT_INR) {
      setError(`Minimum withdrawal is ${inr(MIN_PAYOUT_AMOUNT_INR)}`);
      return;
    }
    navigation.navigate('ReviewWithdrawal', { amountInr: amountNum });
  }, [amountNum, available, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <ChevronLeft size={24} color={AppColors.onSurface} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Withdraw</Text>

          <Text style={styles.availLabel}>AVAILABLE</Text>
          <Text style={styles.availValue}>{available != null ? inr(available) : '—'}</Text>

          <View style={styles.amountRow}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={t => {
                setAmount(t.replace(/\D/g, '').slice(0, 7));
                if (error) {
                  setError(null);
                }
              }}
              placeholder="0"
              placeholderTextColor={AppColors.onSurfaceDisabled}
              keyboardType="number-pad"
              autoFocus
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (available != null) {
                  setAmount(String(Math.floor(available)));
                  setError(null);
                }
              }}
              style={styles.maxBtn}
            >
              <Text style={styles.maxText}>Max</Text>
            </Pressable>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.hint}>{`Min ${inr(MIN_PAYOUT_AMOUNT_INR)} · No fees`}</Text>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('PayoutMethods')}
            style={({ pressed }) => [styles.destCard, pressed && styles.pressed]}
          >
            <View style={styles.destIcon}>
              <Landmark size={20} color={AppColors.onSurface} strokeWidth={1.8} />
            </View>
            <View style={styles.destBody}>
              <Text style={styles.destName}>{destination ?? 'Add a payout method'}</Text>
              <Text style={styles.destSub}>{destination ? 'Default' : 'Required to withdraw'}</Text>
            </View>
            <Text style={styles.destChange}>{destination ? 'Change' : 'Add'}</Text>
          </Pressable>
        </View>

        <View style={styles.ctaWrap}>
          <PrimaryButton
            label="Review withdrawal"
            disabled={!valid || destination == null}
            onPress={handleReview}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  header: { height: 48, justifyContent: 'center', paddingHorizontal: AppSpacing.md },
  back: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: AppSpacing.lg },
  title: {
    fontFamily: InterFont.regular,
    fontSize: 28,
    letterSpacing: -0.6,
    color: AppColors.onSurface,
  },
  availLabel: {
    fontFamily: InterFont.medium,
    fontSize: 11.5,
    letterSpacing: 0.8,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.xl,
  },
  availValue: {
    fontFamily: InterFont.regular,
    fontSize: 14,
    color: AppColors.onSurfaceMuted,
    marginTop: 3,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: AppSpacing.lg },
  currency: { fontFamily: InterFont.light, fontSize: 40, color: AppColors.onSurfaceMuted },
  amountInput: {
    flex: 1,
    fontFamily: InterFont.light,
    fontSize: 44,
    letterSpacing: -1.2,
    color: AppColors.onSurface,
    padding: 0,
    marginLeft: 8,
  },
  maxBtn: {
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  maxText: { fontFamily: InterFont.medium, fontSize: 14, color: AppColors.primary },
  hint: {
    fontFamily: InterFont.regular,
    fontSize: 13,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
  },
  errorText: {
    fontFamily: InterFont.medium,
    fontSize: 13,
    color: AppColors.error,
    marginTop: AppSpacing.sm,
  },
  destCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: AppSpacing.xl,
  },
  pressed: { opacity: 0.85 },
  destIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.background,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destBody: { flex: 1, marginLeft: 14 },
  destName: { fontFamily: InterFont.medium, fontSize: 15, color: AppColors.onSurface },
  destSub: {
    fontFamily: InterFont.regular,
    fontSize: 12.5,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  destChange: { fontFamily: InterFont.medium, fontSize: 14, color: AppColors.primary },
  ctaWrap: {
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.md,
    paddingTop: AppSpacing.sm,
  },
});

export default WithdrawAmountScreen;
