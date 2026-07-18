import * as Keychain from 'react-native-keychain';

import { logger } from '../utils/logger';

/** Enum-keyed accessors so callers can't pass an arbitrary string. */
export enum SecureKey {
  SessionToken = 'SESSION_TOKEN',
  RefreshToken = 'REFRESH_TOKEN',
  FcmToken = 'FCM_TOKEN',
  BiometricEnabled = 'BIOMETRIC_ENABLED',
  DeviceSessionId = 'DEVICE_SESSION_ID',
}

/**
 * Encrypted key-value store backed by the platform Keychain / Keystore.
 *
 * Use for sensitive material only — auth tokens, biometric flags. For
 * everything else use `prefsStorage.ts` (MMKV, 10× faster).
 *
 * `react-native-keychain` stores one credential per `service` — we use the
 * `SecureKey` value as the service name to get distinct slots.
 */
export const secureStorage = {
  async setItem(key: SecureKey, value: string): Promise<void> {
    await Keychain.setGenericPassword(key, value, { service: key });
  },

  async getItem(key: SecureKey): Promise<string | null> {
    try {
      const result = await Keychain.getGenericPassword({ service: key });
      return result ? result.password : null;
    } catch (e) {
      logger.warn('secureStorage.getItem failed', key, e);
      return null;
    }
  },

  async removeItem(key: SecureKey): Promise<void> {
    await Keychain.resetGenericPassword({ service: key });
  },

  /** Removes every key managed by the app — call on logout / account deletion. */
  async clear(): Promise<void> {
    await Promise.all(
      Object.values(SecureKey).map(k => Keychain.resetGenericPassword({ service: k })),
    );
  },

  async setBool(key: SecureKey, value: boolean): Promise<void> {
    await this.setItem(key, value ? 'true' : 'false');
  },

  async getBool(key: SecureKey): Promise<boolean> {
    const raw = await this.getItem(key);
    return raw === 'true';
  },
};
