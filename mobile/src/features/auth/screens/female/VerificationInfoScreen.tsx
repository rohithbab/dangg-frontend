import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Lock, ShieldCheck } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import ConfirmationDialog from '@core/components/ConfirmationDialog';
import PrimaryButton from '@core/components/PrimaryButton';
import { AppPermissionStatus, permissionService } from '@core/services/permissionService';
import { logger } from '@core/utils/logger';

import { type AuthStackParamList } from '@navigation/types';

import { signOut } from '@features/profile/api/profileApi';

import { useSignupDraftStore } from '../../store/signupDraftStore';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'FemaleSignupVerificationInfo'>;

const STEPS: ReadonlyArray<{ n: string; label: string; tint: string }> = [
  { n: '1', label: 'Take a quick selfie', tint: AppColors.featureGreen },
  { n: '2', label: 'We review it within 2 days', tint: AppColors.featureMauve },
  { n: '3', label: 'Start earning once approved', tint: AppColors.featureBlue },
];

/**
 * C16 · Get verified (Neue). Gradient "verify to start earning" hero, the
 * three-step explainer, an encrypted-data note, and a "Start verification"
 * CTA that requests camera permission and pushes to the selfie capture.
 */
function VerificationInfoScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [permissionError, setPermissionError] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const clearDraft = useSignupDraftStore(s => s.clear);

  const handleStart = useCallback(async (): Promise<void> => {
    try {
      const status = await permissionService.requestCamera();
      if (status === AppPermissionStatus.Granted) {
        navigation.navigate('FemaleSignupFaceCapture');
        return;
      }
      if (status === AppPermissionStatus.PermanentlyDenied) {
        setSettingsDialog(true);
        return;
      }
      setPermissionError(true);
    } catch (e) {
      logger.error('VerificationInfoScreen.requestCamera failed', e);
      setPermissionError(true);
    }
  }, [navigation]);

  const handleExit = useCallback(async (): Promise<void> => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    try {
      clearDraft();
      await signOut();
      navigation.reset({ index: 0, routes: [{ name: 'AccountType' }] });
    } catch (e) {
      logger.error('VerificationInfoScreen.exit failed', e);
    }
  }, [clearDraft, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => {
            void handleExit();
          }}
          style={styles.back}
        >
          <ChevronLeft size={24} color={AppColors.onSurface} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Get verified</Text>

        <View style={styles.hero}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="verifyHero" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={AppColors.featureGreen} stopOpacity={0.55} />
                <Stop offset="1" stopColor={AppColors.featureMauve} stopOpacity={0.55} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={AppRadii.card} fill="url(#verifyHero)" />
          </Svg>
          <View style={styles.heroIcon}>
            <ShieldCheck size={20} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={styles.heroText}>Verify to start earning</Text>
        </View>

        <View style={styles.steps}>
          {STEPS.map(s => (
            <View key={s.n} style={styles.stepRow}>
              <View
                style={[styles.stepBadge, { backgroundColor: `${s.tint}26`, borderColor: s.tint }]}
              >
                <Text style={[styles.stepNum, { color: s.tint }]}>{s.n}</Text>
              </View>
              <Text style={styles.stepLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.secureRow}>
          <Lock size={13} color={AppColors.onSurfaceMuted} strokeWidth={2} />
          <Text style={styles.secureText}>Your photo is private and encrypted.</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={permissionError ? 'Allow Camera Access' : 'Start verification'}
          onPress={() => {
            void handleStart();
          }}
        />
      </View>

      <ConfirmationDialog
        visible={settingsDialog}
        title="Camera permission required"
        body="We need camera access to verify your identity. Please enable it in your phone's settings."
        confirmLabel="Open Settings"
        cancelLabel="Not now"
        onCancel={() => setSettingsDialog(false)}
        onConfirm={() => {
          setSettingsDialog(false);
          void permissionService.openAppSettings();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: { height: 48, justifyContent: 'center', paddingHorizontal: AppSpacing.md },
  back: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: AppSpacing.lg },
  title: {
    fontFamily: InterFont.regular,
    fontSize: 28,
    letterSpacing: -0.6,
    color: AppColors.onSurface,
  },
  hero: {
    height: 112,
    borderRadius: AppRadii.card,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 18,
    marginTop: AppSpacing.lg,
  },
  heroIcon: {
    position: 'absolute',
    top: 16,
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { fontFamily: InterFont.semibold, fontSize: 18, color: '#FFFFFF' },
  steps: { gap: 12, marginTop: AppSpacing.lg },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepNum: { fontFamily: InterFont.semibold, fontSize: 14 },
  stepLabel: { flex: 1, fontFamily: InterFont.regular, fontSize: 15, color: AppColors.onSurface },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: AppSpacing.lg,
  },
  secureText: { fontFamily: InterFont.regular, fontSize: 12.5, color: AppColors.onSurfaceMuted },
  footer: {
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.md,
    paddingTop: AppSpacing.sm,
  },
});

export default VerificationInfoScreen;
