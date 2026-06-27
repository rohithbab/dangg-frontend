import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Controller, type Control, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
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
 * Skippable payout-details step (Neue). Bank OR UPI via a segmented switch,
 * Neue labelled fields, and a Skip in the header that advances without saving.
 * All react-hook-form + zod validation and the save/skip logic are unchanged.
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

  const onSavePress = useCallback((): void => {
    if (mode === 'bank') {
      void bankForm.handleSubmit(data =>
        persistAndContinue({
          kind: 'bank',
          bank: {
            holderName: data.holderName.trim(),
            accountNumber: data.accountNumber,
            ifsc: data.ifsc,
          },
        }),
      )();
    } else {
      void upiForm.handleSubmit(data =>
        persistAndContinue({ kind: 'upi', upiId: data.upiId.trim() }),
      )();
    }
  }, [bankForm, mode, persistAndContinue, upiForm]);

  const submitDisabled = mode === 'bank' ? !bankForm.formState.isValid : !upiForm.formState.isValid;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Payout Details</Text>
        <Pressable accessibilityRole="button" hitSlop={10} onPress={handleSkip}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>
            Where should we send your earnings? You can update this anytime.
          </Text>

          <View style={styles.segmented}>
            <Segment
              label="Bank Account"
              active={mode === 'bank'}
              onPress={() => setMode('bank')}
            />
            <Segment label="UPI" active={mode === 'upi'} onPress={() => setMode('upi')} />
          </View>

          {mode === 'bank' ? (
            <>
              <Field
                control={bankForm.control}
                name="holderName"
                label="ACCOUNT HOLDER NAME"
                placeholder="Aisha Verma"
                autoCapitalize="words"
              />
              <Field
                control={bankForm.control}
                name="accountNumber"
                label="ACCOUNT NUMBER"
                keyboardType="number-pad"
                maxLength={18}
              />
              <Field
                control={bankForm.control}
                name="confirmAccountNumber"
                label="CONFIRM ACCOUNT NUMBER"
                keyboardType="number-pad"
                maxLength={18}
              />
              <Field
                control={bankForm.control}
                name="ifsc"
                label="IFSC CODE"
                placeholder="HDFC0001234"
                autoCapitalize="characters"
                maxLength={11}
                transform={t => t.toUpperCase()}
              />
            </>
          ) : (
            <Field
              control={upiForm.control}
              name="upiId"
              label="UPI ID"
              placeholder="yourname@oksbi"
              autoCapitalize="none"
              hint="Example: yourname@oksbi"
            />
          )}
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

function Segment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.segment, active && styles.segmentActive]}
    >
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  );
}

type FieldProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- shared across two RHF forms
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
  hint?: string;
  keyboardType?: 'default' | 'number-pad';
  autoCapitalize?: 'none' | 'words' | 'characters';
  maxLength?: number;
  transform?: (t: string) => string;
};

function Field({
  control,
  name,
  label,
  placeholder,
  hint,
  keyboardType = 'default',
  autoCapitalize = 'none',
  maxLength,
  transform,
}: FieldProps): React.ReactElement {
  const [focused, setFocused] = useState(false);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState }) => (
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>{label}</Text>
          <View
            style={[
              styles.field,
              focused && styles.fieldFocused,
              fieldState.error ? styles.fieldError : null,
            ]}
          >
            <TextInput
              style={styles.input}
              value={value as string}
              onChangeText={t => onChange(transform ? transform(t) : t)}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                onBlur();
              }}
              placeholder={placeholder}
              placeholderTextColor={AppColors.onSurfaceDisabled}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              autoCorrect={false}
              maxLength={maxLength}
            />
          </View>
          {fieldState.error ? (
            <Text style={styles.fieldErrorText}>{fieldState.error.message}</Text>
          ) : hint ? (
            <Text style={styles.hint}>{hint}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.md,
    paddingBottom: AppSpacing.sm,
  },
  title: {
    fontFamily: InterFont.regular,
    fontSize: 28,
    letterSpacing: -0.6,
    color: AppColors.onSurface,
  },
  skip: { fontFamily: InterFont.medium, fontSize: 15, color: AppColors.primary },
  scroll: { paddingHorizontal: AppSpacing.lg, paddingBottom: AppSpacing.lg },
  subtitle: {
    fontFamily: InterFont.regular,
    fontSize: 14.5,
    lineHeight: 21,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
    marginBottom: AppSpacing.lg,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 4,
    marginBottom: AppSpacing.lg,
  },
  segment: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: AppColors.primary },
  segmentLabel: { fontFamily: InterFont.medium, fontSize: 14.5, color: AppColors.onSurfaceMuted },
  segmentLabelActive: { color: '#FFFFFF' },
  fieldWrap: { marginBottom: AppSpacing.md },
  label: {
    fontFamily: InterFont.medium,
    fontSize: 11.5,
    letterSpacing: 0.7,
    color: '#6B6B73',
    marginBottom: AppSpacing.sm,
  },
  field: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0E0E10',
    borderWidth: 1.5,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  fieldFocused: { borderColor: 'rgba(220,48,143,0.8)' },
  fieldError: { borderColor: AppColors.error },
  input: { fontFamily: InterFont.regular, fontSize: 16, color: AppColors.onSurface, padding: 0 },
  hint: {
    fontFamily: InterFont.regular,
    fontSize: 12.5,
    color: AppColors.onSurfaceMuted,
    marginTop: 6,
  },
  fieldErrorText: {
    fontFamily: InterFont.medium,
    fontSize: 12.5,
    color: AppColors.error,
    marginTop: 6,
  },
  footer: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
    paddingBottom: AppSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.border,
  },
  errorText: {
    fontFamily: InterFont.medium,
    fontSize: 13,
    color: AppColors.error,
    marginBottom: AppSpacing.sm,
    textAlign: 'center',
  },
});

export default BankUpiDetailsScreen;
