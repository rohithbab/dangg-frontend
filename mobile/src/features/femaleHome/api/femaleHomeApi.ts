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

const EMPTY_STATS: HomeStats = {
  todayEarningsInr: 0,
  weekEarningsInr: 0,
  chatsToday: 0,
  ratingAvg: 0,
  ratingCount: 0,
  todayTrend: { kind: 'flat', label: '' },
  weekTrend: { kind: 'flat', label: '' },
};

/** Aggregated stats for the Home dashboard cards. */
export async function getHomeStats(): Promise<HomeStats> {
  if (Env.devMode) {
    return EMPTY_STATS;
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
    return { online: false, lastToggledAt: new Date() };
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
    return [];
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
    return 0;
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
