import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { XCircle } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { moderateScale, scaleFont } from '@theme/responsive';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import { logger } from '@core/utils/logger';

import { type AuthStackParamList } from '@navigation/types';

import { signOut } from '@features/profile/api/profileApi';

import { getMyVerificationRejectionReason } from '../../api/authApi';
import { useSignupDraftStore } from '../../store/signupDraftStore';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'FemaleSignupVerificationRejected'>;

/**
 * Verification rejected — the explicit terminal state for
 * `verification_status = 'rejected'`. Previously `rejected` was grouped with
 * `none` in the router and silently reused the "Get verified" (Take Photo) info
 * screen, so a rejected female never learned she'd been rejected. This screen
 * states it plainly, shows the admin's reason when available, and offers a
 * "Try again" CTA that re-enters the verification flow (which resubmits and
 * moves her back to `pending`). Back is blocked (terminal); "Log out" is the
 * explicit exit — mirroring the pending screen.
 */
function VerificationRejectedScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const clearDraft = useSignupDraftStore(s => s.clear);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let active = true;
    void getMyVerificationRejectionReason()
      .then(r => {
        if (active) {
          setReason(r);
        }
      })
      .catch(e => logger.warn('VerificationRejectedScreen.reason failed', e));
    return () => {
      active = false;
    };
  }, []);

  const handleTryAgain = useCallback((): void => {
    // Re-enter the verification flow from its info step, which explains the
    // requirements and leads into the selfie capture → resubmit (→ pending).
    navigation.navigate('FemaleSignupVerificationInfo');
  }, [navigation]);

  const handleLogout = useCallback((): void => {
    clearDraft();
    void signOut().catch(() => undefined);
    navigation.reset({ index: 0, routes: [{ name: 'AccountType' }] });
  }, [clearDraft, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.circle}>
          <XCircle size={40} color={AppColors.error} strokeWidth={2} />
        </View>

        <Text style={styles.title}>Verification not approved</Text>
        <Text style={styles.subtitle}>
          Your verification wasn&apos;t approved. Please review and try again.
        </Text>

        {reason ? (
          <View style={styles.reasonCard}>
            <Text style={styles.reasonLabel}>Reason</Text>
            <Text style={styles.reasonText}>{reason}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Try again" onPress={handleTryAgain} />
        <Pressable accessibilityRole="button" onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,69,58,0.12)',
  },
  title: {
    fontFamily: InterFont.semibold,
    fontSize: scaleFont(23),
    color: AppColors.onSurface,
    marginTop: AppSpacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: InterFont.regular,
    fontSize: scaleFont(14.5),
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
    textAlign: 'center',
  },
  reasonCard: {
    alignSelf: 'stretch',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(14),
    marginTop: AppSpacing.xl,
  },
  reasonLabel: {
    fontFamily: InterFont.medium,
    fontSize: scaleFont(11.5),
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: AppColors.onSurfaceMuted,
  },
  reasonText: {
    fontFamily: InterFont.regular,
    fontSize: scaleFont(14.5),
    color: AppColors.onSurface,
    marginTop: moderateScale(6),
    lineHeight: scaleFont(20),
  },
  footer: { paddingHorizontal: AppSpacing.lg, paddingBottom: AppSpacing.md },
  logoutBtn: { alignItems: 'center', paddingVertical: moderateScale(14) },
  logoutText: { fontFamily: InterFont.medium, fontSize: scaleFont(15), color: AppColors.onSurfaceMuted },
});

export default VerificationRejectedScreen;
