import { create } from 'zustand';

/**
 * App-owned alert + toast state.
 *
 * Exists so nothing has to reach for `Alert.alert` or `ToastAndroid`, both of
 * which render the platform's own chrome — a white Material dialog on a
 * dark-themed app, and a grey system toast that ignores our type scale.
 *
 * Kept as a store rather than per-screen state so the API can stay imperative
 * (`showAlert(...)`), callable from API layers and callbacks that have no
 * component to hang state off — which is exactly where the native calls were
 * being made.
 */

export type AppAlertButtonStyle = 'default' | 'cancel' | 'destructive';

export type AppAlertButton = {
  text: string;
  onPress?: () => void;
  style?: AppAlertButtonStyle;
};

export type AppAlertConfig = {
  title: string;
  message?: string;
  /** Defaults to a single "OK" when omitted. */
  buttons?: AppAlertButton[];
};

type FeedbackState = {
  /**
   * Queue, not a single slot. Two failures can land in the same tick (e.g. a
   * media upload rejecting while the socket reports the chat ended) and the
   * second must not silently replace the first.
   */
  alertQueue: AppAlertConfig[];
  toast: string | null;
  pushAlert: (config: AppAlertConfig) => void;
  dismissAlert: () => void;
  setToast: (message: string | null) => void;
};

export const useFeedbackStore = create<FeedbackState>()(set => ({
  alertQueue: [],
  toast: null,

  pushAlert: (config): void => set(s => ({ alertQueue: [...s.alertQueue, config] })),

  dismissAlert: (): void => set(s => ({ alertQueue: s.alertQueue.slice(1) })),

  setToast: (message): void => set({ toast: message }),
}));

/** The alert currently on screen, or null. */
export const useCurrentAlert = (): AppAlertConfig | null =>
  useFeedbackStore(s => s.alertQueue[0] ?? null);

export const useToastMessage = (): string | null => useFeedbackStore(s => s.toast);
