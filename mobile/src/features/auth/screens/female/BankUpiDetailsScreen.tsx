import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
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
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import Card from '@core/components/Card';
import PrimaryButton from '@core/components/PrimaryButton';
import TextButton from '@core/components/TextButton';
import TextField from '@core/components/TextField';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type AuthStackParamList } from '@navigation/types';

import { savePayoutDetails } from '../../api/authApi';
import {
  bankAccountSchema,
  type BankAccountInput,
  type UpiInput,
  upiSchema,
} from '../../schemas/signupSchema';
import { useSignupDraftStore } from '../../store/signupDraftStore';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'FemaleSignupBankUpi'>;
type Mode = 'bank' | 'upi';

/**
 * Skippable payout-details step. The female can fill bank account OR UPI;
 * a Skip link in the app bar advances without saving anything — the
 * earnings dashboard will nag her later if she never completes it.
 */
function BankUpiDetailsScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const setPayoutDetails = useSignupDraftStore(s => s.setPayoutDetails);
  const skipPayoutDetails = useSignupDraftStore(s => s.skipPayoutDetails);
  const [mode, setMode] = useState<Mode>('bank');
  const [submitting, setSubmitting] = useState(false);
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

  const handleSkip = useCallback((): void => {
    skipPayoutDetails();
    navigation.navigate('FemaleSignupVerificationInfo');
  }, [navigation, skipPayoutDetails]);

  // Persist payout details to the backend (RLS-scoped to self), keep a draft
  // copy for resilience, then advance. On failure we surface an inline error
  // and stay so her details aren't silently lost.
  const persistAndContinue = useCallback(
    async (payout: Parameters<typeof setPayoutDetails>[0]): Promise<void> => {
      setSubmitError(null);
      setSubmitting(true);
      try {
        setPayoutDetails(payout);
        await savePayoutDetails(payout);
        navigation.navigate('FemaleSignupVerificationInfo');
      } catch (e) {
        if (e instanceof AppException) {
          setSubmitError(e.message);
        } else {
          logger.error('BankUpiDetailsScreen.persist failed', e);
          setSubmitError('Could not save payout details, try again');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [navigation, setPayoutDetails],
  );

  const handleBankSubmit = useCallback(
    (data: BankAccountInput): void => {
      void persistAndContinue({
        kind: 'bank',
        bank: {
          holderName: data.holderName.trim(),
          accountNumber: data.accountNumber,
          ifsc: data.ifsc,
        },
      });
    },
    [persistAndContinue],
  );

  const handleUpiSubmit = useCallback(
    (data: UpiInput): void => {
      void persistAndContinue({ kind: 'upi', upiId: data.upiId.trim() });
    },
    [persistAndContinue],
  );

  const onSavePress = useCallback((): void => {
    if (mode === 'bank') {
      void bankForm.handleSubmit(handleBankSubmit)();
    } else {
      void upiForm.handleSubmit(handleUpiSubmit)();
    }
  }, [bankForm, handleBankSubmit, handleUpiSubmit, mode, upiForm]);

  const submitDisabled = mode === 'bank' ? !bankForm.formState.isValid : !upiForm.formState.isValid;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Payout Details" actions={<TextButton label="Skip" onPress={handleSkip} />} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>
            Where should we send your earnings? You can update this anytime.
          </Text>

          <View style={styles.segmented}>
            <ModeSegment
              label="Bank Account"
              active={mode === 'bank'}
              onPress={() => setMode('bank')}
            />
            <ModeSegment label="UPI" active={mode === 'upi'} onPress={() => setMode('upi')} />
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
          </Card>
        </ScrollView>
        <View style={styles.footer}>
          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
          <PrimaryButton
            label="Save & Continue"
            onPress={onSavePress}
            disabled={submitDisabled || submitting}
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ModeSegmentProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function ModeSegment({ label, active, onPress }: ModeSegmentProps): React.ReactElement {
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
  scroll: { padding: AppSpacing.md, paddingBottom: AppSpacing.lg },
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
    padding: 4,
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
  footer: {
    padding: AppSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
    backgroundColor: AppColors.background,
  },
  errorText: {
    ...AppTypography.bodySmall,
    color: AppColors.error,
    marginBottom: AppSpacing.sm,
    textAlign: 'center',
  },
});

export default BankUpiDetailsScreen;
