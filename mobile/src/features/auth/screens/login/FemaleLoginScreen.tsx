import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import Card from '@core/components/Card';
import PrimaryButton from '@core/components/PrimaryButton';
import TextButton from '@core/components/TextButton';
import TextField from '@core/components/TextField';
import { USE_MOCK_DATA } from '@core/config/env';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';
import { Validators, ZodSchemas } from '@core/utils/validators';

import { type AuthStackParamList } from '@navigation/types';

import { UserRole, VerificationStatus } from '@app-types/domain';

import {
  getFemaleVerificationStatus,
  signInWithPassword,
  signInWithPasswordDev,
  type FemaleVerificationStatusInfo,
} from '../../api/authApi';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'FemaleLogin'>;

const femaleLoginSchema = z.object({
  phone: ZodSchemas.phoneIndian,
  password: z.string().min(1, 'Enter your password'),
});
type FemaleLoginInput = z.infer<typeof femaleLoginSchema>;

interface PendingModalProps {
  visible: boolean;
  onDismiss: () => void;
}

function PendingModal({ visible, onDismiss }: PendingModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <View style={modalStyles.scrim}>
        <View style={modalStyles.card}>
          <View style={modalStyles.iconContainer}>
            <Text style={modalStyles.icon}>⏳</Text>
          </View>
          <Text style={modalStyles.title}>Verification in progress</Text>
          <Text style={modalStyles.body}>
            Our team is still reviewing your photo. Please check back later.
          </Text>
          <PrimaryButton label="OK" onPress={onDismiss} />
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: AppColors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.lg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppSpacing.md,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
    textAlign: 'center',
    marginBottom: AppSpacing.sm,
    fontWeight: '700',
  },
  body: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginBottom: AppSpacing.lg,
    lineHeight: 20,
  },
});

function FemaleLoginScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState<'phone' | 'password'>('phone');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusInfo, setStatusInfo] = useState<FemaleVerificationStatusInfo | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    watch,
    formState: { isSubmitting },
  } = useForm<FemaleLoginInput>({
    resolver: zodResolver(femaleLoginSchema),
    mode: 'onChange',
    defaultValues: { phone: '', password: '' },
  });

  const phoneValue = watch('phone');
  const isPhoneValid = Validators.phoneIndian(phoneValue);

  const handleContinue = useCallback(async (): Promise<void> => {
    setInlineError(null);
    const valid = await trigger('phone');
    if (!valid) {
      return;
    }
    const enteredPhone = getValues('phone');
    const cleanedPhone = enteredPhone.replace(/\D/g, '').slice(-10);

    setCheckingStatus(true);
    try {
      const info = await getFemaleVerificationStatus(cleanedPhone);
      if (info.status === VerificationStatus.Pending) {
        setShowPendingModal(true);
      } else {
        // None, Rejected, or Verified
        setStatusInfo(info);
        setStep('password');
      }
    } catch (e) {
      if (e instanceof AppException) {
        setInlineError(e.message);
      } else {
        logger.error('FemaleLoginScreen.handleContinue failed', e);
        setInlineError('Could not verify status, try again');
      }
    } finally {
      setCheckingStatus(false);
    }
  }, [trigger, getValues]);

  const onSubmit = useCallback(async (data: FemaleLoginInput): Promise<void> => {
    setInlineError(null);
    const cleanedPhone = data.phone.replace(/\D/g, '').slice(-10);
    try {
      if (USE_MOCK_DATA) {
        await signInWithPasswordDev(cleanedPhone, data.password, UserRole.Female);
      } else {
        await signInWithPassword(cleanedPhone, data.password);
      }
    } catch (e) {
      if (e instanceof AppException) {
        setInlineError(e.message);
      } else {
        logger.error('FemaleLoginScreen.onSubmit failed', e);
        setInlineError('Could not sign in, try again');
      }
    }
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'password') {
      setStep('phone');
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Reached as a navigation root (e.g. after verification) — fall back to
      // the account-type chooser so the user isn't stranded with no way back.
      navigation.navigate('AccountType');
    }
  }, [step, navigation]);

  const appBarTitle =
    step === 'password' && statusInfo?.name ? `Welcome back, ${statusInfo.name}` : 'Welcome back';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title={appBarTitle} subtitle="Female" onBack={handleBack} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card padding={AppSpacing.lg} containerStyle={styles.card}>
            {step === 'password' && statusInfo?.name ? (
              <View style={styles.profileHeader}>
                {statusInfo.profilePictureUrl ? (
                  <Image source={{ uri: statusInfo.profilePictureUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.defaultAvatar}>
                    <Text style={styles.avatarGlyph}>👤</Text>
                  </View>
                )}
                <Text style={styles.profileName}>{statusInfo.name}</Text>
              </View>
            ) : null}

            {step === 'phone' ? (
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
                    errorText={inlineError ?? fieldState.error?.message}
                  />
                )}
              />
            ) : (
              // Read-only view of Phone when on Password step so they can see which account
              <View style={styles.disabledInput}>
                <TextField
                  label="Mobile Number"
                  value={getValues('phone')}
                  editable={false}
                  leftIcon={<Text style={styles.prefixDisabled}>+91</Text>}
                />
              </View>
            )}

            {step === 'password' && (
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value }, fieldState }) => (
                  <TextField
                    label="Password"
                    hint="Enter your password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    passwordToggle
                    autoCapitalize="none"
                    autoCorrect={false}
                    errorText={inlineError ?? fieldState.error?.message}
                  />
                )}
              />
            )}

            <View style={styles.forgotRow}>
              <TextButton
                label="Forgot Password?"
                onPress={() =>
                  navigation.navigate('ForgotPasswordPhone', { role: UserRole.Female })
                }
              />
            </View>
          </Card>
        </ScrollView>
        <View style={styles.footer}>
          {step === 'phone' ? (
            <PrimaryButton
              label="Continue"
              onPress={handleContinue}
              loading={checkingStatus}
              disabled={!isPhoneValid}
            />
          ) : (
            <PrimaryButton label="Login" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
          )}
          <View style={styles.signupRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('FemaleSignupBasicInfo')} hitSlop={8}>
              <Text style={styles.footerLink}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
      <PendingModal visible={showPendingModal} onDismiss={() => setShowPendingModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  scroll: { padding: AppSpacing.md, paddingTop: AppSpacing.lg },
  card: {
    gap: AppSpacing.sm,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  prefix: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  prefixDisabled: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
  },
  disabledInput: {
    opacity: 0.65,
  },
  forgotRow: { alignItems: 'flex-end' },
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
  profileHeader: {
    alignItems: 'center',
    marginVertical: AppSpacing.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: AppSpacing.xs,
  },
  defaultAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppSpacing.xs,
  },
  avatarGlyph: {
    fontSize: 32,
  },
  profileName: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    fontWeight: '600',
  },
});

export default FemaleLoginScreen;
