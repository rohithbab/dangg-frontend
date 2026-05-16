import messaging, { type FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import { Env } from '../config/env';
import { secureStorage, SecureKey } from '../storage/secureStorage';
import { logger } from '../utils/logger';

export type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;
export type FcmHandlers = {
  onForeground: (message: RemoteMessage) => void;
  onOpenedFromBackground: (message: RemoteMessage) => void;
};

let initialised = false;

/**
 * FCM lifecycle coordinator: permission, token registration with the
 * backend, foreground / background / quit message routing.
 *
 * Init is OPT-IN via `ENABLE_FIREBASE=true` so the app boots cleanly
 * without `google-services.json` / `GoogleService-Info.plist`. Even when
 * enabled, internal failures are swallowed — FCM is a "nice-to-have" in v1.
 */
export const fcmService = {
  async init(handlers: FcmHandlers): Promise<void> {
    if (initialised) {
      return;
    }
    if (!Env.enableFirebase) {
      logger.info('fcmService.init skipped (ENABLE_FIREBASE=false)');
      return;
    }
    try {
      await messaging().requestPermission();

      messaging().onMessage(handlers.onForeground);
      messaging().onNotificationOpenedApp(handlers.onOpenedFromBackground);
      // Cold-start: app was launched from a tapped push.
      const initial = await messaging().getInitialNotification();
      if (initial) {
        handlers.onOpenedFromBackground(initial);
      }

      messaging().onTokenRefresh(token => {
        void this.registerToken(token);
      });

      const token = await messaging().getToken();
      if (token) {
        await this.registerToken(token);
      }

      initialised = true;
      logger.info('FCM initialised');
    } catch (e) {
      logger.warn('fcmService.init failed — continuing without push', e);
    }
  },

  /**
   * Persists the token locally and posts it to the backend `fcm-register`
   * Edge Function. Backend call is stubbed until auth + Supabase functions
   * are wired in the auth prompt.
   */
  async registerToken(token: string): Promise<void> {
    await secureStorage.setItem(SecureKey.FcmToken, token);
    // TODO(integration): POST { token, platform } to the `fcm-register` Edge
    // Function once the user is authenticated. For now, persist locally only.
    logger.debug('FCM token persisted locally');
  },

  async clearLocalToken(): Promise<void> {
    await secureStorage.removeItem(SecureKey.FcmToken);
  },
};
