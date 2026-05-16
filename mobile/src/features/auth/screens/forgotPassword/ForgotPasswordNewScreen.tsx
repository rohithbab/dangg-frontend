import { zodResolver } from '@hookform/resolvers/zod';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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

import { type AuthStackParamList } from '@navigation/types';

import { UserRole } from '@app-types/domain';

import { resetPassword } from '../../api/authApi';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { newPasswordSchema, type NewPasswordInput } from '../../schemas/signupSchema';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPasswordNew'>;
type Route = RouteProp<AuthStackParamList, 'ForgotPasswordNew'>;

/**
 * Step 3 of forgot-password — set a new password and route the user back
 * to the role-appropriate login. Back gesture is disabled at navigator
 * level so the user can't slip back into the OTP screen post-reset.
 */
function ForgotPasswordNewScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { phone, role } = route.params;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
    watch,
  } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    mode: 'onChange',
    defaultValues: { newPassword: '', confirmNewPassword: '' },
  });

  const newPasswordValue = watch('newPassword');

  const onSubmit = useCallback(
    async (data: NewPasswordInput): Promise<void> => {
      setSubmitError(null);
      try {
        await resetPassword(phone, data.newPassword);
        const loginRoute = role === UserRole.Female ? 'FemaleLoginPhone' : 'MaleLogin';
        navigation.reset({ index: 0, routes: [{ name: loginRoute }] });
      } catch (e) {
        if (e instanceof AppException) {
          setSubmitError(e.message);
        } else {
          logger.error('ForgotPasswordNewScreen.reset failed', e);
          setSubmitError('Could not reset password, try again');
        }
      }
    },
    [navigation, phone, role],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Create New Password" showBack={false} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card padding={AppSpacing.lg} containerStyle={styles.card}>
            <Text style={styles.heading}>Create new password</Text>
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <View>
                  <TextField
                    label="New Password"
                    hint="At least 8 characters with a letter and a number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    passwordToggle
                    autoCapitalize="none"
                    autoCorrect={false}
                    errorText={fieldState.error?.message}
                  />
                  <PasswordStrengthMeter password={newPasswordValue} />
                </View>
              )}
            />
            <Controller
              control={control}
              name="confirmNewPassword"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <TextField
                  label="Confirm New Password"
                  hint="Re-enter the new password"
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
            {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
          </Card>
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label="Reset Password"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={!isValid}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  scroll: { padding: AppSpacing.md, paddingTop: AppSpacing.lg },
  card: { gap: AppSpacing.sm },
  heading: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
  },
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

export default ForgotPasswordNewScreen;
