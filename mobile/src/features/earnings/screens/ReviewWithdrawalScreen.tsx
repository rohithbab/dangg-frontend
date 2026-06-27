import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import { AppException } from '@core/network/apiException';
import { inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import { getPayoutDetails, requestPayout } from '../api/earningsApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'ReviewWithdrawal'>;
type Route = RouteProp<FemaleAppStackParamList, 'ReviewWithdrawal'>;

/** F7 · Review withdrawal — confirm amount + destination, then request payout. */
function ReviewWithdrawalScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const { amountInr } = useRoute<Route>().params;

  const [destination, setDestination] = useState<string>('your saved method');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getPayoutDetails()
      .then(d => {
        if (d) {
          setDestination(
            d.kind === 'upi' ? d.upiId : `Bank •••• ${d.accountNumberMasked.slice(-4)}`,
          );
        }
      })
      .catch(e => logger.warn('ReviewWithdrawalScreen.details failed', e));
  }, []);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await requestPayout(amountInr);
      navigation.replace('WithdrawResult', { amountInr, destinationLabel: destination });
    } catch (e) {
      setSubmitting(false);
      setError(
        e instanceof AppException ? e.message : 'Could not request the withdrawal, try again',
      );
      if (!(e instanceof AppException)) {
        logger.error('ReviewWithdrawalScreen.confirm failed', e);
      }
    }
  }, [amountInr, destination, navigation, submitting]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
        <Text style={styles.title}>Review</Text>

        <View style={styles.card}>
          <Row label="Amount" value={inr(amountInr)} />
          <Row label="To" value={destination} />
          <Row label="Fee" value="Free" valueColor={AppColors.success} />
          <Row label="Arrives" value="in 2–3 business days" last />
        </View>

        <View style={styles.receiveRow}>
          <Text style={styles.receiveLabel}>You'll receive</Text>
          <Text style={styles.receiveValue}>{inr(amountInr)}</Text>
        </View>
        <Text style={styles.note}>Make sure your bank details are correct.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.ctaWrap}>
        <PrimaryButton
          label="Confirm withdrawal"
          loading={submitting}
          onPress={() => {
            void handleConfirm();
          }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          disabled={submitting}
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  valueColor,
  last,
}: {
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}): React.ReactElement {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: { height: 48, justifyContent: 'center', paddingHorizontal: AppSpacing.md },
  back: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: AppSpacing.lg },
  title: {
    fontFamily: InterFont.regular,
    fontSize: 28,
    letterSpacing: -0.6,
    color: AppColors.onSurface,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 18,
    marginTop: AppSpacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontFamily: InterFont.regular, fontSize: 14.5, color: AppColors.onSurfaceMuted },
  rowValue: { fontFamily: InterFont.medium, fontSize: 14.5, color: AppColors.onSurface },
  receiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: AppSpacing.lg,
  },
  receiveLabel: { fontFamily: InterFont.regular, fontSize: 15, color: AppColors.onSurfaceMuted },
  receiveValue: { fontFamily: InterFont.semibold, fontSize: 18, color: AppColors.onSurface },
  note: {
    fontFamily: InterFont.regular,
    fontSize: 13,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
  },
  errorText: {
    fontFamily: InterFont.medium,
    fontSize: 13,
    color: AppColors.error,
    marginTop: AppSpacing.md,
  },
  ctaWrap: {
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.md,
    paddingTop: AppSpacing.sm,
  },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { fontFamily: InterFont.medium, fontSize: 15, color: AppColors.onSurfaceMuted },
});

export default ReviewWithdrawalScreen;
