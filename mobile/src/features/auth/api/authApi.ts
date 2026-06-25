/**
 * Auth repository — phone + OTP only (no passwords).
 *
 * All methods are async and return typed results — UI layers never touch
 * the Supabase client directly.
 *
 * Session syncing: real OTP verification signs the user in via Supabase, and
 * `subscribeSupabaseAuth` (sessionStore) reacts to `onAuthStateChange` to set
 * the store session + role + female verification status automatically. The
 * DEV_MODE (`USE_MOCK_DATA`) path builds a stub session and sets the store
 * directly, since no real auth event fires.
 *
 * DEV_MODE shortcuts (active when `USE_MOCK_DATA === true`):
 *   * sendOtp: no network call.
 *   * verifyOtp: only the literal code `123456` is accepted; a synthetic
 *     Session is returned (and, for login, pushed into the store).
 *   * getFemaleVerificationStatus: derived from the phone's last digit —
 *     `2` → pending, `3` → none, otherwise verified.
 */
import { type Session, type User as SupabaseUser } from '@supabase/supabase-js';

import { USE_MOCK_DATA } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { AppException, AuthException, InvalidOtpException } from '@core/network/apiException';
import { getSupabaseClient } from '@core/network/supabaseClient';
import { uploadToR2 } from '@core/network/mediaService';
import { prefsStorage, PrefsKey } from '@core/storage/prefsStorage';
import { logger } from '@core/utils/logger';

import { useSessionStore } from '@store/sessionStore';

import { parseUserRole, UserRole, VerificationStatus } from '@app-types/domain';

import { type PayoutDetails, useSignupDraftStore } from '../store/signupDraftStore';

export type AuthIntent = 'signup' | 'login';

const DEV_DELAY_MS = 600;
const DEV_OTP_CODE = '123456';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Normalises a phone number to E.164. Supabase Auth and the backend store
 * phones as `+91…`; the signup/login forms collect a bare 10-digit number
 * (the `+91` is only a UI prefix). Assumes India when no country code is
 * present.
 */
function toE164(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/\D/g, '');
  }
  return `+91${trimmed.replace(/\D/g, '').slice(-10)}`;
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
    user_metadata: { role },
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

/**
 * Resolves a user's role from the `users` table by phone. Used to shape the
 * dev stub session and to branch female verification routing at login.
 */
async function resolveUserRoleByPhone(phone: string): Promise<UserRole> {
  const cleaned = phone.replace(/\D/g, '').slice(-10);
  try {
    const { data, error } = await getSupabaseClient()
      .from('users')
      .select('role')
      .eq('phone', `+91${cleaned}`)
      .maybeSingle();
    if (error) {
      logger.warn('resolveUserRoleByPhone query failed', error);
    }
    const role = parseUserRole(data?.role);
    if (role) {
      return role;
    }
  } catch (e) {
    logger.warn('resolveUserRoleByPhone exception', e);
  }
  throw new AppException('NOT_FOUND', 'Account not found. Please sign up first.');
}

/**
 * Sends a 6-digit OTP to the given mobile number.
 *
 * Signup carries name/age/role so the backend trigger can provision the
 * public.users + role-specific row. Login targets an existing user, so no
 * metadata is sent. OTP delivery is ALWAYS real (Supabase → MSG91 / edge logs).
 */
export async function sendOtp(phone: string, intent: AuthIntent): Promise<void> {
  if (USE_MOCK_DATA) {
    await sleep(DEV_DELAY_MS / 2);
    return;
  }
  // Signup defers the profile (name/age/role) to the Profile screen, so no
  // metadata is sent here — the backend creates a pending auth user that
  // completeSignupProfile() finalises. Login must NOT create a user, so an
  // unregistered phone fails instead of silently registering.
  const options = intent === 'login' ? { shouldCreateUser: false } : undefined;
  const { error } = await getSupabaseClient().auth.signInWithOtp({
    phone: toE164(phone),
    options,
  });
  if (error) {
    throw mapSupabaseError(error);
  }
}

/**
 * Verifies an OTP code — proves the caller owns the phone.
 *
 * On the real path Supabase establishes a session and `subscribeSupabaseAuth`
 * reacts to it (sets store session + role + female verification). For LOGIN
 * that is all that's needed. For SIGNUP the calling screen continues the
 * multi-step flow (the session, if any, gates routing via RootNavigator).
 *
 * DEV_MODE: only `123456` is accepted. A stub session is returned and, for
 * login, pushed into the store (with female verification status).
 */
export async function verifyOtp(
  phone: string,
  code: string,
  // Kept for call-site symmetry with sendOtp; verification is intent-agnostic.
  // Login session/routing happens in finishLogin(); signup routing in the screen.
  _intent: AuthIntent,
): Promise<Session | null> {
  if (USE_MOCK_DATA) {
    await sleep(DEV_DELAY_MS);
    if (code !== DEV_OTP_CODE) {
      throw new InvalidOtpException();
    }
    // Phone proven. No session is pushed here — finishLogin() (login) or
    // completeSignupProfile() (signup) establishes it once the role is known.
    return null;
  }

  const { data, error } = await getSupabaseClient().auth.verifyOtp({
    phone: toE164(phone),
    token: code,
    type: 'sms',
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  return data.session ?? null;
}

/**
 * Resolves where a login lands after OTP verification.
 *
 * Returns `{ needsProfile: true }` when the phone is verified but the account
 * never finished signup (a "pending" account with no role in public.users) —
 * the caller then sends the user to the Profile setup screen to complete it.
 * Otherwise the session/role/verification is established (dev) or was already
 * set by the Supabase auth listener (real), and RootNavigator routes by role.
 */
export async function finishLogin(phone: string): Promise<{ needsProfile: boolean }> {
  let role: UserRole | null = null;
  try {
    role = await resolveUserRoleByPhone(phone);
  } catch {
    role = null;
  }
  if (!role) {
    return { needsProfile: true };
  }
  if (USE_MOCK_DATA) {
    if (role === UserRole.Female) {
      const info = await getFemaleVerificationStatus(phone);
      useSessionStore.getState().setVerificationStatus(info.status);
    }
    useSessionStore.getState().setSession(buildStubSession(role, phone));
  }
  // Real: the auth listener already set session + role + verification status.
  return { needsProfile: false };
}

/**
 * Establishes the store session at the end of male signup onboarding.
 *
 * Real path: the OTP verify already signed the user in and
 * `subscribeSupabaseAuth` set the store — this hydrates from the current
 * Supabase session as a safety net. DEV path: pushes a stub session.
 */
export async function establishSignupSession(role: UserRole, phone: string): Promise<void> {
  if (USE_MOCK_DATA) {
    useSessionStore.getState().setSession(buildStubSession(role, phone));
    if (role === UserRole.Female) {
      useSessionStore.getState().setVerificationStatus(VerificationStatus.Verified);
    }
    return;
  }
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) {
    throw mapSupabaseError(error);
  }
  if (!data.session) {
    throw new AuthException('No active session after verification.');
  }
  useSessionStore.getState().setSession(data.session);
}

/**
 * Completes a deferred signup (Phone → OTP → Profile). Sets name/age/role on
 * the backend (complete_signup_profile RPC + user_metadata) and pushes the
 * session so RootNavigator routes by role. Females are reset to verification
 * status None so they enter the verification flow next.
 */
export async function completeSignupProfile(params: {
  name: string;
  age: number;
  role: UserRole;
}): Promise<void> {
  const { name, age, role } = params;
  if (USE_MOCK_DATA) {
    await sleep(DEV_DELAY_MS);
    const phone = useSignupDraftStore.getState().phone;
    if (role === UserRole.Female) {
      useSessionStore.getState().setVerificationStatus(VerificationStatus.None);
    }
    useSessionStore.getState().setSession(buildStubSession(role, phone));
    return;
  }
  const client = getSupabaseClient();
  const { error: rpcErr } = await client.rpc('complete_signup_profile', {
    p_name: name,
    p_age: age,
    p_role: role,
  });
  if (rpcErr) {
    throw mapSupabaseError(rpcErr);
  }
  // Mirror role/name/age into user_metadata so the JWT carries the role.
  const { error: updErr } = await client.auth.updateUser({ data: { name, age, role } });
  if (updErr) {
    throw mapSupabaseError(updErr);
  }
  if (role === UserRole.Female) {
    useSessionStore.getState().setVerificationStatus(VerificationStatus.None);
  }
  const { data } = await client.auth.getSession();
  if (data.session) {
    useSessionStore.getState().setSession(data.session);
  }
}

/**
 * Returns the female user's verification status for a given phone number.
 * Called by the OTP login flow to set verification status before routing.
 */
export type FemaleVerificationStatusInfo = {
  status: VerificationStatus;
  name: string | null;
  profilePictureUrl: string | null;
};

export async function getFemaleVerificationStatus(
  phone: string,
): Promise<FemaleVerificationStatusInfo> {
  if (USE_MOCK_DATA) {
    await sleep(DEV_DELAY_MS / 2);
    const last = phone.charAt(phone.length - 1);
    let status = VerificationStatus.Verified;
    if (last === '2') {
      status = VerificationStatus.Pending;
    } else if (last === '3') {
      status = VerificationStatus.None;
    }
    return {
      status,
      name: 'Simulated Name',
      profilePictureUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    };
  }
  const { data, error } = await getSupabaseClient().rpc('get_female_verification_status', {
    p_phone: toE164(phone),
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  const statusInfo = data as {
    verification_status?: string;
    name?: string | null;
    profile_picture_url?: string | null;
  } | null;

  return {
    status: parseVerificationStatus(statusInfo?.verification_status),
    name: statusInfo?.name ?? null,
    profilePictureUrl: statusInfo?.profile_picture_url ?? null,
  };
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

/**
 * Uploads a verification selfie to R2 (via media-sign presigned PUT), then
 * calls the `verification-photo-submit` Edge Function which flips the female's
 * `verification_status` to `pending`. Requires an active session (signup
 * leaves one after OTP verify).
 */
export async function submitVerificationPhoto(localPath: string): Promise<string> {
  if (USE_MOCK_DATA) {
    logger.debug('authApi.submitVerificationPhoto (DEV)', { localPath });
    await sleep(1500);
    return `dev://verification/${Date.now()}.jpg`;
  }

  const client = getSupabaseClient();

  const { objectKey } = await uploadToR2('verification', localPath);

  const { error: submitErr } = await client.functions.invoke('verification-photo-submit', {
    body: { objectPath: objectKey },
  });
  if (submitErr) {
    throw mapSupabaseError(submitErr);
  }

  logger.info('authApi.submitVerificationPhoto uploaded', { objectKey });
  return objectKey;
}

/**
 * Persists the female's payout method to `payout_details` during signup.
 * RLS allows a female to write only her own row. Upsert on `female_id` so a
 * re-entry updates rather than duplicates. Requires an active session.
 */
export async function savePayoutDetails(payout: PayoutDetails): Promise<void> {
  if (USE_MOCK_DATA) {
    logger.debug('authApi.savePayoutDetails (DEV)', { kind: payout.kind });
    await sleep(DEV_DELAY_MS);
    return;
  }

  const client = getSupabaseClient();
  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData.user) {
    throw new AuthException('You must be signed in to save payout details.');
  }

  const row =
    payout.kind === 'bank'
      ? {
          female_id: userData.user.id,
          method: 'bank',
          account_holder_name: payout.bank.holderName,
          account_number: payout.bank.accountNumber,
          ifsc_code: payout.bank.ifsc.toUpperCase(),
        }
      : {
          female_id: userData.user.id,
          method: 'upi',
          upi_id: payout.upiId,
        };

  const { error } = await client.from('payout_details').upsert(row, { onConflict: 'female_id' });
  if (error) {
    throw mapSupabaseError(error);
  }

  logger.info('authApi.savePayoutDetails saved', { kind: payout.kind });
}

/** Has the user passed the first-launch account-type selection? */
export function isOnboardingSeen(): boolean {
  return prefsStorage.getBool(PrefsKey.OnboardingSeen);
}

/** Mark the account-type selection as completed. */
export function markOnboardingSeen(): void {
  prefsStorage.setBool(PrefsKey.OnboardingSeen, true);
}
