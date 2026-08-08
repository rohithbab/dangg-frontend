import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import AppBar from '@core/components/AppBar';
import Card from '@core/components/Card';
import PrimaryButton from '@core/components/PrimaryButton';
import Toast from '@core/components/Toast';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import { DESCRIPTION_MAX, DESCRIPTION_MIN, type IssueType, submitReport } from '../api/supportApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList, 'ReportIssue'>;

/** How long the success toast stays up before the screen pops. */
const TOAST_DWELL_MS = 1200;

const TYPES: ReadonlyArray<{ value: IssueType; label: string }> = [
  { value: 'bug', label: 'Bug' },
  { value: 'account', label: 'Account Issue' },
  { value: 'payment', label: 'Payment Issue' },
  { value: 'userBehavior', label: 'User Behavior' },
  { value: 'other', label: 'Other' },
];

function AttachIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"
        fill={AppColors.primary}
      />
    </Svg>
  );
}

function CloseIcon(): React.ReactElement {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        fill={AppColors.onSurface}
      />
    </Svg>
  );
}

/** Free-form report form with type selector, description, optional screenshot. */
function ReportIssueScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [type, setType] = useState<IssueType>('bug');
  const [description, setDescription] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const trimmed = description.trim();
  const tooShort = trimmed.length < DESCRIPTION_MIN;
  // Only nag once they have actually started typing.
  const showLengthHint = trimmed.length > 0 && tooShort;

  const attach = useCallback(async (): Promise<void> => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.6,
      });
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        setSubmitError("Couldn't open your gallery. Please try again.");
        return;
      }
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setSubmitError(null);
        setScreenshotUri(uri);
      }
    } catch (e) {
      // Previously unhandled: the picker rejecting produced an unhandled
      // promise rejection and no user-visible feedback at all.
      logger.warn('ReportIssueScreen.attach failed', e);
      setSubmitError("Couldn't attach that image. Please try again.");
    }
  }, []);

  const submit = useCallback(async (): Promise<void> => {
    if (submitting || tooShort) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitReport({
        type,
        description: trimmed,
        screenshotLocalPath: screenshotUri,
      });
      setToast("Report submitted · We'll respond within 24h");
      // Let the confirmation land before the screen disappears.
      setTimeout(() => navigation.goBack(), TOAST_DWELL_MS);
    } catch (e) {
      if (e instanceof AppException) {
        setSubmitError(e.message);
      } else {
        logger.error('ReportIssueScreen.submit failed', e);
        setSubmitError('Could not submit, try again');
      }
    } finally {
      setSubmitting(false);
    }
  }, [navigation, screenshotUri, submitting, tooShort, trimmed, type]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppBar title="Report an Issue" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card padding={AppSpacing.lg} containerStyle={styles.card}>
            <Text style={styles.label}>Issue type</Text>
            <View style={styles.typeRow}>
              {TYPES.map(t => (
                <Pressable
                  key={t.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: type === t.value }}
                  onPress={() => setType(t.value)}
                  style={[styles.chip, type === t.value && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, type === t.value && styles.chipLabelActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Describe the issue</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us what happened…"
              placeholderTextColor={AppColors.onSurfaceMuted}
              multiline
              numberOfLines={5}
              // Bounded to the column's CHECK so an over-long description is
              // impossible to type rather than rejected after a round trip.
              maxLength={DESCRIPTION_MAX}
              textAlignVertical="top"
              style={styles.textArea}
            />
            {/* The submit button is disabled below the minimum; without this
                the form looked broken with no explanation why. */}
            <View style={styles.metaRow}>
              <Text style={[styles.helper, showLengthHint && styles.helperWarn]}>
                {showLengthHint
                  ? `At least ${DESCRIPTION_MIN} characters (${trimmed.length}/${DESCRIPTION_MIN})`
                  : 'Include as much detail as you can.'}
              </Text>
              <Text style={styles.counter}>{`${description.length}/${DESCRIPTION_MAX}`}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void attach();
              }}
              style={styles.attachRow}
            >
              <AttachIcon />
              <Text style={styles.attachText}>
                {screenshotUri ? 'Replace screenshot' : 'Attach Screenshot (optional)'}
              </Text>
            </Pressable>
            {screenshotUri ? (
              <View style={styles.attachmentChip}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  Screenshot attached
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setScreenshotUri(null)}
                  hitSlop={8}
                >
                  <CloseIcon />
                </Pressable>
              </View>
            ) : null}

            {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
          </Card>
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label="Submit Report"
            onPress={() => {
              void submit();
            }}
            loading={submitting}
            disabled={tooShort || submitting}
          />
        </View>
      </KeyboardAvoidingView>
      <Toast message={toast} onHide={() => setToast(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  flex: { flex: 1 },
  scroll: { padding: AppSpacing.md, paddingTop: AppSpacing.lg },
  card: { gap: AppSpacing.sm },
  label: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppSpacing.xs,
  },
  chip: {
    paddingHorizontal: AppSpacing.sm + 4,
    paddingVertical: AppSpacing.xs,
    borderRadius: AppRadii.full,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  chipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  chipLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurface,
  },
  chipLabelActive: { color: AppColors.onPrimary },
  textArea: {
    ...AppTypography.bodyLarge,
    minHeight: 120,
    borderRadius: AppRadii.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    padding: AppSpacing.md,
    color: AppColors.onSurface,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: AppSpacing.sm,
  },
  helper: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    flexShrink: 1,
  },
  helperWarn: { color: AppColors.error },
  counter: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
    paddingVertical: AppSpacing.xs,
  },
  attachText: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primarySubtle,
    borderRadius: AppRadii.full,
    paddingHorizontal: AppSpacing.sm + 4,
    paddingVertical: AppSpacing.xs,
    alignSelf: 'flex-start',
    gap: AppSpacing.xs,
  },
  attachmentName: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurface,
  },
  submitError: {
    ...AppTypography.bodyMedium,
    color: AppColors.error,
    textAlign: 'center',
  },
  footer: {
    padding: AppSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
    backgroundColor: AppColors.background,
  },
});

export default ReportIssueScreen;
