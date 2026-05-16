/**
 * Profile data + avatar lifecycle.
 *
 * Avatar uploads go through Cloudinary in production; DEV builds return a
 * stub URL so the local pick-and-display path still works. Password change
 * delegates to `authApi`.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { AppException, AuthException } from '@core/network/apiException';
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

function maskPhone(phone: string): string {
  const cleaned = phone.replace(/^\+?91/, '').replace(/\s/g, '');
  if (cleaned.length < 4) {
    return '+91 ••••• •••••';
  }
  return `+91 ••••• ••${cleaned.slice(-3)}`;
}

/** Empty-but-valid Profile, populated from the active session where possible. */
function emptyProfile(): Profile {
  const session = useSessionStore.getState().session;
  const name = (session?.user.user_metadata?.name as string | undefined) ?? '';
  const phone = session?.user.phone ?? '';
  return {
    name,
    maskedPhone: phone ? maskPhone(phone) : '',
    avatarUrl: null,
    verified: false,
    ratingAvg: 0,
    totalChats: 0,
    daysActive: 0,
  };
}

/** Returns the logged-in user's profile snapshot. */
export async function getProfile(): Promise<Profile> {
  if (Env.devMode) {
    return emptyProfile();
  }
  const { data, error } = await getSupabaseClient().from('females').select('*').single();
  if (error) {
    throw mapSupabaseError(error);
  }
  const row = data as {
    name: string;
    phone: string;
    avatar_url: string | null;
    verification_status: string;
    rating_avg: number | null;
    total_chats: number | null;
    days_active: number | null;
  };
  return {
    name: row.name,
    maskedPhone: maskPhone(row.phone),
    avatarUrl: row.avatar_url,
    verified: row.verification_status === 'verified',
    ratingAvg: row.rating_avg ?? 0,
    totalChats: row.total_chats ?? 0,
    daysActive: row.days_active ?? 0,
  };
}

/** Uploads a new avatar image. Returns the public URL stored on the profile. */
export async function updateAvatar(localPath: string): Promise<string> {
  if (Env.devMode) {
    // Local preview only — the chosen file URI is echoed back so the UI can
    // show what the user picked. No upload happens.
    return localPath;
  }
  throw new AppException('SERVER', 'Avatar upload requires backend wiring');
}

/** Clears the avatar URL. */
export async function removeAvatar(): Promise<void> {
  if (Env.devMode) {
    return;
  }
  const { error } = await getSupabaseClient()
    .from('females')
    .update({ avatar_url: null })
    .eq('id', 'self');
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Updates the user's password. */
export async function changePassword(current: string, next: string): Promise<void> {
  if (Env.devMode) {
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

/** Signs the user out and clears the session store. */
export async function signOut(): Promise<void> {
  if (Env.devMode) {
    useSessionStore.getState().clear();
    return;
  }
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) {
    throw mapSupabaseError(error);
  }
  useSessionStore.getState().clear();
}
