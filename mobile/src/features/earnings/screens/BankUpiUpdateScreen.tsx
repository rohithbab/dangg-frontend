import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { moderateScale } from '@theme/responsive';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import Card from '@core/components/Card';
import PrimaryButton from '@core/components/PrimaryButton';
import TextField from '@core/components/TextField';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import {
  bankAccountSchema,
  type BankAccountInput,
  type UpiInput,
  upiSchema,
} from '../../auth/schemas/signupSchema';
import { getPayoutDetails, updatePayoutDetails } from '../api/earningsApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'BankUpiUpdate'>;
type Mode = 'bank' | 'upi';

/**
 * Update screen for an already-saved payout method. Reuses the same Zod
 * schemas as signup so validation stays aligned. Pre-fills the form when
 * existing details are returned by `getPayoutDetails`.
 */
function FemaleBankUpiUpdateScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [mode, setMode] = useState<Mode>('bank');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const bankForm = useForm<BankAccountInput>({
    resolver: zodResolver(bankAccountSchema),
    mode: 'onChange',
    defaultValues: { holderName: '', accountNumber: '', confirmAccountNumber: '', ifsc: '' },
  });

  const upiForm = useForm<UpiInput>({
    resolver: zodResolver(upiSchema),
    mode: 'onChange',
    defaultValues: { upiId: '' },
  });

  useEffect(() => {
    getPayoutDetails()
      .then(details => {
        if (!details) {
          return;
        }
        if (details.kind === 'bank') {
          setMode('bank');
          bankForm.reset({
            holderName: details.holderName,
            accountNumber: '',
            confirmAccountNumber: '',
            ifsc: details.ifsc,
          });
        } else {
          setMode('upi');
          upiForm.reset({ upiId: details.upiId });
        }
      })
      .catch(e => logger.warn('getPayoutDetails failed', e));
  }, [bankForm, upiForm]);

  const submit = useCallback(async (): Promise<void> => {
    setSubmitError(null);
    try {
      if (mode === 'bank') {
        await bankForm.handleSubmit(async data => {
          await updatePayoutDetails({
            kind: 'bank',
            holderName: data.holderName.trim(),
            accountNumber: data.accountNumber,
            ifsc: data.ifsc,
          });
          navigation.goBack();
        })();
      } else {
        await upiForm.handleSubmit(async data => {
          await updatePayoutDetails({ kind: 'upi', upiId: data.upiId.trim() });
          navigation.goBack();
        })();
      }
    } catch (e) {
      if (e instanceof AppException) {
        setSubmitError(e.message);
      } else {
        logger.error('BankUpiUpdateScreen.submit failed', e);
        setSubmitError('Could not update, try again');
      }
    }
  }, [bankForm, mode, navigation, upiForm]);

  const submitDisabled = mode === 'bank' ? !bankForm.formState.isValid : !upiForm.formState.isValid;
  const submitting = bankForm.formState.isSubmitting || upiForm.formState.isSubmitting;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Bank/UPI Details" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>Where should we send your earnings?</Text>

          <View style={styles.segmented}>
            <Segment
              label="Bank Account"
              active={mode === 'bank'}
              onPress={() => setMode('bank')}
            />
            <Segment label="UPI" active={mode === 'upi'} onPress={() => setMode('upi')} />
          </View>

          <Card padding={AppSpacing.lg} containerStyle={styles.card}>
            {mode === 'bank' ? (
              <>
                <Controller
                  control={bankForm.control}
                  name="holderName"
                  render={({ field: { onChange, onBlur, value }, fieldState }) => (
                    <TextField
                      label="Account Holder Name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                      errorText={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={bankForm.control}
                  name="accountNumber"
                  render={({ field: { onChange, onBlur, value }, fieldState }) => (
                    <TextField
                      label="Account Number"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                      maxLength={18}
                      errorText={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={bankForm.control}
                  name="confirmAccountNumber"
                  render={({ field: { onChange, onBlur, value }, fieldState }) => (
                    <TextField
                      label="Confirm Account Number"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                      maxLength={18}
                      errorText={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  control={bankForm.control}
                  name="ifsc"
                  render={({ field: { onChange, onBlur, value }, fieldState }) => (
                    <TextField
                      label="IFSC Code"
                      value={value}
                      onChangeText={t => onChange(t.toUpperCase())}
                      onBlur={onBlur}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={11}
                      errorText={fieldState.error?.message}
                    />
                  )}
                />
              </>
            ) : (
              <Controller
                control={upiForm.control}
                name="upiId"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <TextField
                    label="UPI ID"
                    hint="yourname@oksbi"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    autoCorrect={false}
                    helperText="Example: yourname@oksbi"
                    errorText={fieldState.error?.message}
                  />
                )}
              />
            )}
            {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
          </Card>
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label="Update Details"
            onPress={() => {
              void submit();
            }}
            loading={submitting}
            disabled={submitDisabled}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type SegmentProps = { label: string; active: boolean; onPress: () => void };

function Segment({ label, active, onPress }: SegmentProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.segment, active ? styles.segmentActive : styles.segmentInactive]}
    >
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  scroll: { padding: AppSpacing.md, paddingTop: AppSpacing.lg },
  subtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginBottom: AppSpacing.md,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: moderateScale(4),
    marginBottom: AppSpacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: AppSpacing.sm,
    borderRadius: AppRadii.sm,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: AppColors.primary },
  segmentInactive: { backgroundColor: AppColors.transparent },
  segmentLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurface,
  },
  segmentLabelActive: { color: AppColors.onPrimary },
  card: { gap: AppSpacing.sm },
  submitError: {
    ...AppTypography.bodyMedium,
    color: AppColors.error,
    textAlign: 'center',
  },
  footer: {
    padding: AppSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
    backgroundColor: AppColors.background,
  },
});

export default FemaleBankUpiUpdateScreen;
