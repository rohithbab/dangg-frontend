import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { Env, missingRequiredEnv } from '../config/env';
import { secureStorage, SecureKey } from '../storage/secureStorage';
import { logger } from '../utils/logger';

/**
 * Bridges Supabase's `auth.storage` contract to our Keychain wrapper so
 * session + refresh tokens never sit in AsyncStorage.
 *
 * Supabase calls `setItem`/`getItem`/`removeItem` with its own internal
 * key (e.g. `sb-<project>-auth-token`). We route to a single Keychain
 * slot — there's only ever one auth session per app instance.
 */
const supabaseAuthStorage = {
  async getItem(_key: string): Promise<string | null> {
    return secureStorage.getItem(SecureKey.SessionToken);
  },
  async setItem(_key: string, value: string): Promise<void> {
    await secureStorage.setItem(SecureKey.SessionToken, value);
  },
  async removeItem(_key: string): Promise<void> {
    await secureStorage.removeItem(SecureKey.SessionToken);
  },
};

let client: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase client. Lazily initialised on first call.
 * One client per app instance — the underlying GoTrue + PostgREST +
 * Realtime connections are pooled inside it.
 */
export function getSupabaseClient(): SupabaseClient {
  if (client) {
    return client;
  }

  const missing = missingRequiredEnv();
  if (missing.length > 0) {
    throw new Error(`Supabase env missing: ${missing.join(', ')}`);
  }

  client = createClient(Env.supabaseUrl, Env.supabaseAnonKey, {
    auth: {
      storage: supabaseAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
    global: {
      headers: { 'X-Client-Info': 'dangg-mobile/1.0' },
    },
  });

  logger.info(`Supabase initialised (env=${Env.appEnv})`);
  return client;
}

/** Eager init — call from `App.tsx` so failures surface before the first frame. */
export function initSupabase(): SupabaseClient {
  return getSupabaseClient();
}
