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
import Svg, { Circle, Defs, Line, LinearGradient, Stop } from 'react-native-svg';

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

function FemaleHeaderIcon(): React.ReactElement {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="femaleHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={AppColors.splashBackground} />
          <Stop offset="100%" stopColor={AppColors.primary} />
        </LinearGradient>
      </Defs>
      <Circle cx={24} cy={24} r={24} fill="url(#femaleHeaderGrad)" />
      <Circle cx={24} cy={18} r={7} stroke="white" strokeWidth={2.5} fill="none" />
      <Line
        x1={24}
        y1={25}
        x2={24}
        y2={37}
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Line
        x1={19}
        y1={31}
        x2={29}
        y2={31}
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MaleHeaderIcon(): React.ReactElement {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="maleHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={AppColors.primaryDark} />
          <Stop offset="100%" stopColor={AppColors.primary} />
        </LinearGradient>
      </Defs>
      <Circle cx={24} cy={24} r={24} fill="url(#maleHeaderGrad)" />
      <Circle cx={19} cy={29} r={7} stroke="white" strokeWidth={2.5} fill="none" />
      <Line
        x1={24}
        y1={24}
        x2={35}
        y2={13}
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Line
        x1={28}
        y1={13}
        x2={35}
        y2={13}
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <Line
        x1={35}
        y1={13}
        x2={35}
        y2={20}
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Shared basic-info form for female + male signup. Validates with Zod,
 * stores the result in the signup-draft Zustand store, then requests an
 * OTP and hands off to the role-specific OTP screen via `onOtpRequested`.
 *
 * Upgraded with premium glowing role-specific shadows, clean borders,
 * custom gender indicator backgrounds, and enhanced footer login links.
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

  const isFemale = role === UserRole.Female;
  const cardBorderColor = isFemale ? AppColors.gradientRoseSubtleStart : '#EAD5DA';
  const shadowColor = isFemale ? AppColors.primary : AppColors.primaryDark;
  const shadowOpacity = isFemale ? 0.16 : 0.14;

  const disabledBg = isFemale ? AppColors.primarySubtle : '#F9EBEE';
  const disabledBorder = isFemale ? AppColors.border : '#EAD5DA';
  const disabledTextColor = isFemale ? AppColors.primary : AppColors.primaryDark;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Create Account" subtitle={ROLE_SUBTITLE[role]} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          alwaysBounceVertical={false}
        >
          <Card
            padding={20}
            containerStyle={StyleSheet.flatten([
              styles.card,
              {
                borderColor: cardBorderColor,
                shadowColor: shadowColor,
                shadowOpacity: shadowOpacity,
              },
            ])}
          >
            <View style={styles.headerBlock}>
              <View style={styles.badgeContainer}>
                {isFemale ? <FemaleHeaderIcon /> : <MaleHeaderIcon />}
              </View>
              <Text style={styles.headerTitle}>Personal Details</Text>
              <Text style={styles.headerSubtitle}>
                {isFemale
                  ? 'Complete your profile to start earning'
                  : 'Set up your profile to start chatting'}
              </Text>
            </View>

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

            <View style={styles.rowFieldContainer}>
              <View style={styles.halfWidth}>
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
              </View>
              <View style={styles.halfWidth}>
                <View>
                  <Text style={styles.disabledLabel}>Gender</Text>
                  <View
                    style={[
                      styles.disabledField,
                      { backgroundColor: disabledBg, borderColor: disabledBorder },
                    ]}
                  >
                    <Text style={[styles.disabledText, { color: disabledTextColor }]}>
                      {GENDER_LABEL[role]}
                    </Text>
                  </View>
                </View>
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
                  {passwordValue ? <PasswordStrengthMeter password={passwordValue} /> : null}
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
  scroll: {
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.md,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    gap: AppSpacing.sm,
    borderWidth: 1,
    borderRadius: 24,
    backgroundColor: AppColors.surface,
    // Soft premium shadow
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 6,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: AppSpacing.md,
  },
  badgeContainer: {
    marginBottom: AppSpacing.sm,
  },
  headerTitle: {
    ...AppTypography.titleLarge,
    color: AppColors.onSurface,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSubtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
  },
  rowFieldContainer: {
    flexDirection: 'row',
    gap: AppSpacing.md,
    alignItems: 'flex-start',
  },
  halfWidth: {
    flex: 1,
  },
  disabledLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
    marginBottom: AppSpacing.xs,
  },
  disabledField: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: AppSpacing.md,
    justifyContent: 'center',
  },
  disabledText: {
    ...AppTypography.bodyLarge,
    fontWeight: '600',
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
    marginTop: AppSpacing.md,
  },
  footerText: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
  },
  footerLink: {
    ...AppTypography.bodyLarge,
    color: AppColors.primary,
    fontWeight: '700',
  },
});

export default BasicInfoForm;
