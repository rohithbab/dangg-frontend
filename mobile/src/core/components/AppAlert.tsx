import React, { useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import { type AppAlertButton } from '@core/feedback/feedbackStore';

export type AppAlertProps = {
  visible: boolean;
  title: string;
  message?: string;
  /** Defaults to a single "OK". */
  buttons?: AppAlertButton[];
  /** Fired after a button's own handler, and on scrim / back dismissal. */
  onDismiss: () => void;
};

const DEFAULT_BUTTONS: AppAlertButton[] = [{ text: 'OK' }];

/**
 * The app's own alert dialog — the replacement for `Alert.alert`, which draws
 * the platform's white Material dialog regardless of our dark theme.
 *
 * Layout follows the platform convention the native dialog got right: one or
 * two actions sit in a right-aligned row, three or more stack full-width so
 * long labels aren't truncated.
 */
function AppAlert({
  visible,
  title,
  message,
  buttons = DEFAULT_BUTTONS,
  onDismiss,
}: AppAlertProps): React.ReactElement {
  const resolved = buttons.length > 0 ? buttons : DEFAULT_BUTTONS;
  const stacked = resolved.length > 2;

  const handlePress = useCallback(
    (button: AppAlertButton) => (): void => {
      // Dismiss first so a handler that opens another alert queues behind this
      // one instead of being swallowed by the closing modal.
      onDismiss();
      button.onPress?.();
    },
    [onDismiss],
  );

  // Back button / swipe maps to the cancel action when there is one, matching
  // what the native dialog did.
  const handleRequestClose = useCallback((): void => {
    const cancel = resolved.find(b => b.style === 'cancel');
    onDismiss();
    cancel?.onPress?.();
  }, [onDismiss, resolved]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleRequestClose}
    >
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={[styles.actions, stacked ? styles.actionsStacked : styles.actionsRow]}>
            {resolved.map((button, index) => (
              <Pressable
                key={`${button.text}-${index}`}
                accessibilityRole="button"
                onPress={handlePress(button)}
                style={({ pressed }) => [
                  styles.action,
                  stacked && styles.actionStacked,
                  pressed && styles.actionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.label,
                    button.style === 'cancel' && styles.labelCancel,
                    button.style === 'destructive' && styles.labelDestructive,
                    stacked && styles.labelStacked,
                  ]}
                >
                  {button.text}
                </Text>
              </Pressable>
            ))}
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
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.lg,
    paddingBottom: AppSpacing.sm,
    width: '100%',
    maxWidth: 360,
  },
  title: {
    ...AppTypography.titleLarge,
    color: AppColors.onSurface,
    marginBottom: AppSpacing.sm,
  },
  message: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginBottom: AppSpacing.lg,
  },
  actions: { marginTop: AppSpacing.xs },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  actionsStacked: { flexDirection: 'column' },
  action: {
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    borderRadius: AppRadii.sm,
    // Keeps every action at the platform minimum touch target.
    minHeight: 44,
    justifyContent: 'center',
  },
  actionStacked: { paddingHorizontal: AppSpacing.sm },
  actionPressed: { backgroundColor: AppColors.primarySubtle },
  label: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
    textAlign: 'center',
  },
  labelStacked: { textAlign: 'left' },
  labelCancel: { color: AppColors.onSurfaceMuted },
  labelDestructive: { color: AppColors.error },
});

export default AppAlert;
