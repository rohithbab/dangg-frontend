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

import { UserRole, VerificationStatus } from '@app-types/domain';

import { getFemaleVerificationStatus } from '../../api/authApi';
import VerificationPendingModal from '../../components/VerificationPendingModal';
import { phoneOnlySchema, type PhoneOnlyInput } from '../../schemas/signupSchema';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'FemaleLoginPhone'>;

/**
 * Step 1 of female login. After entering her phone we look up the
 * verification status and branch:
 *   * Verified → password entry.
 *   * Pending  → "verification in progress" modal (stays on this screen).
 *   * None     → re-route into the verification capture flow.
 */
function FemaleLoginPhoneScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
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
        const status = await getFemaleVerificationStatus(cleanedPhone);
        switch (status) {
          case VerificationStatus.Verified:
            navigation.navigate('FemaleLoginPassword', { phone: cleanedPhone });
            return;
          case VerificationStatus.Pending:
            setPendingModalOpen(true);
            return;
          case VerificationStatus.None:
          case VerificationStatus.Rejected:
            navigation.navigate('FemaleSignupVerificationInfo');
            return;
        }
      } catch (e) {
        if (e instanceof AppException) {
          setSubmitError(e.message);
        } else {
          logger.error('FemaleLoginPhoneScreen.onSubmit failed', e);
          setSubmitError('Something went wrong, try again');
        }
      }
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Welcome back" subtitle="Female" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card padding={AppSpacing.lg} containerStyle={styles.card}>
            <Text style={styles.heading}>Enter your mobile number</Text>
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
            <View style={styles.forgotRow}>
              <TextButton
                label="Forgot Password?"
                onPress={() =>
                  navigation.navigate('ForgotPasswordPhone', { role: UserRole.Female })
                }
              />
            </View>
            {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
          </Card>
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label="Continue"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={!isValid}
          />
          <View style={styles.signupRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('FemaleSignupBasicInfo')} hitSlop={8}>
              <Text style={styles.footerLink}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
      <VerificationPendingModal
        visible={pendingModalOpen}
        onDismiss={() => setPendingModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  scroll: { padding: AppSpacing.md, paddingTop: AppSpacing.lg },
  card: { gap: AppSpacing.sm },
  heading: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
    marginBottom: AppSpacing.sm,
  },
  prefix: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  forgotRow: { alignItems: 'flex-end' },
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
  signupRow: {
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

export default FemaleLoginPhoneScreen;
