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

function urlOf(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

/**
 * Self-healing fetch. supabase-js keeps the access token fresh via a background
 * timer, but if the app sits idle long enough for the token to expire, the next
 * data request can fire with a stale token before the on-foreground refresh
 * lands — PostgREST/Storage/Functions then answer 401 "JWT expired". Here we
 * catch that once, refresh the session, and replay the request with the new
 * token so screens self-recover instead of surfacing a JWT-expired error.
 *
 * Auth (`/auth/v1/`) requests pass straight through — refreshSession() itself
 * hits `/auth/v1/token`, and retrying those would recurse.
 */
function makeAuthedFetch(baseFetch: typeof fetch): typeof fetch {
  return async (input, init) => {
    const res = await baseFetch(input, init);
    if (res.status !== 401 || urlOf(input).includes('/auth/v1/') || !client) {
      return res;
    }

    let jwtExpired = false;
    try {
      const body = (await res.clone().json()) as { code?: string; message?: string; msg?: string };
      const blob = `${body.code ?? ''} ${body.message ?? ''} ${body.msg ?? ''}`.toLowerCase();
      jwtExpired =
        blob.includes('jwt expired') ||
        blob.includes('pgrst301') ||
        blob.includes('token is expired');
    } catch {
      // Non-JSON 401 — not our structured auth error; leave it to the caller.
    }
    if (!jwtExpired) {
      return res;
    }

    const { data, error } = await client.auth.refreshSession();
    const token = data.session?.access_token;
    if (error || !token) {
      // Refresh token itself is gone/expired — real re-auth needed; surface it.
      return res;
    }
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return baseFetch(input, { ...init, headers });
  };
}

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
      fetch: makeAuthedFetch(fetch),
    },
    realtime: {
      // Ping every 5s (default 25s). The server detects a force-closed client
      // from missed heartbeats, so a shorter interval fires presence "leave"
      // faster — a female's online card flips off sooner on the male side.
      heartbeatIntervalMs: 5000,
    },
  });

  logger.info(`Supabase initialised (env=${Env.appEnv})`);
  return client;
}

/** Eager init — call from `App.tsx` so failures surface before the first frame. */
export function initSupabase(): SupabaseClient {
  return getSupabaseClient();
}
