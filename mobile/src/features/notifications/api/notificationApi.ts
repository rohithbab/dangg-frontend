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

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    kind: 'chatRequest',
    title: 'Incoming Chat Request',
    body: 'Amit sent you a chat request. Accept now to start earning!',
    read: false,
    occurredAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
  },
  {
    id: 'notif-2',
    kind: 'paymentReceived',
    title: 'Payout Cleared',
    body: 'Your weekly payout of ₹4,200 has been transferred to aanya@okaxis.',
    read: false,
    occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: 'notif-3',
    kind: 'verificationUpdate',
    title: 'Profile Verified',
    body: 'Congratulations! Your profile verification has been approved. You are now live!',
    read: false,
    occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: 'notif-4',
    kind: 'system',
    title: 'Welcome to Dangg',
    body: 'Start your journey on Dangg. Go online to connect with paying users.',
    read: true,
    occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
];

/** Returns all notifications, newest first. */
export async function listNotifications(): Promise<ReadonlyArray<AppNotification>> {
  if (Env.devMode) {
    return [...MOCK_NOTIFICATIONS].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
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
    const found = MOCK_NOTIFICATIONS.find(n => n.id === id);
    if (found) {
      found.read = true;
    }
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
    MOCK_NOTIFICATIONS.forEach(n => {
      n.read = true;
    });
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
