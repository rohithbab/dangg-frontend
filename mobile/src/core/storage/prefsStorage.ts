import { MMKV } from 'react-native-mmkv';

/** Enum-keyed accessors for non-sensitive preferences. */
export enum PrefsKey {
  OnboardingSeen = 'ONBOARDING_SEEN',
  LastRole = 'LAST_ROLE',
  LanguagePref = 'LANGUAGE_PREF',
  ThemePref = 'THEME_PREF',
}

const mmkv = new MMKV({ id: 'dangg.prefs' });

/**
 * MMKV-backed key/value store for UI flags, last-known-role, locale, etc.
 * Sub-millisecond reads — safe to call from render in hot paths.
 *
 * Anything security-sensitive belongs in `secureStorage.ts` (Keychain).
 */
export const prefsStorage = {
  setString(key: PrefsKey, value: string): void {
    mmkv.set(key, value);
  },

  getString(key: PrefsKey): string | null {
    return mmkv.getString(key) ?? null;
  },

  setBool(key: PrefsKey, value: boolean): void {
    mmkv.set(key, value);
  },

  getBool(key: PrefsKey, defaultValue = false): boolean {
    return mmkv.getBoolean(key) ?? defaultValue;
  },

  setNumber(key: PrefsKey, value: number): void {
    mmkv.set(key, value);
  },

  getNumber(key: PrefsKey): number | null {
    return mmkv.getNumber(key) ?? null;
  },

  remove(key: PrefsKey): void {
    mmkv.delete(key);
  },

  clear(): void {
    mmkv.clearAll();
  },
};
