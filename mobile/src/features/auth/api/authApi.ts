/**
 * Auth repository.
 *
 * All methods are async and return typed results — UI layers never touch
 * the Supabase client directly.
 *
 * DEV_MODE shortcuts (active when `Env.devMode === true`):
 *   * sendOtp / submitVerificationPhoto: simulated success after a short
 *     delay; no network call.
 *   * verifyOtp: only the literal code `123456` is accepted. On success a
 *     synthetic Session is pushed into `useSessionStore` so the navigator
 *     sees the user as authenticated.
 *   * getFemaleVerificationStatus: derived from the phone's last digit —
 *     `1` → verified, `2` → pending, `3` → none, anything else → verified.
 *     This lets us walk every login branch without backend wiring.
 *   * signInWithPassword: any non-empty password succeeds. Password
 *     `wrong` is reserved to simulate failure.
 */
import { type Session, type User as SupabaseUser } from '@supabase/supabase-js';

import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import {
  AuthException,
  InvalidOtpException,
  ValidationException,
} from '@core/network/apiException';
import { getSupabaseClient } from '@core/network/supabaseClient';
import { prefsStorage, PrefsKey } from '@core/storage/prefsStorage';
import { logger } from '@core/utils/logger';

import { useSessionStore } from '@store/sessionStore';

import { type UserRole, VerificationStatus } from '@app-types/domain';

export type AuthIntent = 'signup' | 'login' | 'forgotPassword';

const DEV_OTP = '123456';
const DEV_DELAY_MS = 600;
const DEV_FAIL_PASSWORD = 'wrong';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Builds a stub session shaped like a real Supabase response, for DEV_MODE only. */
function buildStubSession(role: UserRole, phone: string): Session {
  const now = Math.floor(Date.now() / 1000);
  const user: SupabaseUser = {
    id: `dev-${role}-${phone}`,
    aud: 'authenticated',
    role: 'authenticated',
    email: undefined,
    phone,
    created_at: new Date().toISOString(),
    app_metadata: { role, provider: 'phone', providers: ['phone'] },
    user_metadata: {},
    identities: [],
    factors: [],
    is_anonymous: false,
  };
  return {
    access_token: 'dev-access-token',
    refresh_token: 'dev-refresh-token',
    expires_in: 3600,
    expires_at: now + 3600,
    token_type: 'bearer',
    user,
  };
}

/** Sends a 6-digit OTP to the given mobile number. */
export async function sendOtp(phone: string, intent: AuthIntent): Promise<void> {
  if (Env.devMode) {
    logger.debug('authApi.sendOtp (DEV)', { phone, intent });
    await sleep(DEV_DELAY_MS);
    return;
  }
  const { error } = await getSupabaseClient().auth.signInWithOtp({ phone });
  if (error) {
    throw mapSupabaseError(error);
  }
}

/**
 * Verifies an OTP code — proves the caller owns the phone.
 *
 * IMPORTANT: This intentionally does NOT establish a persistent session.
 *   * Female signup: the user must reach the submitted screen and then
 *     log in fresh — verification status gates her access.
 *   * Male signup: session is pushed at end-of-onboarding by the calling
 *     screen, not here.
 *   * Forgot password: a short-lived recovery session is needed in
 *     production to call `auth.updateUser`. We return that session so the
 *     forgot-password new-password screen can use it without re-prompting.
 *
 * In DEV_MODE no real session ever exists — callers wire stub sessions
 * via `signInWithPasswordDev` at end-of-flow.
 */
export async function verifyOtp(
  phone: string,
  code: string,
  intent: AuthIntent,
): Promise<Session | null> {
  if (Env.devMode) {
    logger.debug('authApi.verifyOtp (DEV)', { phone, intent });
    await sleep(DEV_DELAY_MS);
    if (code !== DEV_OTP) {
      throw new InvalidOtpException();
    }
    return null;
  }
  // Supabase mobile OTPs use `type: 'sms'` for both signup and reset flows.
  // The reset semantics come from the subsequent `auth.updateUser` call.
  const { data, error } = await getSupabaseClient().auth.verifyOtp({
    phone,
    token: code,
    type: 'sms',
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  // For signup intents we want a session in dev/prod parity: production
  // will sign the user out at end-of-signup (female flow) or carry it
  // through (male flow). For forgot-password we hand the recovery session
  // back to the next screen.
  return data.session ?? null;
}

/**
 * Returns the female user's verification status for a given phone number.
 *
 * Called by the login flow to decide which screen to push next:
 *   * `Verified` → password entry
 *   * `Pending`  → "verification in progress" modal
 *   * `None`     → re-route into the verification capture screens
 */
export async function getFemaleVerificationStatus(phone: string): Promise<VerificationStatus> {
  if (Env.devMode) {
    await sleep(DEV_DELAY_MS / 2);
    const last = phone.charAt(phone.length - 1);
    if (last === '1') {
      return VerificationStatus.Verified;
    }
    if (last === '2') {
      return VerificationStatus.Pending;
    }
    if (last === '3') {
      return VerificationStatus.None;
    }
    return VerificationStatus.Verified;
  }
  const { data, error } = await getSupabaseClient()
    .from('females')
    .select('verification_status')
    .eq('phone', phone)
    .maybeSingle();
  if (error) {
    throw mapSupabaseError(error);
  }
  if (!data) {
    return VerificationStatus.None;
  }
  const raw = (data as { verification_status?: string }).verification_status;
  return parseVerificationStatus(raw);
}

function parseVerificationStatus(raw: unknown): VerificationStatus {
  switch (raw) {
    case VerificationStatus.Pending:
    case VerificationStatus.Verified:
    case VerificationStatus.Rejected:
      return raw;
    default:
      return VerificationStatus.None;
  }
}

/** Sign in with phone + password. Returns the Session. */
export async function signInWithPassword(phone: string, password: string): Promise<Session> {
  if (Env.devMode) {
    await sleep(DEV_DELAY_MS);
    if (!password) {
      throw new ValidationException('Enter your password', 'password');
    }
    if (password === DEV_FAIL_PASSWORD) {
      throw new AuthException('Incorrect password');
    }
    // Role is inferred from the route caller (female login vs male login).
    // The stub session is set into the store from the screen via `verifyOtp`'s
    // companion `_setDevSession` below — but for a real signInWithPassword
    // call from the login screen we know the role from context. So expose
    // a separate helper instead.
    throw new Error('signInWithPassword in DEV_MODE: call signInWithPasswordDev(role) instead.');
  }
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ phone, password });
  if (error) {
    throw mapSupabaseError(error);
  }
  if (!data.session) {
    throw new AuthException('Sign-in returned no session');
  }
  return data.session;
}

/**
 * DEV_MODE variant of `signInWithPassword` — requires the caller to declare
 * the role so the synthetic session carries the right `app_metadata.role`.
 *
 * Real production code paths NEVER reach this helper.
 */
export async function signInWithPasswordDev(
  phone: string,
  password: string,
  role: UserRole,
): Promise<Session> {
  if (!Env.devMode) {
    throw new Error('signInWithPasswordDev called outside DEV_MODE');
  }
  await sleep(DEV_DELAY_MS);
  if (!password) {
    throw new ValidationException('Enter your password', 'password');
  }
  if (password === DEV_FAIL_PASSWORD) {
    throw new AuthException('Incorrect password');
  }
  const session = buildStubSession(role, phone);
  useSessionStore.getState().setSession(session);
  return session;
}

/** Updates the current user's password. Used at end-of-signup and from Settings. */
export async function setInitialPassword(password: string): Promise<void> {
  if (Env.devMode) {
    await sleep(DEV_DELAY_MS);
    return;
  }
  const { error } = await getSupabaseClient().auth.updateUser({ password });
  if (error) {
    throw mapSupabaseError(error);
  }
}

/**
 * Resets a forgotten password.
 *
 * In production this assumes the user already proved phone ownership via
 * the forgot-password OTP step (which establishes a short-lived session),
 * after which `auth.updateUser({ password })` works.
 */
export async function resetPassword(phone: string, newPassword: string): Promise<void> {
  if (Env.devMode) {
    logger.debug('authApi.resetPassword (DEV)', { phone });
    await sleep(DEV_DELAY_MS);
    return;
  }
  const { error } = await getSupabaseClient().auth.updateUser({ password: newPassword });
  if (error) {
    throw mapSupabaseError(error);
  }
}

/**
 * Uploads a verification selfie. Returns the storage path the admin
 * dashboard will read.
 *
 * In production the file is uploaded to the private `verification-photos`
 * bucket in Supabase Storage (ap-south-1) and the row's
 * `verification_status` is flipped to `pending`. Here we just simulate it.
 */
export async function submitVerificationPhoto(localPath: string): Promise<string> {
  if (Env.devMode) {
    logger.debug('authApi.submitVerificationPhoto (DEV)', { localPath });
    await sleep(1500);
    return `dev://verification/${Date.now()}.jpg`;
  }
  // Real upload happens via Supabase Storage REST + a row update — wired in
  // the next prompt when the verification feature lands end-to-end.
  throw new Error('submitVerificationPhoto: production path not yet wired');
}

/** Has the user passed the first-launch account-type selection? */
export function isOnboardingSeen(): boolean {
  return prefsStorage.getBool(PrefsKey.OnboardingSeen);
}

/** Mark the account-type selection as completed. */
export function markOnboardingSeen(): void {
  prefsStorage.setBool(PrefsKey.OnboardingSeen, true);
}
