import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';

export type SessionExpiredModalProps = {
  visible: boolean;
  onLoginAgain: () => void;
};

/**
 * Shown when any API call returns 401 / a session-refresh fails. Single
 * action: log in again. Barrier dismissal is disabled.
 */
function SessionExpiredModal({
  visible,
  onLoginAgain,
}: SessionExpiredModalProps): React.ReactElement {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Text style={styles.title}>Session expired</Text>
          <Text style={styles.body}>
            Your session has ended for security reasons. Please log in again.
          </Text>
          <View style={styles.action}>
            <PrimaryButton label="Log in again" onPress={onLoginAgain} />
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
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.lg,
    width: '100%',
    maxWidth: 360,
  },
  title: { ...AppTypography.titleLarge, marginBottom: AppSpacing.sm },
  body: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
    marginBottom: AppSpacing.lg,
  },
  action: { marginTop: AppSpacing.sm },
});

export default SessionExpiredModal;
