import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

export type ConfirmationDialogProps = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm action in red. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Centred modal — title + body + Cancel + Confirm. */
function ConfirmationDialog({
  visible,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps): React.ReactElement {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <View style={styles.row}>
            <Pressable onPress={onCancel} style={styles.action}>
              <Text style={styles.cancel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.action}>
              <Text style={[styles.confirm, destructive && styles.destructive]}>
                {confirmLabel}
              </Text>
            </Pressable>
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
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.lg,
    paddingBottom: AppSpacing.sm,
    width: '100%',
    maxWidth: 360,
  },
  title: { ...AppTypography.titleLarge, marginBottom: AppSpacing.sm },
  body: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
    marginBottom: AppSpacing.lg,
  },
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
  action: { paddingHorizontal: AppSpacing.md, paddingVertical: AppSpacing.sm },
  cancel: { ...AppTypography.labelLarge, color: AppColors.onSurfaceMuted },
  confirm: { ...AppTypography.labelLarge, color: AppColors.brandPrimary },
  destructive: { color: AppColors.error },
});

export default ConfirmationDialog;
