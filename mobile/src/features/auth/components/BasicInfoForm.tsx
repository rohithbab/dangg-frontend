import { zodResolver } from '@hookform/resolvers/zod';
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
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import Card from '@core/components/Card';
import PrimaryButton from '@core/components/PrimaryButton';
import TextField from '@core/components/TextField';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { UserRole } from '@app-types/domain';

import { sendOtp } from '../api/authApi';
import { basicInfoSchema, type BasicInfoInput } from '../schemas/signupSchema';
import { useSignupDraftStore } from '../store/signupDraftStore';

import PasswordStrengthMeter from './PasswordStrengthMeter';
import RoleLoginBottomSheet from './RoleLoginBottomSheet';

export type BasicInfoFormProps = {
  role: UserRole.Female | UserRole.Male;
  /** Navigate to the role-specific OTP screen on success. */
  onOtpRequested: (phone: string) => void;
  /** Navigate to role-specific login from the footer link. */
  onPickLogin: (role: UserRole.Female | UserRole.Male) => void;
};

const GENDER_LABEL = { [UserRole.Female]: 'Female', [UserRole.Male]: 'Male' } as const;
const ROLE_SUBTITLE = { [UserRole.Female]: 'Female', [UserRole.Male]: 'Male' } as const;

/**
 * Shared basic-info form for female + male signup. Validates with Zod,
 * stores the result in the signup-draft Zustand store, then requests an
 * OTP and hands off to the role-specific OTP screen via `onOtpRequested`.
 */
function BasicInfoForm({
  role,
  onOtpRequested,
  onPickLogin,
}: BasicInfoFormProps): React.ReactElement {
  const setBasicInfo = useSignupDraftStore(s => s.setBasicInfo);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
    watch,
  } = useForm<BasicInfoInput>({
    resolver: zodResolver(basicInfoSchema),
    mode: 'onChange',
    defaultValues: { name: '', age: '', password: '', confirmPassword: '', phone: '' },
  });

  const passwordValue = watch('password');

  const onSubmit = useCallback(
    async (data: BasicInfoInput): Promise<void> => {
      setSubmitError(null);
      try {
        const ageNum = Number.parseInt(data.age, 10);
        const cleanedPhone = data.phone.replace(/\D/g, '').slice(-10);
        setBasicInfo({
          role,
          name: data.name.trim(),
          age: ageNum,
          password: data.password,
          phone: cleanedPhone,
        });
        await sendOtp(cleanedPhone, 'signup');
        onOtpRequested(cleanedPhone);
      } catch (e) {
        if (e instanceof AppException) {
          setSubmitError(e.message);
        } else {
          logger.error('BasicInfoForm.onSubmit failed', e);
          setSubmitError('Something went wrong, try again');
        }
      }
    },
    [onOtpRequested, role, setBasicInfo],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Create Account" subtitle={ROLE_SUBTITLE[role]} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card padding={AppSpacing.lg} containerStyle={styles.card}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <TextField
                  label="Full Name"
                  hint="Enter your full name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  textContentType="name"
                  errorText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="age"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <TextField
                  label="Age"
                  hint="18 or older"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  maxLength={3}
                  errorText={fieldState.error?.message}
                />
              )}
            />
            <View>
              <Text style={styles.disabledLabel}>Gender</Text>
              <View style={styles.disabledField}>
                <Text style={styles.disabledText}>{GENDER_LABEL[role]}</Text>
              </View>
            </View>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <View>
                  <TextField
                    label="Password"
                    hint="At least 8 characters with a letter and a number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    passwordToggle
                    autoCapitalize="none"
                    autoCorrect={false}
                    errorText={fieldState.error?.message}
                  />
                  <PasswordStrengthMeter password={passwordValue} />
                </View>
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <TextField
                  label="Confirm Password"
                  hint="Re-enter password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  passwordToggle
                  autoCapitalize="none"
                  autoCorrect={false}
                  errorText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <TextField
                  label="Mobile Number"
                  hint="10-digit mobile"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  maxLength={10}
                  leftIcon={<Text style={styles.prefix}>+91</Text>}
                  errorText={fieldState.error?.message}
                />
              )}
            />

            {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

            <PrimaryButton
              label="Generate OTP"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={!isValid}
            />

            <View style={styles.loginRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => setLoginSheetOpen(true)} hitSlop={8}>
                <Text style={styles.footerLink}>Login</Text>
              </Pressable>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <RoleLoginBottomSheet
        visible={loginSheetOpen}
        onClose={() => setLoginSheetOpen(false)}
        onPick={r => {
          setLoginSheetOpen(false);
          onPickLogin(r);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  scroll: { padding: AppSpacing.md, paddingBottom: AppSpacing.xl, flexGrow: 1 },
  card: { gap: AppSpacing.sm },
  disabledLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
    marginBottom: AppSpacing.xs,
  },
  disabledField: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.primarySubtle,
    paddingHorizontal: AppSpacing.md,
    justifyContent: 'center',
  },
  disabledText: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
  },
  prefix: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  submitError: {
    ...AppTypography.bodyMedium,
    color: AppColors.error,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: AppSpacing.sm,
  },
  footerText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
  footerLink: {
    ...AppTypography.bodyMedium,
    color: AppColors.primary,
    fontWeight: '600',
  },
});

export default BasicInfoForm;
