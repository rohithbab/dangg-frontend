import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, Line, Path, Rect, Stop, LinearGradient } from 'react-native-svg';
import { z } from 'zod';

import { USE_MOCK_DATA } from '@core/config/env';
import { AppException } from '@core/network/apiException';
import { getSupabaseClient } from '@core/network/supabaseClient';
import { logger } from '@core/utils/logger';
import { ZodSchemas } from '@core/utils/validators';

import { type AuthStackParamList } from '@navigation/types';

import { parseUserRole, UserRole } from '@app-types/domain';

import { signInWithPassword, signInWithPasswordDev } from '../../api/authApi';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'CommonLogin'>;

const loginSchema = z.object({
  phone: ZodSchemas.phoneIndian,
  password: z.string().min(1, 'Enter your password'),
});
type LoginInput = z.infer<typeof loginSchema>;

// ─── Premium Color Tokens ─────────────────────────────────────────────────────

const $ = {
  bg: '#09090B',
  surface: '#121217',
  card: '#18181F',
  primary: '#FF4FA3',
  secondary: '#9D5CFF',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  border: 'rgba(255,255,255,0.05)',
  inputBg: 'rgba(255,255,255,0.03)',
  borderActive: 'rgba(255,255,255,0.12)',
};

// ─── Eye Icons ────────────────────────────────────────────────────────────────

function EyeOpenIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
        fill={$.textSecondary}
      />
    </Svg>
  );
}

function EyeClosedIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
        fill={$.textSecondary}
      />
    </Svg>
  );
}

// ─── Glass Input ──────────────────────────────────────────────────────────────

type GlassInputProps = {
  label: string;
  hint: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
  maxLength?: number;
  errorText?: string;
  secureTextEntry?: boolean;
  leftIcon?: React.ReactNode;
  passwordToggle?: boolean;
  testID?: string;
};

function GlassInput({
  label,
  hint,
  value,
  onChangeText,
  onBlur,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  maxLength,
  errorText,
  secureTextEntry,
  leftIcon,
  passwordToggle,
  testID,
}: GlassInputProps): React.ReactElement {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(!!secureTextEntry || !!passwordToggle);
  const isError = !!errorText;

  return (
    <View style={styles.inputOuter} testID={testID}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          isError && styles.inputError,
        ]}
      >
        {leftIcon ? <View style={styles.inputLeftSlot}>{leftIcon}</View> : null}
        <TextInput
          style={styles.inputField}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          placeholder={hint}
          placeholderTextColor="rgba(255,255,255,0.2)"
          secureTextEntry={secure}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
        {passwordToggle ? (
          <Pressable
            onPress={() => setSecure(prev => !prev)}
            hitSlop={8}
            style={styles.inputRightSlot}
            accessibilityRole="button"
            accessibilityLabel={secure ? 'Show password' : 'Hide password'}
          >
            {secure ? <EyeClosedIcon /> : <EyeOpenIcon />}
          </Pressable>
        ) : null}
      </View>
      {isError ? <Text style={styles.inputErrorText}>{errorText}</Text> : null}
    </View>
  );
}

// ─── Gradient CTA ─────────────────────────────────────────────────────────────

function GradientCTA({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}): React.ReactElement {
  const gradId = React.useId();
  const scale = useSharedValue(1);
  const isBlocked = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={isBlocked ? undefined : onPress}
      disabled={isBlocked}
      onPressIn={() => {
        if (!isBlocked) scale.value = withSpring(0.98, { damping: 18, stiffness: 260 });
      }}
      onPressOut={() => {
        if (!isBlocked) scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      }}
    >
      <Animated.View style={[styles.cta, animatedStyle, isBlocked && styles.ctaBlocked]}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FF4FA3" />
              <Stop offset="1" stopColor="#E84393" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" rx={20} fill={`url(#${gradId})`} />
        </Svg>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <View style={styles.ctaLabelWrap}>
            <Text style={styles.ctaText}>{label}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Decorative Login Icon ────────────────────────────────────────────────────

function LoginBadge(): React.ReactElement {
  return (
    <View style={styles.badge}>
      <Svg width={32} height={32} viewBox="0 0 48 48">
        <G>
          <Circle cx={24} cy={16} r={6} stroke="#FF4FA3" strokeWidth={2.5} fill="none" />
          <Path
            d="M 12 38 C 12 28 18 22 24 22 C 30 22 36 28 36 38"
            stroke="#FF4FA3"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
          />
          <Line
            x1={38}
            y1={14}
            x2={38}
            y2={6}
            stroke="#9D5CFF"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <Line
            x1={34}
            y1={10}
            x2={42}
            y2={10}
            stroke="#9D5CFF"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </G>
      </Svg>
    </View>
  );
}

// ─── Premium Back Button ──────────────────────────────────────────────────────

function BackChevron(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill={$.text} />
    </Svg>
  );
}

// ─── DEV_MODE: resolve role from DB ──────────────────────────────────────────

async function resolveUserRole(phone: string): Promise<UserRole> {
  const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
  try {
    const { data, error } = await getSupabaseClient()
      .from('users')
      .select('role')
      .eq('phone', `+91${cleanedPhone}`)
      .maybeSingle();
    if (error) {
      logger.warn('resolveUserRole query failed', error);
    }
    if (data?.role) {
      const role = parseUserRole(data.role);
      if (role) return role;
    }
  } catch (e) {
    logger.warn('resolveUserRole exception', e);
  }
  throw new AppException('NOT_FOUND', 'Account not found. Please sign up first.');
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function CommonLoginScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [inlineError, setInlineError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { phone: '', password: '' },
  });

  // ── Entrance animation ──────────────────────────────────────────────────────
  const fadeOpacity = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));
  React.useEffect(() => {
    fadeOpacity.value = withTiming(1, { duration: 600 });
  }, [fadeOpacity]);

  const onSubmit = useCallback(async (data: LoginInput): Promise<void> => {
    setInlineError(null);
    const cleanedPhone = data.phone.replace(/\D/g, '').slice(-10);
    try {
      if (USE_MOCK_DATA) {
        const role = await resolveUserRole(cleanedPhone);
        await signInWithPasswordDev(cleanedPhone, data.password, role);
      } else {
        await signInWithPassword(cleanedPhone, data.password);
      }
    } catch (e) {
      if (e instanceof AppException) {
        setInlineError(e.message);
      } else {
        logger.error('CommonLoginScreen.onSubmit failed', e);
        setInlineError('Could not sign in, try again');
      }
    }
  }, []);

  const handleForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPasswordPhone', { role: UserRole.Male });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Animated.View style={[styles.flex, fadeStyle]}>
        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : navigation.navigate('AccountType')
            }
            hitSlop={12}
            style={styles.backGlass}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackChevron />
          </Pressable>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            alwaysBounceVertical={false}
            showsVerticalScrollIndicator={false}
          >
            <LoginBadge />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <GlassInput
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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <GlassInput
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

            {/* Forgot Password */}
            <View style={styles.forgotRow}>
              <Pressable onPress={handleForgotPassword} hitSlop={8} style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>

            {/* Submit error */}
            {inlineError && !control._formState?.errors?.password ? (
              <Text style={styles.submitError}>{inlineError}</Text>
            ) : null}

            {/* CTA */}
            <GradientCTA
              label="Login"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={!isValid}
            />

            {/* Sign up link */}
            <View style={styles.signupRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Pressable onPress={() => navigation.navigate('AccountType')} hitSlop={8}>
                <Text style={styles.footerLink}>Sign up</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: $.bg,
  },
  flex: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    height: 56,
    justifyContent: 'center',
  },
  backGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Title block ─────────────────────────────────────────────────────────────
  titleBlock: {
    alignItems: 'center',
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: $.text,
    letterSpacing: 0.3,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: $.textSecondary,
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // ── Scroll content ──────────────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // ── Badge ───────────────────────────────────────────────────────────────────
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  // ── Input ──────────────────────────────────────────────────────────────────
  inputOuter: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: $.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: $.inputBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: $.border,
    paddingHorizontal: 18,
    height: 58,
    width: '100%',
  },
  inputFocused: {
    borderColor: $.borderActive,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  inputError: {
    borderColor: 'rgba(239,68,68,0.4)',
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: $.text,
    paddingVertical: 0,
  },
  inputLeftSlot: {
    marginRight: 12,
    flexShrink: 0,
  },
  inputRightSlot: {
    width: 28,
    height: 28,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inputErrorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },

  // ── Forgot Password ─────────────────────────────────────────────────────────
  forgotRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: -8,
    marginBottom: 8,
  },
  forgotButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4FA3',
    letterSpacing: 0.2,
  },

  // ── Prefix ──────────────────────────────────────────────────────────────────
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    color: $.textSecondary,
  },

  // ── Error ───────────────────────────────────────────────────────────────────
  submitError: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
    width: '100%',
  },

  // ── CTA ─────────────────────────────────────────────────────────────────────
  cta: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#E84393',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaBlocked: {
    opacity: 0.4,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.6,
    includeFontPadding: false,
  },
  ctaLabelWrap: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: $.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF4FA3',
  },
});

export default CommonLoginScreen;
