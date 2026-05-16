import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Tap on the dimmed backdrop closes the sheet (default true). */
  dismissOnOutsideTap?: boolean;
};

/**
 * Lightweight bottom sheet — Modal + a slide-up panel with a drag-handle.
 * For more complex gesture interactions, swap to `@gorhom/bottom-sheet`
 * later without touching call sites (same API).
 */
function BottomSheet({
  visible,
  onClose,
  title,
  children,
  dismissOnOutsideTap = true,
}: BottomSheetProps): React.ReactElement {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={dismissOnOutsideTap ? onClose : undefined} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: AppColors.scrim },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: AppSpacing.sm,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.divider,
    alignSelf: 'center',
    marginBottom: AppSpacing.sm,
  },
  title: {
    ...AppTypography.titleMedium,
    paddingHorizontal: AppSpacing.lg,
    marginBottom: AppSpacing.sm,
  },
  content: {
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.xl,
  },
});

export default BottomSheet;
