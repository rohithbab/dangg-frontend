import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

export type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
};

/**
 * Full-screen blocking spinner. Backdrop tap is disabled — callers dismiss
 * programmatically by flipping `visible`.
 */
function LoadingOverlay({ visible, message }: LoadingOverlayProps): React.ReactElement {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={() => undefined}
    >
      <View style={styles.scrim}>
        <View style={styles.card}>
          <ActivityIndicator color={AppColors.primary} />
          {message ? <Text style={styles.message}>{message}</Text> : null}
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
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.lg,
    alignItems: 'center',
    minWidth: 140,
  },
  message: {
    ...AppTypography.bodyMedium,
    marginTop: AppSpacing.md,
    textAlign: 'center',
  },
});

export default LoadingOverlay;
