/**
 * Female home dashboard data.
 *
 * Production calls hit Supabase RPCs / tables. Until those are wired the
 * methods return empty/zero values — the UI renders its loading and empty
 * states correctly without any placeholder content.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

export type Trend = { kind: 'up' | 'down' | 'flat'; label: string };

export type HomeStats = {
  todayEarningsInr: number;
  weekEarningsInr: number;
  chatsToday: number;
  ratingAvg: number;
  ratingCount: number;
  todayTrend: Trend;
  weekTrend: Trend;
};

export type Availability = {
  online: boolean;
  lastToggledAt: Date;
};

export type RecentActivityKind = 'chatCompleted' | 'paymentReceived' | 'ratingReceived';

export type RecentActivity = {
  id: string;
  kind: RecentActivityKind;
  actorName: string;
  actorAvatarUrl: string | null;
  description: string;
  amountInr: number | null;
  ratingValue: number | null;
  occurredAt: Date;
};

let devOnline = true;
let devLastToggledAt = new Date();

const MOCK_STATS: HomeStats = {
  todayEarningsInr: 2400,
  weekEarningsInr: 15800,
  chatsToday: 12,
  ratingAvg: 4.85,
  ratingCount: 34,
  todayTrend: { kind: 'up', label: '+20% vs yesterday' },
  weekTrend: { kind: 'up', label: '+15% vs last week' },
};

const MOCK_ACTIVITIES = (): RecentActivity[] => [
  {
    id: 'activity-1',
    kind: 'chatCompleted',
    actorName: 'Rahul',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    description: 'Chat completed (25 mins)',
    amountInr: 300,
    ratingValue: null,
    occurredAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
  },
  {
    id: 'activity-2',
    kind: 'ratingReceived',
    actorName: 'Amit',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    description: 'Rated you 5 stars',
    amountInr: null,
    ratingValue: 5,
    occurredAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
  },
  {
    id: 'activity-3',
    kind: 'paymentReceived',
    actorName: 'System',
    actorAvatarUrl: null,
    description: 'Weekly payout processed',
    amountInr: 4200,
    ratingValue: null,
    occurredAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    id: 'activity-4',
    kind: 'chatCompleted',
    actorName: 'Vikram',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    description: 'Chat completed (10 mins)',
    amountInr: 120,
    ratingValue: null,
    occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
];

/** Aggregated stats for the Home dashboard cards. */
export async function getHomeStats(): Promise<HomeStats> {
  if (Env.devMode) {
    return MOCK_STATS;
  }
  const { data, error } = await getSupabaseClient().rpc('female_home_stats');
  if (error) {
    throw mapSupabaseError(error);
  }
  return data as HomeStats;
}

/** Current availability flag + when the user last toggled it. */
export async function getAvailability(): Promise<Availability> {
  if (Env.devMode) {
    return { online: devOnline, lastToggledAt: devLastToggledAt };
  }
  const { data, error } = await getSupabaseClient()
    .from('females')
    .select('is_online, last_toggled_at')
    .single();
  if (error) {
    throw mapSupabaseError(error);
  }
  return {
    online: Boolean((data as { is_online?: boolean }).is_online),
    lastToggledAt: new Date((data as { last_toggled_at?: string }).last_toggled_at ?? Date.now()),
  };
}

/** Flip availability on or off. Optimistic UI updates the toggle immediately. */
export async function setAvailability(online: boolean): Promise<void> {
  if (Env.devMode) {
    devOnline = online;
    devLastToggledAt = new Date();
    return;
  }
  const { error } = await getSupabaseClient()
    .from('females')
    .update({ is_online: online, last_toggled_at: new Date().toISOString() })
    .eq('id', 'self');
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Last ~5 user-facing events for the Recent Activity feed. */
export async function getRecentActivity(): Promise<ReadonlyArray<RecentActivity>> {
  if (Env.devMode) {
    return MOCK_ACTIVITIES();
  }
  const { data, error } = await getSupabaseClient().rpc('female_recent_activity', { limit_: 5 });
  if (error) {
    throw mapSupabaseError(error);
  }
  return data as RecentActivity[];
}

/** Unread-notification count for the bell badge. */
export async function getUnreadNotificationCount(): Promise<number> {
  if (Env.devMode) {
    return 3;
  }
  const { count, error } = await getSupabaseClient()
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('read', false);
  if (error) {
    throw mapSupabaseError(error);
  }
  return count ?? 0;
}
