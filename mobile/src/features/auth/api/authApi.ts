/**
 * Auth repository.
 *
 * All methods are async and return typed results — UI layers never touch
 * the Supabase client directly.
 *
 * DEV_MODE shortcuts (active when `USE_MOCK_DATA === true`):
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

import { USE_MOCK_DATA } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { AuthException, ValidationException } from '@core/network/apiException';
import { getSupabaseClient } from '@core/network/supabaseClient';
import { prefsStorage, PrefsKey } from '@core/storage/prefsStorage';
import { logger } from '@core/utils/logger';

import { useSessionStore } from '@store/sessionStore';

import { UserRole, VerificationStatus } from '@app-types/domain';

import { type PayoutDetails, useSignupDraftStore } from '../store/signupDraftStore';

export type AuthIntent = 'signup' | 'login' | 'forgotPassword';

const DEV_DELAY_MS = 600;
const DEV_FAIL_PASSWORD = 'wrong';

// ─── DEMO BUILD CREDENTIAL (frontend-only mock login) ────────────────────────
// Shared/offline DEV_MODE build: the ONE phone + password that signs in without
// a backend. Works for both male and female login. To restore the original
// "any non-empty password" dev behaviour, re-comment the gate in
// signInWithPasswordDev below.
const DEMO_PHONE = '9876543210';
const DEMO_PASSWORD = 'Qwerty@123';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Normalises a phone number to E.164. Supabase Auth and the backend store
 * phones as `+91…`; the signup/login forms collect a bare 10-digit number
 * (the `+91` is only a UI prefix). Assumes India when no country code is
 * present. Already-E.164 input is returned digits-only after the `+`.
 */
function toE164(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/\D/g, '');
  }
  return `+91${trimmed.replace(/\D/g, '').slice(-10)}`;
}

/**
 * Pulls the in-progress signup details from the draft store for the
 * `signInWithOtp` metadata. The backend `handle_new_user` trigger REQUIRES
 * name/age/role in `raw_user_meta_data` and aborts signup without them.
 */
function buildSignupMetadata(): { name: string; age: number; role: UserRole } {
  const { name, age, role } = useSignupDraftStore.getState();
  if (!name || age == null || !role) {
    throw new ValidationException('Missing signup details. Please restart signup.');
  }
  return { name, age, role };
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

/**
 * Sends a 6-digit OTP to the given mobile number.
 *
 * OTP delivery is ALWAYS real — it is NOT mocked by DEV_MODE. It runs through
 * Supabase Auth, so in local dev the code is delivered to the edge-runtime
 * docker logs (MSG91 is unset locally → `send-sms-hook` logs the code), and in
 * staging/production MSG91 sends the real SMS. DEV_MODE still mocks the other
 * (non-auth) feature APIs.
 */
export async function sendOtp(phone: string, intent: AuthIntent): Promise<void> {
  // Signup must carry name/age/role so the backend trigger can provision the
  // public.users + role-specific row. Login/forgot-password target an
  // existing user, so no metadata is sent.
  const options = intent === 'signup' ? { data: buildSignupMetadata() } : undefined;
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
 * IMPORTANT: This intentionally does NOT establish a persistent session.
 *   * Female signup: the user must reach the submitted screen and then
 *     log in fresh — verification status gates her access.
 *   * Male signup: session is pushed at end-of-onboarding by the calling
 *     screen, not here.
 *   * Forgot password: a short-lived recovery session is needed in
 *     production to call `auth.updateUser`. We return that session so the
 *     forgot-password new-password screen can use it without re-prompting.
 *
 * OTP verification is ALWAYS real — it is NOT mocked by DEV_MODE (the code
 * comes from the docker logs in dev, MSG91 in prod). The password-based login
 * path is what stays mocked under DEV_MODE via `signInWithPasswordDev`.
 */
export async function verifyOtp(
  phone: string,
  code: string,
  // Kept for call-site symmetry with sendOtp; the real verify uses type:'sms'
  // for every intent, so it is not branched on here.
  _intent: AuthIntent,
): Promise<Session | null> {
  // Supabase mobile OTPs use `type: 'sms'` for both signup and reset flows.
  // The reset semantics come from the subsequent `auth.updateUser` call.
  const { data, error } = await getSupabaseClient().auth.verifyOtp({
    phone: toE164(phone),
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
    if (last === '1') {
      status = VerificationStatus.Verified;
    } else if (last === '2') {
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

/** Sign in with phone + password. Returns the Session. */
export async function signInWithPassword(phone: string, password: string): Promise<Session> {
  if (USE_MOCK_DATA) {
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
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    phone: toE164(phone),
    password,
  });
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
  if (!USE_MOCK_DATA) {
    throw new Error('signInWithPasswordDev called outside DEV_MODE');
  }
  await sleep(DEV_DELAY_MS);
  if (!password) {
    throw new ValidationException('Enter your password', 'password');
  }

  // ─── DEMO BUILD GATE ───────────────────────────────────────────────────────
  // Only the single demo credential signs in. `phone` arrives already cleaned to
  // the last 10 digits by the login screens.
  const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
  if (cleanedPhone !== DEMO_PHONE || password !== DEMO_PASSWORD) {
    throw new AuthException('Incorrect phone number or password');
  }
  // ─── Original dev behaviour (any non-empty password except `wrong`) ──────────
  // Re-enable by uncommenting this block and commenting out the gate above.
  // if (password === DEV_FAIL_PASSWORD) {
  //   throw new AuthException('Incorrect password');
  // }

  const session = buildStubSession(role, phone);
  useSessionStore.getState().setSession(session);
  // A demo female should land verified so the full female experience is usable
  // offline (the availability toggle is gated on verification status).
  if (role === UserRole.Female) {
    useSessionStore.getState().setVerificationStatus(VerificationStatus.Verified);
  }
  return session;
}

/**
 * Sets the account password on the current session (created by verifyOtp).
 *
 * IDEMPOTENT: if the password already equals the desired value, Supabase
 * returns `same_password` (because `secure_password_change=true`). That means
 * the goal state is already met — we treat it as success, NOT an error. This
 * is why entering a valid OTP never surfaces "New password should be different
 * from the old password": re-running signup, or any duplicate set, is a no-op.
 */
export async function setInitialPassword(password: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await sleep(DEV_DELAY_MS);
    return;
  }
  const { error } = await getSupabaseClient().auth.updateUser({ password });
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === 'same_password' || /different from the old password/i.test(error.message)) {
      logger.debug('authApi.setInitialPassword: password already set (idempotent no-op)');
      return;
    }
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
  if (USE_MOCK_DATA) {
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
 * Uploads a verification selfie to the private `verification-photos` Storage
 * bucket (under the caller's own `{uid}/…` folder, enforced by storage RLS),
 * then calls the `verification-photo-submit` Edge Function which flips the
 * female's `verification_status` to `pending`. Returns the storage object
 * path. Requires an active session (signup leaves one after OTP verify).
 *
 * NOTE: gated on `USE_MOCK_DATA` ONLY — never `__DEV__`. A debug build
 * (`npm run ios`) has `__DEV__ === true`, so gating on it would mock the
 * upload even when pointed at a real backend.
 */
export async function submitVerificationPhoto(localPath: string): Promise<string> {
  if (USE_MOCK_DATA) {
    logger.debug('authApi.submitVerificationPhoto (DEV)', { localPath });
    await sleep(1500);
    return `dev://verification/${Date.now()}.jpg`;
  }

  const client = getSupabaseClient();
  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData.user) {
    throw new AuthException('You must be signed in to submit verification.');
  }
  const objectPath = `${userData.user.id}/selfie.jpg`;

  // RN-safe file read: fetch the URI as an ArrayBuffer. Blob upload is
  // unreliable on React Native; ArrayBuffer is the documented path. Pass
  // through file:// (real device capture) and http(s):// (the simulator's
  // sample-image fallback, since the iOS Simulator has no camera) as-is;
  // only a bare filesystem path needs the file:// prefix.
  const fileUri = /^(file|https?):\/\//.test(localPath) ? localPath : `file://${localPath}`;
  const arrayBuffer = await fetch(fileUri).then(res => res.arrayBuffer());

  const { error: uploadErr } = await client.storage
    .from('verification-photos')
    .upload(objectPath, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
  if (uploadErr) {
    throw mapSupabaseError(uploadErr);
  }

  const { error: submitErr } = await client.functions.invoke('verification-photo-submit', {
    body: { objectPath },
  });
  if (submitErr) {
    throw mapSupabaseError(submitErr);
  }

  logger.info('authApi.submitVerificationPhoto uploaded', { objectPath });
  return objectPath;
}

/**
 * Persists the female's payout method to `payout_details` during signup.
 * RLS allows a female to write only her own row. Upsert on `female_id` so a
 * re-entry (e.g. corrected details) updates rather than duplicates. Requires
 * an active session (signup leaves one after OTP verify).
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
