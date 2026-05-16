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

import { sendOtp } from '../../api/authApi';
import { phoneOnlySchema, type PhoneOnlyInput } from '../../schemas/signupSchema';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPasswordPhone'>;
type Route = RouteProp<AuthStackParamList, 'ForgotPasswordPhone'>;

/**
 * Step 1 of the forgot-password flow — phone entry. On submit we send a
 * forgot-password OTP and push to the shared OTP screen which routes back
 * here on Change Number or forward to the new-password screen on success.
 */
function ForgotPasswordPhoneScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { role } = route.params;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<PhoneOnlyInput>({
    resolver: zodResolver(phoneOnlySchema),
    mode: 'onChange',
    defaultValues: { phone: '' },
  });

  const onSubmit = useCallback(
    async (data: PhoneOnlyInput): Promise<void> => {
      setSubmitError(null);
      const cleanedPhone = data.phone.replace(/\D/g, '').slice(-10);
      try {
        await sendOtp(cleanedPhone, 'forgotPassword');
        navigation.navigate('ForgotPasswordOtp', { phone: cleanedPhone, role });
      } catch (e) {
        if (e instanceof AppException) {
          setSubmitError(e.message);
        } else {
          logger.error('ForgotPasswordPhoneScreen.onSubmit failed', e);
          setSubmitError('Something went wrong, try again');
        }
      }
    },
    [navigation, role],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Reset Password" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card padding={AppSpacing.lg} containerStyle={styles.card}>
            <Text style={styles.heading}>Enter your registered mobile number</Text>
            <Text style={styles.subtitle}>
              We'll send a verification code to reset your password.
            </Text>
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
          </Card>
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label="Send OTP"
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
  subtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginBottom: AppSpacing.sm,
  },
  prefix: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
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

export default ForgotPasswordPhoneScreen;
