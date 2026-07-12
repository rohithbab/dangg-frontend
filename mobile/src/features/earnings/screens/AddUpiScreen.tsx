import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
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

import { type FemaleAppStackParamList } from '@navigation/types';

import { getPayoutDetails, updatePayoutDetails } from '../api/earningsApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'AddUpi'>;

const UPI_RE = /^[\w.-]{2,}@[a-zA-Z]{2,}$/;

/** F3 · Add UPI — capture + save a UPI handle as the payout method. */
function AddUpiScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [upiId, setUpiId] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getPayoutDetails()
      .then(d => {
        if (d?.kind === 'upi') {
          setUpiId(d.upiId);
        }
      })
      .catch(e => logger.warn('AddUpiScreen.prefill failed', e));
  }, []);

  const valid = UPI_RE.test(upiId.trim());

  const handleSave = useCallback(async (): Promise<void> => {
    if (!valid) {
      setError('Enter a valid UPI ID (e.g. name@bank)');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updatePayoutDetails({ kind: 'upi', upiId: upiId.trim() });
      navigation.replace('PayoutMethodAdded');
    } catch (e) {
      setSaving(false);
      setError(e instanceof AppException ? e.message : 'Could not save, try again');
      if (!(e instanceof AppException)) {
        logger.error('AddUpiScreen.save failed', e);
      }
    }
  }, [navigation, upiId, valid]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <ChevronLeft size={24} color={AppColors.onSurface} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Add UPI</Text>

          <Text style={styles.label}>UPI ID</Text>
          <View
            style={[styles.field, focused && styles.fieldFocused, error ? styles.fieldError : null]}
          >
            <TextInput
              style={styles.input}
              value={upiId}
              onChangeText={t => {
                setUpiId(t.trim());
                if (error) {
                  setError(null);
                }
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="name@bank"
              placeholderTextColor={AppColors.onSurfaceDisabled}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.hint}>Double-check your UPI ID before saving.</Text>
          )}
        </View>

        <View style={styles.ctaWrap}>
          <PrimaryButton
            label="Verify & save"
            loading={saving}
            disabled={!valid}
            onPress={() => {
              void handleSave();
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
  header: { height: 48, justifyContent: 'center', paddingHorizontal: AppSpacing.md },
  back: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: AppSpacing.lg },
  title: {
    fontFamily: InterFont.regular,
    fontSize: 28,
    letterSpacing: -0.6,
    color: AppColors.onSurface,
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
    height: 56,
    borderRadius: 16,
    backgroundColor: '#0E0E10',
    borderWidth: 1.5,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  fieldFocused: { borderColor: 'rgba(220,48,143,0.8)' },
  fieldError: { borderColor: AppColors.error },
  input: { fontFamily: InterFont.regular, fontSize: 16, color: AppColors.onSurface, padding: 0 },
  hint: {
    fontFamily: InterFont.regular,
    fontSize: 13,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
  },
  errorText: {
    fontFamily: InterFont.medium,
    fontSize: 13,
    color: AppColors.error,
    marginTop: AppSpacing.sm,
  },
  ctaWrap: {
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.md,
    paddingTop: AppSpacing.sm,
  },
});

export default AddUpiScreen;
