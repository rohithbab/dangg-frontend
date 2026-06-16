import messaging, { type FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

import { Env } from '../config/env';
import { getSupabaseClient } from '../network/supabaseClient';
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

  /** Persists the token locally and registers it with the backend. */
  async registerToken(token: string): Promise<void> {
    await secureStorage.setItem(SecureKey.FcmToken, token);
    await postToken(token);
  },

  /**
   * Re-registers the stored token with the backend. Call after login — the
   * boot-time registration in init() can run before a session exists, so the
   * token must be (re)posted once the user is authenticated.
   */
  async syncToken(): Promise<void> {
    if (!Env.enableFirebase) {
      return;
    }
    const token = await secureStorage.getItem(SecureKey.FcmToken);
    if (token) {
      await postToken(token);
    }
  },

  async clearLocalToken(): Promise<void> {
    await secureStorage.removeItem(SecureKey.FcmToken);
  },
};

/**
 * POSTs the device token to the `fcm-register` Edge Function. `functions.invoke`
 * attaches the current session JWT, so this is a no-op (401, swallowed) until
 * the user is authenticated — `syncToken()` re-runs it after login.
 */
async function postToken(token: string): Promise<void> {
  try {
    const { error } = await getSupabaseClient().functions.invoke('fcm-register', {
      body: { token, platform: Platform.OS },
    });
    if (error) {
      logger.warn('fcm-register failed', error);
    } else {
      logger.debug('FCM token registered with backend');
    }
  } catch (e) {
    logger.warn('fcm-register threw', e);
  }
}
