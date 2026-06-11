import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import BottomSheet from '@core/components/BottomSheet';
import PrimaryButton from '@core/components/PrimaryButton';
import { logger } from '@core/utils/logger';

export type BlockReportTarget = 'male' | 'female';

export type BlockReportSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Display name of the user being acted on. */
  targetName: string;
  /** Drives the report-reason list. */
  target: BlockReportTarget;
  /** Block confirmed — caller persists and updates UI. */
  onBlock: () => Promise<void> | void;
  /** Report submitted — caller persists. */
  onReport: (reason: string, comment: string) => Promise<void> | void;
};

const FEMALE_REPORT_REASONS: ReadonlyArray<string> = [
  'Inappropriate behavior',
  'Scam / asking for off-platform contact',
  'Not responsive in chat',
  'Misrepresentation (did not match profile)',
  'Other',
];

const MALE_REPORT_REASONS: ReadonlyArray<string> = [
  'Harassment',
  'Spam',
  'Fraud / scam',
  'Inappropriate behavior',
  'Other',
];

function BlockIcon(): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12c0-4.42 3.58-8 8-8zm0 16c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"
        fill={AppColors.error}
      />
    </Svg>
  );
}

function FlagIcon(): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" fill={AppColors.warning} />
    </Svg>
  );
}

function ChevronRight(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" fill={AppColors.onSurfaceMuted} />
    </Svg>
  );
}

function RadioDot({ selected }: { selected: boolean }): React.ReactElement {
  return (
    <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
      {selected ? <View style={styles.radioInner} /> : null}
    </View>
  );
}

/**
 * Two-step bottom sheet — Step 1 lets the user choose Block or Report.
 * Picking Report swaps the content for a reason picker + optional comment +
 * Submit. Cancel from the reason picker returns to Step 1.
 */
function BlockReportSheet({
  visible,
  onClose,
  targetName,
  target,
  onBlock,
  onReport,
}: BlockReportSheetProps): React.ReactElement {
  const [mode, setMode] = useState<'root' | 'reasons'>('root');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const reasons = target === 'female' ? FEMALE_REPORT_REASONS : MALE_REPORT_REASONS;

  const reset = useCallback((): void => {
    setMode('root');
    setSelectedReason(null);
    setComment('');
    setBusy(false);
  }, []);

  const handleClose = useCallback((): void => {
    onClose();
    // Defer reset so the closing animation isn't interrupted mid-frame.
    setTimeout(reset, 250);
  }, [onClose, reset]);

  const handleBlock = useCallback(async (): Promise<void> => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await onBlock();
      handleClose();
    } catch (e) {
      logger.warn('BlockReportSheet.onBlock failed', e);
      setBusy(false);
    }
  }, [busy, handleClose, onBlock]);

  const handleSubmitReport = useCallback(async (): Promise<void> => {
    if (!selectedReason || busy) {
      return;
    }
    setBusy(true);
    try {
      await onReport(selectedReason, comment.trim());
      handleClose();
    } catch (e) {
      logger.warn('BlockReportSheet.onReport failed', e);
      setBusy(false);
    }
  }, [busy, comment, handleClose, onReport, selectedReason]);

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={mode === 'root' ? `Actions for ${targetName}` : `Report ${targetName}`}
    >
      {mode === 'root' ? (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Block ${targetName}`}
            onPress={() => {
              void handleBlock();
            }}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={styles.rowIcon}>
              <BlockIcon />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Block this user</Text>
              <Text style={styles.rowSubtitle}>
                {target === 'female'
                  ? 'You won’t receive chat requests from her'
                  : 'You won’t see this user again'}
              </Text>
            </View>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Report"
            onPress={() => setMode('reasons')}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={styles.rowIcon}>
              <FlagIcon />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Report</Text>
              <Text style={styles.rowSubtitle}>Let our team know what went wrong</Text>
            </View>
            <ChevronRight />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleClose}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelPressed]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <Text style={styles.reasonsHeader}>Pick a reason</Text>
          {reasons.map(reason => (
            <Pressable
              key={reason}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedReason === reason }}
              onPress={() => setSelectedReason(reason)}
              style={({ pressed }) => [styles.reasonRow, pressed && styles.rowPressed]}
            >
              <RadioDot selected={selectedReason === reason} />
              <Text style={styles.reasonLabel}>{reason}</Text>
            </Pressable>
          ))}

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment (optional)"
            placeholderTextColor={AppColors.onSurfaceMuted}
            style={styles.commentInput}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMode('root')}
              style={({ pressed }) => [styles.backLink, pressed && styles.cancelPressed]}
            >
              <Text style={styles.backLinkText}>Back</Text>
            </Pressable>
            <View style={styles.submitWrap}>
              <PrimaryButton
                label="Submit Report"
                onPress={() => {
                  void handleSubmitReport();
                }}
                disabled={!selectedReason}
                loading={busy}
              />
            </View>
          </View>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: AppSpacing.md,
    gap: AppSpacing.md,
  },
  rowPressed: { opacity: 0.55 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
    fontWeight: '600',
  },
  rowSubtitle: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.divider,
  },
  cancelBtn: {
    marginTop: AppSpacing.md,
    alignSelf: 'center',
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.sm,
  },
  cancelPressed: { opacity: 0.55 },
  cancelText: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
  },
  reasonsHeader: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: AppSpacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: AppSpacing.sm,
    gap: AppSpacing.md,
  },
  reasonLabel: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
    flex: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: AppColors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primary,
  },
  commentInput: {
    marginTop: AppSpacing.md,
    minHeight: 80,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: AppRadii.md,
    padding: AppSpacing.sm,
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: AppSpacing.lg,
    gap: AppSpacing.sm,
  },
  backLink: { paddingHorizontal: AppSpacing.sm, paddingVertical: AppSpacing.sm },
  backLinkText: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
  },
  submitWrap: { flex: 1 },
});

export default BlockReportSheet;
