/**
 * Profile data + avatar lifecycle.
 *
 * Avatars are uploaded directly to Cloudflare R2 via the `media-sign` edge
 * function (category=profile → users/profile-images/{uid}/…) and served from
 * media.dangg.app. Password change delegates to `authApi`.
 */
import { USE_MOCK_DATA } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { AuthException } from '@core/network/apiException';
import { uploadToR2 } from '@core/network/mediaService';
import { getSupabaseClient } from '@core/network/supabaseClient';

import { useSessionStore } from '@store/sessionStore';

const AVATAR_BUCKET = 'users';

export type Profile = {
  name: string;
  maskedPhone: string;
  avatarUrl: string | null;
  verified: boolean;
  ratingAvg: number;
  totalChats: number;
  daysActive: number;
  /** Editable on the Edit Profile screen (users.age). */
  age: number | null;
  /** Editable bio — females only (females.bio); null for males. */
  bio: string | null;
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
      age: 24,
      bio: 'Loves slow conversations about books & long train rides.',
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
      age: 27,
      bio: null,
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
    .select('name, phone, profile_picture_url, role, created_at, age')
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
    age: number | null;
  };

  // Role-specific stats come from the matching table.
  let verified = false;
  let ratingAvg = 0;
  let totalChats = 0;
  let bio: string | null = null;
  if (user.role === 'female') {
    // Filter to the caller's own row: a female can SELECT every verified
    // female (females_select_browseable powers male discovery), so an
    // unfiltered `.single()` throws once a second verified female exists.
    const { data: f } = await client
      .from('females')
      .select('verification_status, rating_avg, total_chats, bio')
      .eq('id', userId)
      .single();
    const fr = f as {
      verification_status?: string;
      rating_avg?: number;
      total_chats?: number;
      bio?: string | null;
    } | null;
    verified = fr?.verification_status === 'verified';
    ratingAvg = fr?.rating_avg ?? 0;
    totalChats = fr?.total_chats ?? 0;
    bio = fr?.bio ?? null;
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
    age: user.age,
    bio,
  };
}

/**
 * Uploads a new avatar directly to Cloudflare R2 via `media-sign`
 * (category=profile → users/profile-images/{uid}/…) and saves the public URL
 * (https://media.dangg.app/…) on `users.profile_picture_url`.
 */
export async function updateAvatar(localPath: string): Promise<string> {
  if (USE_MOCK_DATA) {
    return localPath;
  }
  const userId = useSessionStore.getState().session?.user.id;
  if (!userId) {
    throw new AuthException('You must be signed in to update your photo.');
  }

  const { publicUrl, objectKey } = await uploadToR2('profile', localPath);
  const url = publicUrl ?? objectKey;

  const client = getSupabaseClient();
  const { error } = await client
    .from('users')
    .update({ profile_picture_url: url })
    .eq('id', userId);
  if (error) {
    throw mapSupabaseError(error);
  }
  return url;
}

/** Clears the avatar — removes the stored object and nulls the DB field. */
export async function removeAvatar(): Promise<void> {
  if (USE_MOCK_DATA) {
    return;
  }
  const client = getSupabaseClient();
  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData.user) {
    throw mapSupabaseError(userErr ?? new Error('You must be signed in'));
  }
  const userId = userData.user.id;

  const { data: row } = await client
    .from('users')
    .select('profile_picture_url')
    .eq('id', userId)
    .maybeSingle();
  const currentUrl = (row?.profile_picture_url as string | null) ?? null;
  const marker = `/object/public/${AVATAR_BUCKET}/`;
  if (currentUrl?.includes(marker)) {
    const objectName = currentUrl.slice(currentUrl.indexOf(marker) + marker.length);
    if (objectName.startsWith(`profile-images/${userId}/`)) {
      await client.storage.from(AVATAR_BUCKET).remove([objectName]);
    }
  }

  const { error } = await client
    .from('users')
    .update({ profile_picture_url: null })
    .eq('id', userId);
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
 * Permanently deletes the user's account, then clears the session so the app
 * routes back to the auth flow. The user already passed the typed-phrase gate
 * and is authenticated — the app is OTP-only, so there is no password re-auth.
 * In dev mode this is a stub that only clears the session.
 */
export async function deleteAccount(): Promise<void> {
  if (USE_MOCK_DATA) {
    useSessionStore.getState().clear();
    return;
  }
  const { error } = await getSupabaseClient().rpc('delete_self_account');
  if (error) {
    throw mapSupabaseError(error);
  }
  useSessionStore.getState().clear();
}

/** Updates the user's name on public.users. */
export async function updateProfile(updates: {
  name: string;
  age?: number | null;
  /** Female-only; when provided, written to females.bio. */
  bio?: string | null;
}): Promise<void> {
  if (USE_MOCK_DATA) {
    return;
  }
  const client = getSupabaseClient();
  const userId = useSessionStore.getState().session?.user.id;
  if (!userId) {
    throw new Error('Not authenticated');
  }
  const userPatch: { name: string; age?: number } = { name: updates.name };
  if (typeof updates.age === 'number') {
    userPatch.age = updates.age;
  }
  const { error } = await client.from('users').update(userPatch).eq('id', userId);
  if (error) {
    throw mapSupabaseError(error);
  }
  // Bio lives on the females row; only patch it when the caller passed one.
  if (updates.bio !== undefined) {
    const { error: bioErr } = await client
      .from('females')
      .update({ bio: updates.bio })
      .eq('id', userId);
    if (bioErr) {
      throw mapSupabaseError(bioErr);
    }
  }
}
