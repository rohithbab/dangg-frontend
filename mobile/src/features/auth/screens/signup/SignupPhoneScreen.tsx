import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

import { VerificationStatus } from '@app-types/domain';

import { getFemaleVerificationStatus, sendOtp } from '../../api/authApi';
import { useSignupDraftStore } from '../../store/signupDraftStore';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignupPhone'>;

/**
 * Signup step 1 — phone entry (Neue "What's your number?"). Sends a signup OTP
 * and hands off to the shared OTP screen. Name/age/role are collected later on
 * the Profile screen (Phone → OTP → Profile).
 */
function SignupPhoneScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const setPhone = useSignupDraftStore(s => s.setPhone);
  const [phone, setPhoneInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cleaned = phone.replace(/\D/g, '').slice(-10);
  const canContinue = cleaned.length === 10 && !submitting;

  const handleContinue = useCallback(async (): Promise<void> => {
    if (cleaned.length !== 10) {
      setError('Enter a valid 10-digit number');
      return;
    }
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      // A female whose verification is still under review has nothing to do but
      // wait — tell her here instead of running her through OTP again. (The
      // status RPC is anon-callable by phone.) A failed check is non-fatal:
      // fall through to the normal OTP path so signup never breaks on it.
      try {
        const { status } = await getFemaleVerificationStatus(cleaned);
        if (status === VerificationStatus.Pending) {
          setInfo(
            "Your verification is still under review. We'll notify you once it's approved — no need to sign in.",
          );
          return;
        }
      } catch (e) {
        logger.warn('SignupPhoneScreen.verificationPreCheck failed', e);
      }

      await sendOtp(cleaned, 'signup');
      setPhone(cleaned);
      navigation.navigate('SignupOtp', { phone: cleaned });
    } catch (e) {
      if (e instanceof AppException) {
        setError(e.message);
      } else {
        logger.error('SignupPhoneScreen.sendOtp failed', e);
        setError('Could not send the code, try again');
      }
    } finally {
      setSubmitting(false);
    }
  }, [cleaned, navigation, setPhone]);

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
          <Text style={styles.title}>What's your{'\n'}number?</Text>
          <Text style={styles.subtitle}>We'll text a 6-digit code to verify it's you.</Text>

          <Text style={styles.label}>MOBILE NUMBER</Text>
          <View
            style={[styles.field, focused && styles.fieldFocused, error ? styles.fieldError : null]}
          >
            <Text style={styles.prefix}>+91</Text>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={t => {
                setPhoneInput(t);
                if (error) {
                  setError(null);
                }
                if (info) {
                  setInfo(null);
                }
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="98765 43210"
              placeholderTextColor="#5A5A62"
              keyboardType="phone-pad"
              maxLength={11}
              autoFocus
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!error && info ? <Text style={styles.infoText}>{info}</Text> : null}
        </View>

        <View style={styles.ctaWrap}>
          <PrimaryButton
            label="Continue"
            variant="white"
            loading={submitting}
            disabled={!canContinue}
            onPress={() => {
              void handleContinue();
            }}
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
  label: {
    fontFamily: InterFont.medium,
    fontSize: 11.5,
    letterSpacing: 0.7,
    color: '#6B6B73',
    marginTop: AppSpacing.xl,
    marginBottom: AppSpacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 16,
    backgroundColor: '#0E0E10',
    borderWidth: 1.5,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
  },
  fieldFocused: { borderColor: 'rgba(220,48,143,0.8)' },
  fieldError: { borderColor: AppColors.error },
  prefix: { fontFamily: InterFont.medium, fontSize: 17, color: AppColors.onSurface },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginHorizontal: 14,
  },
  input: {
    flex: 1,
    fontFamily: InterFont.regular,
    fontSize: 17,
    color: AppColors.onSurface,
    padding: 0,
  },
  errorText: {
    fontFamily: InterFont.medium,
    fontSize: 13,
    color: AppColors.error,
    marginTop: AppSpacing.sm,
  },
  infoText: {
    fontFamily: InterFont.medium,
    fontSize: 13,
    lineHeight: 19,
    color: AppColors.primary,
    marginTop: AppSpacing.sm,
  },
  ctaWrap: { paddingHorizontal: AppSpacing.lg, paddingBottom: AppSpacing.md },
});

export default SignupPhoneScreen;
