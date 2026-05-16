import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';

export type VerificationPendingModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

/**
 * Modal shown when a female tries to log in while her photo is still under
 * review. Cannot be dismissed by tapping outside or pressing hardware back —
 * the only exit is the OK button. The caller stays on whichever screen
 * triggered the modal (typically the phone-entry screen, not logged in).
 */
function VerificationPendingModal({
  visible,
  onDismiss,
}: VerificationPendingModalProps): React.ReactElement {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View style={styles.scrim}>
        <View style={[styles.card, AppShadows.e3]}>
          <View style={styles.accentStrip} />
          <View style={styles.body}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconGlyph}>{'⏰'}</Text>
            </View>
            <Text style={styles.title}>Verification in progress</Text>
            <Text style={styles.subtitle}>
              Our team is still reviewing your photo. Please check back in a few hours.
            </Text>
            <View style={styles.button}>
              <PrimaryButton label="OK" onPress={onDismiss} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: AppColors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: AppRadii.lg,
    backgroundColor: AppColors.surface,
    overflow: 'hidden',
  },
  accentStrip: { height: 4, backgroundColor: AppColors.primary },
  body: { padding: AppSpacing.lg, alignItems: 'center' },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppSpacing.md,
  },
  iconGlyph: { fontSize: 32, lineHeight: 36 },
  title: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
    textAlign: 'center',
  },
  subtitle: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.sm,
  },
  button: { marginTop: AppSpacing.lg, alignSelf: 'stretch' },
});

export default VerificationPendingModal;
