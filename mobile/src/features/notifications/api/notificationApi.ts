/**
 * Notifications inbox API. Empty until the backend is wired.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

export type NotificationKind = 'chatRequest' | 'paymentReceived' | 'verificationUpdate' | 'system';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  occurredAt: Date;
};

/** Returns all notifications, newest first. */
export async function listNotifications(): Promise<ReadonlyArray<AppNotification>> {
  if (Env.devMode) {
    return [];
  }
  const { data, error } = await getSupabaseClient()
    .from('notifications')
    .select('*')
    .order('occurred_at', { ascending: false });
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data ?? []) as AppNotification[];
}

/** Mark a single notification as read (optimistic). */
export async function markRead(id: string): Promise<void> {
  if (Env.devMode) {
    return;
  }
  const { error } = await getSupabaseClient()
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Mark every unread notification as read. */
export async function markAllRead(): Promise<void> {
  if (Env.devMode) {
    return;
  }
  const { error } = await getSupabaseClient()
    .from('notifications')
    .update({ read: true })
    .eq('read', false);
  if (error) {
    throw mapSupabaseError(error);
  }
}
