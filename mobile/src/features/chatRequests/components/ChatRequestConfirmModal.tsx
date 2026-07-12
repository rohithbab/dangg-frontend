import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import GradientAvatar from '@core/components/GradientAvatar';
import PrimaryButton from '@core/components/PrimaryButton';

export type ChatRequestConfirmModalProps = {
  visible: boolean;
  femaleName: string;
  femaleAvatarUrl: string | null;
  coinCost: number;
  currentBalance: number;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * B8 · Confirm (Neue bottom sheet). Compact confirm before coins are deducted:
 * ripple avatar, "Chat with {name}", the cost + balance, and Send / Cancel.
 */
function ChatRequestConfirmModal({
  visible,
  femaleName,
  femaleAvatarUrl,
  currentBalance,
  submitting = false,
  onCancel,
  onConfirm,
}: ChatRequestConfirmModalProps): React.ReactElement {
  const initial = femaleName.trim().slice(0, 1).toUpperCase();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={styles.scrim} onPress={submitting ? undefined : onCancel}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.accent} />
          <View style={styles.grabber} />

          <View style={styles.ripple}>
            <View style={[styles.ring, styles.ringOuter]} />
            <View style={[styles.ring, styles.ringInner]} />
            <GradientAvatar initials={initial} seed={femaleName} uri={femaleAvatarUrl} size={72} />
          </View>

          <Text style={styles.title}>{`Chat with ${femaleName}`}</Text>

          <Text style={styles.balance}>{`Balance: ${currentBalance.toLocaleString()}`}</Text>
          <Text style={styles.rateHint}>Billed by time · 1 coin / 3s · nothing charged to send</Text>

          <View style={styles.cta}>
            <PrimaryButton label="Send request" onPress={onConfirm} loading={submitting} />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            disabled={submitting}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: AppColors.scrim, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
    paddingBottom: AppSpacing.xl,
    alignItems: 'center',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: AppColors.primary,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.borderStrong,
    marginBottom: AppSpacing.lg,
  },
  ripple: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: AppColors.primaryBorderSoft,
    borderRadius: 999,
  },
  ringOuter: { width: 120, height: 120 },
  ringInner: { width: 96, height: 96, borderColor: AppColors.primaryOutline },
  title: {
    fontFamily: InterFont.semibold,
    fontSize: 19,
    color: AppColors.onSurface,
    marginTop: AppSpacing.md,
  },

  balance: {
    fontFamily: InterFont.regular,
    fontSize: 13,
    color: AppColors.onSurfaceMuted,
    marginTop: 3,
  },
  rateHint: {
    fontFamily: InterFont.regular,
    fontSize: 11.5,
    color: AppColors.onSurfaceMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  cta: { alignSelf: 'stretch', marginTop: AppSpacing.lg },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 2 },
  cancelText: { fontFamily: InterFont.medium, fontSize: 15, color: AppColors.onSurfaceMuted },
});

export default ChatRequestConfirmModal;
