import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import ConfirmationDialog from '@core/components/ConfirmationDialog';
import PrimaryButton from '@core/components/PrimaryButton';
import { AppPermissionStatus, permissionService } from '@core/services/permissionService';
import { logger } from '@core/utils/logger';

import { type AuthStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'FemaleSignupVerificationInfo'>;

const CHECKLIST: ReadonlyArray<string> = [
  'Good lighting',
  'Face clearly visible',
  'No filters, sunglasses, or accessories',
];

/**
 * Pre-camera explainer screen. Tapping "Open Camera" requests camera
 * permission; on grant we push to face capture; on permanent denial we
 * surface a dialog that links to system settings.
 */
function VerificationInfoScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [permissionError, setPermissionError] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);

  const handleOpenCamera = useCallback(async (): Promise<void> => {
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Verify You're You" />
      <View style={styles.body}>
        <View style={styles.illustration}>
          <Text style={styles.illustrationGlyph}>{'👤'}</Text>
        </View>
        <Text style={styles.headline}>One quick photo</Text>
        <Text style={styles.bodyText}>
          We verify your gender with a clear photo of your face. Our team will review it within 2
          days.
        </Text>
        <View style={styles.checklist}>
          {CHECKLIST.map(item => (
            <View key={item} style={styles.checkRow}>
              <Text style={styles.checkGlyph}>{'✓'}</Text>
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          label={permissionError ? 'Allow Camera Access' : 'Open Camera'}
          onPress={handleOpenCamera}
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
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  illustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationGlyph: { fontSize: 64, lineHeight: 72 },
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
    marginTop: AppSpacing.sm,
    maxWidth: 320,
  },
  checklist: {
    marginTop: AppSpacing.xl,
    maxWidth: 280,
    width: '100%',
    gap: AppSpacing.sm,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  checkGlyph: {
    ...AppTypography.titleMedium,
    color: AppColors.success,
  },
  checkText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
  },
  footer: {
    padding: AppSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
    backgroundColor: AppColors.background,
  },
});

export default VerificationInfoScreen;
