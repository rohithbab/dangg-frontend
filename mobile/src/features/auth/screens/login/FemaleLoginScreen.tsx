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
import { z } from 'zod';

import { AppColors } from '@theme/colors';
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
import { ZodSchemas } from '@core/utils/validators';

import { type AuthStackParamList } from '@navigation/types';

import { UserRole } from '@app-types/domain';

import { signInWithPassword, signInWithPasswordDev } from '../../api/authApi';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'FemaleLogin'>;

const femaleLoginSchema = z.object({
  phone: ZodSchemas.phoneIndian,
  password: z.string().min(1, 'Enter your password'),
});
type FemaleLoginInput = z.infer<typeof femaleLoginSchema>;

/**
 * Female login — single screen with both phone and password,
 * matching the male login flow but adding the verification check on submit.
 */
function FemaleLoginScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [inlineError, setInlineError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<FemaleLoginInput>({
    resolver: zodResolver(femaleLoginSchema),
    mode: 'onChange',
    defaultValues: { phone: '', password: '' },
  });

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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Welcome back" subtitle="Female" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card padding={AppSpacing.lg} containerStyle={styles.card}>
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
          <PrimaryButton
            label="Login"
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
});

export default FemaleLoginScreen;
