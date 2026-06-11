import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import PrimaryButton from '@core/components/PrimaryButton';
import TextField from '@core/components/TextField';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { deleteAccount } from '../api/profileApi';

const CONFIRM_PHRASE = 'DELETE';

/**
 * Step 2 of the delete-account flow.
 *
 * Requires the user to type the literal word "DELETE" and re-enter their
 * password. Both must be present and valid before the destructive button
 * unlocks. On success the session is cleared and the RootNavigator swaps
 * back to the Auth stack automatically.
 */
function DeleteAccountConfirmScreen(): React.ReactElement {
  const navigation = useNavigation<{ goBack: () => void }>();
  const [phrase, setPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const phraseOk = phrase === CONFIRM_PHRASE;
  const canSubmit = phraseOk && password.length > 0 && !submitting;

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!canSubmit) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await deleteAccount(password);
      // RootNavigator switches to Auth flow as the session clears.
    } catch (e) {
      if (e instanceof AppException) {
        setError(e.message);
      } else {
        logger.error('DeleteAccountConfirmScreen.deleteAccount failed', e);
        setError('Could not delete account, try again');
      }
      setSubmitting(false);
    }
  }, [canSubmit, password]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Confirm deletion" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.heading}>Last step</Text>
            <Text style={styles.helper}>
              {'Type '}
              <Text style={styles.phraseBold}>{CONFIRM_PHRASE}</Text>
              {' below and re-enter your password to permanently delete your account.'}
            </Text>

            <View style={styles.fieldBlock}>
              <TextField
                label={`Type ${CONFIRM_PHRASE} to confirm`}
                hint={CONFIRM_PHRASE}
                value={phrase}
                onChangeText={text => setPhrase(text.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                errorText={phrase.length > 0 && !phraseOk ? 'Phrase does not match' : undefined}
              />
            </View>

            <View style={styles.fieldBlock}>
              <TextField
                label="Your password"
                hint="Re-enter to confirm"
                value={password}
                onChangeText={setPassword}
                passwordToggle
                autoCapitalize="none"
                autoCorrect={false}
                errorText={error ?? undefined}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="Permanently delete account"
            variant="danger"
            onPress={() => {
              void handleDelete();
            }}
            disabled={!canSubmit}
            loading={submitting}
          />
          <Text
            accessibilityRole="link"
            onPress={() => navigation.goBack()}
            style={styles.backLink}
          >
            Go back
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  scroll: {
    padding: AppSpacing.lg,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.lg,
    borderWidth: 1,
    borderColor: AppColors.errorLight,
  },
  heading: {
    ...AppTypography.titleLarge,
    color: AppColors.error,
  },
  helper: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
    marginTop: AppSpacing.sm,
  },
  phraseBold: { fontWeight: '700', color: AppColors.primaryDark },
  fieldBlock: { marginTop: AppSpacing.md },
  footer: {
    padding: AppSpacing.md,
    gap: AppSpacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
    alignItems: 'center',
  },
  backLink: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
    paddingVertical: AppSpacing.sm,
  },
});

export default DeleteAccountConfirmScreen;
