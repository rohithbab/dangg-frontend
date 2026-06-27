import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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

import { updatePayoutDetails } from '../api/earningsApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'AddBank'>;

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** F4 · Add bank account — capture + save bank details as the payout method. */
function AddBankScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [holder, setHolder] = useState('');
  const [account, setAccount] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const accountsMatch = account.length >= 6 && account === confirm;
  const ifscOk = IFSC_RE.test(ifsc.trim().toUpperCase());
  const valid = holder.trim().length > 1 && accountsMatch && ifscOk;

  const handleSave = useCallback(async (): Promise<void> => {
    if (!accountsMatch) {
      setError('Account numbers do not match');
      return;
    }
    if (!ifscOk) {
      setError('Enter a valid IFSC code');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updatePayoutDetails({
        kind: 'bank',
        holderName: holder.trim(),
        accountNumber: account.trim(),
        ifsc: ifsc.trim().toUpperCase(),
      });
      navigation.replace('PayoutMethodAdded');
    } catch (e) {
      setSaving(false);
      setError(e instanceof AppException ? e.message : 'Could not save, try again');
      if (!(e instanceof AppException)) {
        logger.error('AddBankScreen.save failed', e);
      }
    }
  }, [account, accountsMatch, holder, ifsc, ifscOk, navigation]);

  const field = (
    key: string,
    label: string,
    value: string,
    onChange: (t: string) => void,
    opts?: { placeholder?: string; keyboardType?: 'number-pad' | 'default'; autoCaps?: boolean },
  ): React.ReactElement => (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focusedKey === key && styles.fieldFocused]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={t => {
            onChange(t);
            if (error) {
              setError(null);
            }
          }}
          onFocus={() => setFocusedKey(key)}
          onBlur={() => setFocusedKey(null)}
          placeholder={opts?.placeholder}
          placeholderTextColor={AppColors.onSurfaceDisabled}
          keyboardType={opts?.keyboardType ?? 'default'}
          autoCapitalize={opts?.autoCaps ? 'characters' : 'words'}
          autoCorrect={false}
        />
      </View>
    </View>
  );

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

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Add bank account</Text>
          {field('holder', 'ACCOUNT HOLDER NAME', holder, setHolder, {
            placeholder: 'Aisha Verma',
          })}
          {field(
            'acct',
            'ACCOUNT NUMBER',
            account,
            t => setAccount(t.replace(/\D/g, '').slice(0, 18)),
            {
              keyboardType: 'number-pad',
            },
          )}
          {field('confirm', 'CONFIRM ACCOUNT NUMBER', confirm, t =>
            setConfirm(t.replace(/\D/g, '').slice(0, 18)),
          )}
          {field('ifsc', 'IFSC CODE', ifsc, t => setIfsc(t.toUpperCase().slice(0, 11)), {
            placeholder: 'HDFC0001234',
            autoCaps: true,
          })}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.ctaWrap}>
          <PrimaryButton
            label="Save account"
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
  scroll: { paddingHorizontal: AppSpacing.lg, paddingBottom: AppSpacing.lg },
  title: {
    fontFamily: InterFont.regular,
    fontSize: 28,
    letterSpacing: -0.6,
    color: AppColors.onSurface,
    marginBottom: AppSpacing.lg,
  },
  fieldWrap: { marginBottom: AppSpacing.md },
  label: {
    fontFamily: InterFont.medium,
    fontSize: 11.5,
    letterSpacing: 0.7,
    color: '#6B6B73',
    marginBottom: AppSpacing.sm,
  },
  field: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0E0E10',
    borderWidth: 1.5,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  fieldFocused: { borderColor: 'rgba(220,48,143,0.8)' },
  input: { fontFamily: InterFont.regular, fontSize: 16, color: AppColors.onSurface, padding: 0 },
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

export default AddBankScreen;
