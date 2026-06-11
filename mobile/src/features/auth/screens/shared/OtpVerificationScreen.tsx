import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import OtpInput, { type OtpInputHandle } from '@core/components/OtpInput';
import TextButton from '@core/components/TextButton';
import { OTP_LOCKOUT_S, OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_S } from '@core/config/constants';
import { AppException, InvalidOtpException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type AuthStackParamList } from '@navigation/types';

import { type AuthIntent, sendOtp, setInitialPassword, verifyOtp } from '../../api/authApi';
import { useSignupDraftStore } from '../../store/signupDraftStore';

type OtpRouteName = 'FemaleSignupOtp' | 'MaleSignupOtp' | 'ForgotPasswordOtp';
type OtpRoute = RouteProp<AuthStackParamList, OtpRouteName>;
type OtpNav = NativeStackNavigationProp<AuthStackParamList>;

/** Where to go on successful verification, derived from the current route. */
function nextRouteFor(
  name: OtpRouteName,
  params: AuthStackParamList[OtpRouteName],
): { route: keyof AuthStackParamList; params?: object } {
  switch (name) {
    case 'FemaleSignupOtp':
      return { route: 'FemaleSignupBankUpi' };
    case 'MaleSignupOtp':
      return { route: 'MaleOnboardingCarousel' };
    case 'ForgotPasswordOtp': {
      const fp = params as AuthStackParamList['ForgotPasswordOtp'];
      return { route: 'ForgotPasswordNew', params: { role: fp.role, phone: fp.phone } };
    }
  }
}

function intentFor(name: OtpRouteName): AuthIntent {
  return name === 'ForgotPasswordOtp' ? 'forgotPassword' : 'signup';
}

/** Masks all but the last 3 digits: 9876543210 → +91 ••••• ••210. */
function maskPhone(phone: string): string {
  const cleaned = phone.replace(/^\+?91/, '').replace(/\s/g, '');
  const tail = cleaned.slice(-3);
  return `+91 ••••• ••${tail}`;
}

/**
 * Shared 6-digit OTP screen used by Female Signup, Male Signup, and Forgot
 * Password. Auto-submits on 6 digits, supports paste, shake on invalid
 * code, 30s resend cooldown, and 3-failed-attempts → 60s lockout.
 */
function OtpVerificationScreen(): React.ReactElement {
  const route = useRoute<OtpRoute>();
  const navigation = useNavigation<OtpNav>();
  const routeName = route.name as OtpRouteName;
  const phone = route.params.phone;
  const intent = intentFor(routeName);

  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(OTP_RESEND_COOLDOWN_S);
  const [lockoutIn, setLockoutIn] = useState(0);
  const failuresRef = useRef<{ count: number; firstAt: number }>({ count: 0, firstAt: 0 });
  const otpRef = useRef<OtpInputHandle>(null);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearResendTimer = (): void => {
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
      resendTimerRef.current = null;
    }
  };
  const clearLockoutTimer = (): void => {
    if (lockoutTimerRef.current) {
      clearInterval(lockoutTimerRef.current);
      lockoutTimerRef.current = null;
    }
  };

  const startResendTimer = useCallback((): void => {
    clearResendTimer();
    setResendIn(OTP_RESEND_COOLDOWN_S);
    resendTimerRef.current = setInterval(() => {
      setResendIn(prev => {
        if (prev <= 1) {
          clearResendTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startLockoutTimer = useCallback((): void => {
    clearLockoutTimer();
    setLockoutIn(OTP_LOCKOUT_S);
    lockoutTimerRef.current = setInterval(() => {
      setLockoutIn(prev => {
        if (prev <= 1) {
          clearLockoutTimer();
          failuresRef.current = { count: 0, firstAt: 0 };
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startResendTimer();
    return () => {
      clearResendTimer();
      clearLockoutTimer();
    };
  }, [startResendTimer]);

  const recordFailure = useCallback((): boolean => {
    const now = Date.now();
    const f = failuresRef.current;
    if (now - f.firstAt > OTP_LOCKOUT_S * 1000) {
      failuresRef.current = { count: 1, firstAt: now };
      return false;
    }
    failuresRef.current = { count: f.count + 1, firstAt: f.firstAt };
    return failuresRef.current.count >= OTP_MAX_ATTEMPTS;
  }, []);

  const handleCompleted = useCallback(
    async (code: string): Promise<void> => {
      if (verifying || lockoutIn > 0) {
        return;
      }
      setError(null);
      setVerifying(true);
      try {
        await verifyOtp(phone, code, intent);
        // The OTP only proves phone ownership — it is NOT the password.
        // Set the signup password exactly once, here, on the session that
        // verifyOtp just created. (Male sets it here too now; the duplicate
        // set at the end of MaleOnboardingCarousel was removed to avoid a
        // `same_password` error.) setInitialPassword is idempotent, so a
        // re-run with the same password is a no-op rather than an error.
        if (routeName === 'FemaleSignupOtp' || routeName === 'MaleSignupOtp') {
          const { password } = useSignupDraftStore.getState();
          if (password) {
            await setInitialPassword(password);
          }
        }
        const next = nextRouteFor(routeName, route.params);
        // Reset the stack so users can't swipe back into the OTP screen.
        navigation.reset({
          index: 0,
          routes: [{ name: next.route, params: next.params } as never],
        });
      } catch (e) {
        if (e instanceof InvalidOtpException) {
          const lockNow = recordFailure();
          setError(
            lockNow
              ? `Too many attempts. Try again in ${OTP_LOCKOUT_S}s.`
              : 'Incorrect code, try again',
          );
          if (lockNow) {
            startLockoutTimer();
          }
          otpRef.current?.clear();
        } else if (e instanceof AppException) {
          setError(e.message);
        } else {
          logger.error('OtpVerificationScreen.verify failed', e);
          setError('Something went wrong, try again');
        }
      } finally {
        setVerifying(false);
      }
    },
    [
      intent,
      lockoutIn,
      navigation,
      phone,
      recordFailure,
      route.params,
      routeName,
      startLockoutTimer,
      verifying,
    ],
  );

  const handleResend = useCallback(async (): Promise<void> => {
    if (resendIn > 0 || lockoutIn > 0) {
      return;
    }
    try {
      await sendOtp(phone, intent);
      otpRef.current?.clear();
      setError(null);
      startResendTimer();
    } catch (e) {
      if (e instanceof AppException) {
        setError(e.message);
      } else {
        logger.error('OtpVerificationScreen.resend failed', e);
        setError('Could not resend the code, try again');
      }
    }
  }, [intent, lockoutIn, phone, resendIn, startResendTimer]);

  const handleChangeNumber = useCallback((): void => {
    navigation.goBack();
  }, [navigation]);

  const inputLocked = lockoutIn > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Verify Mobile" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card padding={AppSpacing.lg} containerStyle={styles.card}>
            <Text style={styles.heading}>Enter verification code</Text>
            <Text style={styles.subtitle}>We sent a 6-digit code to {maskPhone(phone)}</Text>

            <View style={styles.otpWrap}>
              <OtpInput
                key={inputLocked ? 'locked' : 'open'}
                ref={otpRef}
                hasError={error !== null}
                autoFocus={!inputLocked}
                onCompleted={handleCompleted}
              />
            </View>

            {verifying ? (
              <View style={styles.verifyingRow}>
                <ActivityIndicator color={AppColors.primary} />
                <Text style={styles.verifyingText}>Verifying…</Text>
              </View>
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : (
              <View style={styles.errorSpacer} />
            )}

            <View style={styles.resendRow}>
              {inputLocked ? (
                <Text style={styles.muted}>{`Locked — wait ${lockoutIn}s`}</Text>
              ) : resendIn > 0 ? (
                <Text style={styles.muted}>{`Resend in ${resendIn}s`}</Text>
              ) : (
                <TextButton label="Resend OTP" onPress={handleResend} />
              )}
            </View>

            <View style={styles.changeRow}>
              <TextButton label="Change Number" onPress={handleChangeNumber} />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  scroll: { padding: AppSpacing.md, paddingTop: AppSpacing.lg, flexGrow: 1 },
  card: { gap: AppSpacing.md },
  heading: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
  },
  subtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
  otpWrap: { marginTop: AppSpacing.sm },
  verifyingRow: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.sm },
  verifyingText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
  error: {
    ...AppTypography.bodyMedium,
    color: AppColors.error,
  },
  errorSpacer: { height: AppTypography.bodyMedium.lineHeight },
  resendRow: { alignItems: 'center' },
  changeRow: { alignItems: 'center' },
  muted: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
});

export default OtpVerificationScreen;
