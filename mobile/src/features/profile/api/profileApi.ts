/**
 * Profile data + avatar lifecycle.
 *
 * Avatar uploads go through Cloudinary in production; DEV builds return a
 * stub URL so the local pick-and-display path still works. Password change
 * delegates to `authApi`.
 */
import { USE_MOCK_DATA } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { AuthException } from '@core/network/apiException';
import { uploadToR2 } from '@core/network/mediaService';
import { getSupabaseClient } from '@core/network/supabaseClient';

import { useSessionStore } from '@store/sessionStore';

export type Profile = {
  name: string;
  maskedPhone: string;
  avatarUrl: string | null;
  verified: boolean;
  ratingAvg: number;
  totalChats: number;
  daysActive: number;
};

function maskPhone(phone: string | null | undefined): string {
  const cleaned = (phone ?? '').replace(/^\+?91/, '').replace(/\s/g, '');
  if (cleaned.length < 4) {
    return '+91 ••••• •••••';
  }
  return `+91 ••••• ••${cleaned.slice(-3)}`;
}

/** Empty-but-valid Profile, populated from the active session where possible. */
function emptyProfile(): Profile {
  const session = useSessionStore.getState().session;
  const role = useSessionStore.getState().role;
  const name = (session?.user.user_metadata?.name as string | undefined) ?? '';
  const phone = session?.user.phone ?? '';

  if (role === 'female') {
    return {
      name: name || 'Aanya Sharma',
      maskedPhone: phone ? maskPhone(phone) : '+91 ••••• ••456',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      verified: true,
      ratingAvg: 4.85,
      totalChats: 142,
      daysActive: 18,
    };
  } else {
    return {
      name: name || 'Amit Patel',
      maskedPhone: phone ? maskPhone(phone) : '+91 ••••• ••987',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      verified: false,
      ratingAvg: 0,
      totalChats: 0,
      daysActive: 5,
    };
  }
}

/** Returns the logged-in user's profile snapshot. */
export async function getProfile(): Promise<Profile> {
  if (USE_MOCK_DATA) {
    return emptyProfile();
  }
  const client = getSupabaseClient();

  const userId = useSessionStore.getState().session?.user.id;
  if (!userId) {
    throw new Error('Not authenticated');
  }

  // Shared fields live on `public.users` (name/phone/avatar/role/created_at) —
  // NOT on `females`/`males`. RLS scopes the row to the caller.
  const { data: userData, error: userErr } = await client
    .from('users')
    .select('name, phone, profile_picture_url, role, created_at')
    .eq('id', userId)
    .single();
  if (userErr) {
    throw mapSupabaseError(userErr);
  }
  const user = userData as {
    name: string;
    phone: string | null;
    profile_picture_url: string | null;
    role: 'female' | 'male';
    created_at: string;
  };

  // Role-specific stats come from the matching table.
  let verified = false;
  let ratingAvg = 0;
  let totalChats = 0;
  if (user.role === 'female') {
    // Filter to the caller's own row: a female can SELECT every verified
    // female (females_select_browseable powers male discovery), so an
    // unfiltered `.single()` throws once a second verified female exists.
    const { data: f } = await client
      .from('females')
      .select('verification_status, rating_avg, total_chats')
      .eq('id', userId)
      .single();
    const fr = f as {
      verification_status?: string;
      rating_avg?: number;
      total_chats?: number;
    } | null;
    verified = fr?.verification_status === 'verified';
    ratingAvg = fr?.rating_avg ?? 0;
    totalChats = fr?.total_chats ?? 0;
  } else {
    const { data: m } = await client.from('males').select('chats_initiated').single();
    totalChats = (m as { chats_initiated?: number } | null)?.chats_initiated ?? 0;
  }

  const daysActive = Math.max(
    0,
    Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86_400_000),
  );

  return {
    name: user.name,
    maskedPhone: maskPhone(user.phone),
    avatarUrl: user.profile_picture_url,
    verified,
    ratingAvg,
    totalChats,
    daysActive,
  };
}

/**
 * Uploads a new avatar to Cloudflare R2 (via media-sign) and saves its URL on
 * `users.profile_picture_url`. Returns the stored URL.
 *
 * NOTE: profile images are public, so the rendered URL needs R2 public access
 * configured (`R2_PUBLIC_BASE_URL` → r2.dev / custom domain). Until that's set,
 * `publicUrl` is null and we store the object key — the upload succeeds but the
 * image won't render until the public base URL exists.
 */
export async function updateAvatar(localPath: string): Promise<string> {
  if (USE_MOCK_DATA) {
    // Local preview only — the chosen file URI is echoed back so the UI can
    // show what the user picked. No upload happens.
    return localPath;
  }
  const client = getSupabaseClient();
  const userId = useSessionStore.getState().session?.user.id;
  if (!userId) {
    throw new AuthException('You must be signed in to update your photo.');
  }

  const { objectKey, publicUrl } = await uploadToR2('profile', localPath);
  const url = publicUrl ?? objectKey;

  const { error } = await client
    .from('users')
    .update({ profile_picture_url: url })
    .eq('id', userId);
  if (error) {
    throw mapSupabaseError(error);
  }
  return url;
}

/** Clears the avatar URL. The avatar lives on `users.profile_picture_url`. */
export async function removeAvatar(): Promise<void> {
  if (USE_MOCK_DATA) {
    return;
  }
  const client = getSupabaseClient();
  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData.user) {
    throw mapSupabaseError(userErr ?? new Error('You must be signed in'));
  }
  const { error } = await client
    .from('users')
    .update({ profile_picture_url: null })
    .eq('id', userData.user.id);
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Updates the user's password. */
export async function changePassword(current: string, next: string): Promise<void> {
  if (USE_MOCK_DATA) {
    if (!current) {
      throw new AuthException('Current password is required');
    }
    if (!next) {
      throw new AuthException('New password is required');
    }
    return;
  }
  const { error: verifyErr } = await getSupabaseClient().rpc('verify_current_password', {
    current_password: current,
  });
  if (verifyErr) {
    throw mapSupabaseError(verifyErr);
  }
  const { error } = await getSupabaseClient().auth.updateUser({ password: next });
  if (error) {
    throw mapSupabaseError(error);
  }
}

/**
 * True when a Supabase error just means "there's no session to revoke" — the
 * user is effectively already signed out. supabase-js surfaces this as
 * `AuthSessionMissingError` ("Auth session missing!") e.g. after the refresh
 * token expired or the session was already cleared.
 */
function isAuthSessionMissing(error: unknown): boolean {
  const e = error as { name?: string; code?: string; message?: string } | null;
  if (!e) {
    return false;
  }
  return (
    e.name === 'AuthSessionMissingError' ||
    e.code === 'session_not_found' ||
    /auth session missing|session\s*(missing|not\s*found)/i.test(e.message ?? '')
  );
}

/**
 * Signs the user out and clears the session store.
 *
 * IDEMPOTENT: a missing session ("Auth session missing!") means the desired
 * end state — signed out — is already met, so we treat it as success instead
 * of failing the logout. The local session store is cleared in `finally` no
 * matter what, so the app always returns to the auth flow: clearing local
 * state can't fail, and the user explicitly asked to log out.
 */
export async function signOut(): Promise<void> {
  if (USE_MOCK_DATA) {
    useSessionStore.getState().clear();
    return;
  }
  try {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error && !isAuthSessionMissing(error)) {
      throw mapSupabaseError(error);
    }
  } finally {
    useSessionStore.getState().clear();
  }
}

/**
 * Permanently deletes the user's account. Re-auths with the supplied password
 * first; on success, clears the session and routes the app back to the auth
 * flow. In dev mode this is a stub that only clears the session.
 */
export async function deleteAccount(password: string): Promise<void> {
  if (USE_MOCK_DATA) {
    if (!password) {
      throw new AuthException('Password is required to delete your account');
    }
    useSessionStore.getState().clear();
    return;
  }
  const { error: verifyErr } = await getSupabaseClient().rpc('verify_current_password', {
    current_password: password,
  });
  if (verifyErr) {
    throw mapSupabaseError(verifyErr);
  }
  const { error } = await getSupabaseClient().rpc('delete_self_account');
  if (error) {
    throw mapSupabaseError(error);
  }
  useSessionStore.getState().clear();
}

/** Updates the user's name on public.users. */
export async function updateProfile(updates: { name: string }): Promise<void> {
  if (USE_MOCK_DATA) {
    return;
  }
  const client = getSupabaseClient();
  const userId = useSessionStore.getState().session?.user.id;
  if (!userId) {
    throw new Error('Not authenticated');
  }
  const { error } = await client.from('users').update({ name: updates.name }).eq('id', userId);
  if (error) {
    throw mapSupabaseError(error);
  }
}
