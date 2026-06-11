/**
 * Female home dashboard data.
 *
 * Production calls hit Supabase RPCs / tables. Until those are wired the
 * methods return empty/zero values — the UI renders its loading and empty
 * states correctly without any placeholder content.
 */
import { USE_MOCK_DATA } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import {
  type AppException,
  AuthException,
  ConflictException,
  ForbiddenException,
  UnknownAppException,
} from '@core/network/apiException';
import { getSupabaseClient } from '@core/network/supabaseClient';
import { logger } from '@core/utils/logger';

/**
 * Turns a `functions.invoke` error into a typed AppException by reading the
 * Edge Function's `{ ok:false, error:{ code, message } }` envelope (carried on
 * the FunctionsHttpError's `context` Response). Lets callers branch on the
 * real reason — e.g. CONFLICT = "add payout details before going online".
 */
async function appErrorFromInvoke(error: unknown): Promise<AppException> {
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = (await ctx.json()) as { error?: { code?: string; message?: string } };
      const code = body.error?.code;
      const message = body.error?.message;
      if (message) {
        if (code === 'CONFLICT') {
          return new ConflictException(message, error);
        }
        if (code === 'FORBIDDEN') {
          return new ForbiddenException(message, error);
        }
        return new UnknownAppException(message, ctx.status, error);
      }
    } catch {
      // Body wasn't the expected envelope — fall through to the generic mapper.
    }
  }
  return mapSupabaseError(error);
}

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
  if (USE_MOCK_DATA) {
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
  if (USE_MOCK_DATA) {
    return { online: devOnline, lastToggledAt: devLastToggledAt };
  }
  const client = getSupabaseClient();

  // MUST filter to the caller's own row. A female can now SELECT every
  // verified female (the `females_select_browseable` policy powers male
  // discovery + realtime), so an unfiltered `.single()` throws PGRST116
  // ("multiple rows") the moment a second verified female exists — which
  // rejected loadAll's Promise.all and left the availability toggle
  // permanently disabled. Column is `last_online_at` (no `last_toggled_at`).
  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    throw new AuthException('You must be signed in to read availability.');
  }

  const { data, error } = await client
    .from('females')
    .select('is_online, last_online_at')
    .eq('id', userId)
    .single();
  if (error) {
    logger.error('getAvailability failed', { userId, code: error.code, message: error.message });
    throw mapSupabaseError(error);
  }
  logger.debug('getAvailability ok', {
    userId,
    online: (data as { is_online?: boolean }).is_online,
  });
  return {
    online: Boolean((data as { is_online?: boolean }).is_online),
    lastToggledAt: new Date((data as { last_online_at?: string }).last_online_at ?? Date.now()),
  };
}

/**
 * Flip availability on or off via the `female-availability-toggle` Edge
 * Function — the authoritative path. It enforces the business rules (verified
 * + payout details present + not suspended) and stamps `last_online_at`.
 * A direct PostgREST update is intentionally NOT used: it referenced a
 * non-existent `last_toggled_at` column and `id='self'` (a literal string,
 * not the caller's UUID), so it always failed.
 */
export async function setAvailability(online: boolean): Promise<void> {
  if (USE_MOCK_DATA) {
    devOnline = online;
    devLastToggledAt = new Date();
    return;
  }
  logger.info('setAvailability: invoking female-availability-toggle', { online });
  const { error } = await getSupabaseClient().functions.invoke('female-availability-toggle', {
    body: { isOnline: online },
  });
  if (error) {
    const mapped = await appErrorFromInvoke(error);
    logger.warn('setAvailability: edge function rejected', { online, message: mapped.message });
    throw mapped;
  }
  logger.info('setAvailability: ok', { online });
}

/**
 * Proves the online female is still alive. Called on an interval by
 * `useAvailabilityHeartbeat` while she is online — the backend
 * `sweep_stale_online_females` cron takes her offline if these stop, so a
 * crashed/disconnected app no longer lingers as "online" on male discovery.
 * Best-effort: a single miss is tolerated by the grace window, so callers
 * swallow transient errors rather than surfacing them.
 */
export async function sendAvailabilityHeartbeat(): Promise<void> {
  if (USE_MOCK_DATA) {
    return;
  }
  const { error } = await getSupabaseClient().rpc('female_heartbeat');
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Last ~5 user-facing events for the Recent Activity feed. */
export async function getRecentActivity(): Promise<ReadonlyArray<RecentActivity>> {
  if (USE_MOCK_DATA) {
    return MOCK_ACTIVITIES();
  }
  const { data, error } = await getSupabaseClient().rpc('female_recent_activity', { limit_: 5 });
  if (error) {
    throw mapSupabaseError(error);
  }
  // The RPC returns JSON, so date/number fields arrive as strings — map them to
  // real types. Without this `occurredAt` is a string and the UI crashes on
  // `occurredAt.getTime()` (RecentActivityItem).
  const rows = (data ?? []) as ReadonlyArray<Record<string, unknown>>;
  return rows.map(row => ({
    id: String(row.id),
    kind: row.kind as RecentActivityKind,
    actorName: (row.actorName as string | null) ?? 'System',
    actorAvatarUrl: (row.actorAvatarUrl as string | null) ?? null,
    description: (row.description as string | null) ?? '',
    amountInr: row.amountInr != null ? Number(row.amountInr) : null,
    ratingValue: row.ratingValue != null ? Number(row.ratingValue) : null,
    occurredAt: new Date((row.occurredAt as string | number) ?? Date.now()),
  }));
}

/** Unread-notification count for the bell badge. */
export async function getUnreadNotificationCount(): Promise<number> {
  if (USE_MOCK_DATA) {
    return 3;
  }
  const { count, error } = await getSupabaseClient()
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);
  if (error) {
    throw mapSupabaseError(error);
  }
  return count ?? 0;
}
