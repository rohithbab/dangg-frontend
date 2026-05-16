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
import TextButton from '@core/components/TextButton';
import TextField from '@core/components/TextField';
import { Env } from '@core/config/env';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type AuthStackParamList } from '@navigation/types';

import { UserRole } from '@app-types/domain';

import { signInWithPassword, signInWithPasswordDev } from '../../api/authApi';
import { passwordOnlySchema, type PasswordOnlyInput } from '../../schemas/signupSchema';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'FemaleLoginPassword'>;
type Route = RouteProp<AuthStackParamList, 'FemaleLoginPassword'>;

function maskPhone(phone: string): string {
  const tail = phone.slice(-3);
  return `+91 ••••• ••${tail}`;
}

/**
 * Step 2 of female login — password entry. Phone is carried in via route
 * params; on success RootNavigator switches to FemaleTabs as soon as the
 * session lands in the store.
 */
function FemaleLoginPasswordScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { phone } = route.params;
  const [inlineError, setInlineError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<PasswordOnlyInput>({
    resolver: zodResolver(passwordOnlySchema),
    mode: 'onChange',
    defaultValues: { password: '' },
  });

  const onSubmit = useCallback(
    async (data: PasswordOnlyInput): Promise<void> => {
      setInlineError(null);
      try {
        if (Env.devMode) {
          await signInWithPasswordDev(phone, data.password, UserRole.Female);
        } else {
          await signInWithPassword(phone, data.password);
        }
      } catch (e) {
        if (e instanceof AppException) {
          setInlineError(e.message);
        } else {
          logger.error('FemaleLoginPasswordScreen.signIn failed', e);
          setInlineError('Could not sign in, try again');
        }
      }
    },
    [phone],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Welcome back" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.maskedPhone}>{maskPhone(phone)}</Text>
          <Card padding={AppSpacing.lg} containerStyle={styles.card}>
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  scroll: { padding: AppSpacing.md, paddingTop: AppSpacing.lg },
  maskedPhone: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginBottom: AppSpacing.md,
  },
  card: { gap: AppSpacing.sm },
  forgotRow: { alignItems: 'flex-end' },
  footer: {
    padding: AppSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
    backgroundColor: AppColors.background,
  },
});

export default FemaleLoginPasswordScreen;
