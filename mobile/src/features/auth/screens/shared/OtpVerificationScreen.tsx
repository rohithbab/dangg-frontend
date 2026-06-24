import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import OtpInput, { type OtpInputHandle } from '@core/components/OtpInput';
import PrimaryButton from '@core/components/PrimaryButton';
import {
  OTP_LENGTH,
  OTP_LOCKOUT_S,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_S,
} from '@core/config/constants';
import { AppException, InvalidOtpException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type AuthStackParamList } from '@navigation/types';

import { type AuthIntent, finishLogin, sendOtp, verifyOtp } from '../../api/authApi';
import { useSignupDraftStore } from '../../store/signupDraftStore';

type OtpRouteName = 'SignupOtp' | 'LoginOtp';
type OtpRoute = RouteProp<AuthStackParamList, OtpRouteName>;
type OtpNav = NativeStackNavigationProp<AuthStackParamList>;

function intentFor(name: OtpRouteName): AuthIntent {
  return name === 'LoginOtp' ? 'login' : 'signup';
}

/** Masks all but the last 3 digits: 9876543210 → +91 ••••• ••210. */
function maskPhone(phone: string): string {
  const cleaned = phone.replace(/^\+?91/, '').replace(/\s/g, '');
  const tail = cleaned.slice(-3);
  return `+91 ••••• ••${tail}`;
}

/**
 * Shared 6-digit OTP screen (Neue) used by Female Signup, Male Signup, and
 * Forgot Password. Auto-submits on 6 digits, supports paste, shake on invalid
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
        if (routeName === 'LoginOtp') {
          const { needsProfile } = await finishLogin(phone);
          if (needsProfile) {
            // Phone verified but the account never finished signup — send the
            // user to the Profile setup screen to complete it.
            useSignupDraftStore.getState().setPhone(phone);
            navigation.reset({ index: 0, routes: [{ name: 'SignupProfile' }] });
          }
          // Otherwise the session is established and RootNavigator routes by role.
          return;
        }
        // Signup: phone proven → collect the profile (Phone → OTP → Profile).
        navigation.reset({ index: 0, routes: [{ name: 'SignupProfile' }] });
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
    [intent, lockoutIn, navigation, phone, recordFailure, routeName, startLockoutTimer, verifying],
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

  const handleVerifyPress = useCallback((): void => {
    const value = otpRef.current?.value() ?? '';
    if (value.length === OTP_LENGTH) {
      void handleCompleted(value);
    }
  }, [handleCompleted]);

  const inputLocked = lockoutIn > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <ChevronLeft size={26} color={AppColors.onSurface} strokeWidth={2} />
        </Pressable>

        <View style={styles.body}>
          <Text style={styles.title}>Verify your{'\n'}number</Text>
          <Text style={styles.subtitle}>
            {`Sent to ${maskPhone(phone)}  `}
            <Text style={styles.change} onPress={() => navigation.goBack()}>
              Change
            </Text>
          </Text>

          <View style={styles.otpWrap}>
            <OtpInput
              key={inputLocked ? 'locked' : 'open'}
              ref={otpRef}
              hasError={error !== null}
              autoFocus={!inputLocked}
              onCompleted={handleCompleted}
            />
          </View>

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <Text style={styles.resend}>
              {inputLocked
                ? `Locked — wait ${lockoutIn}s`
                : resendIn > 0
                  ? `Resend code in 0:${String(resendIn).padStart(2, '0')}`
                  : ''}
            </Text>
          )}
          {!error && !inputLocked && resendIn === 0 ? (
            <Text
              style={styles.resendAction}
              onPress={() => {
                void handleResend();
              }}
            >
              Resend code
            </Text>
          ) : null}
        </View>

        <View style={styles.ctaWrap}>
          <PrimaryButton
            label="Verify"
            variant="white"
            loading={verifying}
            onPress={handleVerifyPress}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  back: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 16,
  },
  body: { flex: 1, paddingHorizontal: AppSpacing.lg, paddingTop: AppSpacing.xl },
  title: {
    fontFamily: InterFont.light,
    fontSize: 33,
    lineHeight: 40,
    letterSpacing: -0.825,
    color: AppColors.onSurface,
  },
  subtitle: {
    fontFamily: InterFont.light,
    fontSize: 15,
    lineHeight: 22,
    color: '#8C8C94',
    marginTop: AppSpacing.md,
  },
  change: { fontFamily: InterFont.medium, color: AppColors.primary },
  otpWrap: { marginTop: AppSpacing.xl },
  resend: {
    fontFamily: InterFont.light,
    fontSize: 14,
    color: '#73737A',
    textAlign: 'center',
    marginTop: AppSpacing.lg,
  },
  resendAction: {
    fontFamily: InterFont.medium,
    fontSize: 14,
    color: AppColors.primary,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
  error: {
    fontFamily: InterFont.medium,
    fontSize: 14,
    color: AppColors.error,
    textAlign: 'center',
    marginTop: AppSpacing.lg,
  },
  ctaWrap: { paddingHorizontal: AppSpacing.lg, paddingBottom: AppSpacing.md },
});

export default OtpVerificationScreen;
