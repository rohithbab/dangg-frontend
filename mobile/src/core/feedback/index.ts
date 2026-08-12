/**
 * App-owned replacements for React Native's `Alert.alert` and `ToastAndroid`.
 *
 * Both natives render platform chrome that ignores the app's theme — the
 * Material dialog is white on a dark app, and the system toast uses its own
 * type and placement. These render our components instead, and are imperative
 * for the same reason the natives were: most call sites are catch blocks and
 * callbacks with no component state to drive.
 *
 *   showAlert({ title, message, buttons })   // was Alert.alert(...)
 *   showToast('Saved')                       // was ToastAndroid.show(...)
 *
 * An ESLint rule blocks the natives so they cannot creep back in.
 */
import { type AppAlertButton, type AppAlertConfig, useFeedbackStore } from './feedbackStore';

export {
  type AppAlertButton,
  type AppAlertButtonStyle,
  type AppAlertConfig,
} from './feedbackStore';

/**
 * Themed alert. Signature mirrors `Alert.alert` so call sites read the same:
 * one button renders a single acknowledge action, two sit side by side, three
 * or more stack full-width.
 */
export function showAlert(config: AppAlertConfig): void {
  useFeedbackStore.getState().pushAlert(config);
}

/** Convenience for the common "something failed, acknowledge it" case. */
export function showErrorAlert(title: string, message?: string): void {
  showAlert({ title, message });
}

/**
 * Themed transient toast. Replaces `ToastAndroid.show`, which also had the
 * side effect of being Android-only — this renders identically on both
 * platforms.
 */
export function showToast(message: string): void {
  useFeedbackStore.getState().setToast(message);
}

/** Action-sheet-shaped alert: a list of choices plus Cancel. */
export function showActionAlert(
  title: string,
  actions: ReadonlyArray<{ text: string; onPress: () => void }>,
  cancelText = 'Cancel',
): void {
  const buttons: AppAlertButton[] = [
    ...actions.map(a => ({ text: a.text, onPress: a.onPress })),
    { text: cancelText, style: 'cancel' as const },
  ];
  showAlert({ title, buttons });
}
