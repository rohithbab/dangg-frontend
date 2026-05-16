import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';

import { type AuthStackParamList } from '@navigation/types';

import { markOnboardingSeen } from '../../api/authApi';
import { useSignupDraftStore } from '../../store/signupDraftStore';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'FemaleSignupVerificationSubmitted'>;

/**
 * Terminal screen for the female signup flow. The user can't back-swipe
 * out (Android hardware back is also intercepted) — the only exit is the
 * "Got it" button, which resets the navigator to the female login phone
 * entry. The draft is cleared so a fresh signup starts clean if she ever
 * needs to redo it.
 */
function VerificationSubmittedScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const clearDraft = useSignupDraftStore(s => s.clear);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const handleContinue = useCallback((): void => {
    clearDraft();
    markOnboardingSeen();
    navigation.reset({ index: 0, routes: [{ name: 'FemaleLoginPhone' }] });
  }, [clearDraft, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>{'✓'}</Text>
        </View>
        <Text style={styles.headline}>Verification submitted</Text>
        <Text style={styles.bodyText}>
          Our team will review your photo within 2 days. We'll notify you once approved.
        </Text>
        <Text style={styles.subBody}>Until then, you can log in to check status.</Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Got it" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.gradientRoseSubtleStart },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 72,
    lineHeight: 80,
    color: AppColors.success,
    fontWeight: '700',
  },
  headline: {
    ...AppTypography.headlineLarge,
    color: AppColors.primaryDark,
    textAlign: 'center',
    marginTop: AppSpacing.lg,
  },
  bodyText: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.md,
    maxWidth: 320,
  },
  subBody: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
  footer: {
    padding: AppSpacing.md,
  },
});

export default VerificationSubmittedScreen;
