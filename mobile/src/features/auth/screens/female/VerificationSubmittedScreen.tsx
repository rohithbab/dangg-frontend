import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Clock } from 'lucide-react-native';
import React, { useCallback, useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
import { logger } from '@core/utils/logger';

import { type AuthStackParamList } from '@navigation/types';

import { useSessionStore } from '@store/sessionStore';

import { signOut } from '@features/profile/api/profileApi';

import { getFemaleVerificationStatus, markOnboardingSeen } from '../../api/authApi';
import { useSignupDraftStore } from '../../store/signupDraftStore';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'FemaleSignupVerificationSubmitted'>;

/**
 * C19 · Verification submitted (Neue) — the pending-review home. She STAYS
 * signed in; the `females` realtime subscription promotes her into the app on
 * approval. "Got it" re-checks status (in case approval already landed);
 * "Log out" is the explicit exit. Back is blocked (terminal screen).
 */
function VerificationSubmittedScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const clearDraft = useSignupDraftStore(s => s.clear);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    clearDraft();
    markOnboardingSeen();
  }, [clearDraft]);

  const handleGotIt = useCallback(async (): Promise<void> => {
    const phone = useSessionStore.getState().session?.user?.phone;
    if (!phone) {
      return;
    }
    try {
      // Pull the latest status — if she was just approved, RootNavigator swaps
      // to the female app automatically once we set it.
      const { status } = await getFemaleVerificationStatus(phone);
      useSessionStore.getState().setVerificationStatus(status);
    } catch (e) {
      logger.warn('VerificationSubmittedScreen.refresh failed', e);
    }
  }, []);

  const handleLogout = useCallback((): void => {
    void signOut().catch(() => undefined);
    navigation.reset({ index: 0, routes: [{ name: 'AccountType' }] });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.circle}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="pendingCircle" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={AppColors.primaryLight} />
                <Stop offset="1" stopColor={AppColors.primaryDark} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={48} fill="url(#pendingCircle)" />
          </Svg>
          <Clock size={36} color="#FFFFFF" strokeWidth={2} />
        </View>

        <Text style={styles.title}>Verification submitted</Text>
        <Text style={styles.body2}>We'll review your photo within 2 days.</Text>

        <View style={styles.pill}>
          <View style={styles.pillDot} />
          <Text style={styles.pillText}>Pending review</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Got it"
          variant="white"
          onPress={() => {
            void handleGotIt();
          }}
        />
        <Pressable accessibilityRole="button" onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const COIN_GOLD = AppColors.coinGold;

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
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: InterFont.semibold,
    fontSize: 23,
    color: AppColors.onSurface,
    marginTop: AppSpacing.lg,
    textAlign: 'center',
  },
  body2: {
    fontFamily: InterFont.regular,
    fontSize: 14.5,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
    textAlign: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(245,181,61,0.14)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: AppSpacing.lg,
  },
  pillDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COIN_GOLD },
  pillText: { fontFamily: InterFont.medium, fontSize: 13, color: COIN_GOLD },
  footer: { paddingHorizontal: AppSpacing.lg, paddingBottom: AppSpacing.md },
  logoutBtn: { alignItems: 'center', paddingVertical: 14 },
  logoutText: { fontFamily: InterFont.medium, fontSize: 15, color: AppColors.onSurfaceMuted },
});

export default VerificationSubmittedScreen;
