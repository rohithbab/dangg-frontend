import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Card from '@core/components/Card';
import CoinIcon from '@core/components/CoinIcon';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import { useSessionStore } from '@store/sessionStore';

import {
  type Availability,
  type HomeStats,
  type RecentActivity,
  type Trend,
  getAvailability,
  getHomeStats,
  getRecentActivity,
  getUnreadNotificationCount,
  setAvailability,
} from '../api/femaleHomeApi';
import AvailabilityToggle from '../components/AvailabilityToggle';
import RecentActivityItem from '../components/RecentActivityItem';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList>;

function relativeOnline(date: Date): string {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `${hours}h ${remMin}m`;
}

function firstNameFromSession(fullName: string | undefined): string {
  if (!fullName) {
    return 'there';
  }
  return fullName.split(/\s+/)[0] ?? fullName;
}

function trendColor(trend: Trend): string {
  if (trend.kind === 'up') {
    return AppColors.success;
  }
  if (trend.kind === 'down') {
    return AppColors.error;
  }
  return AppColors.onSurfaceMuted;
}

type IconColor = string;

function ChatIcon({ color }: { color: IconColor }): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
        fill={color}
      />
    </Svg>
  );
}

function StarIcon({ color }: { color: IconColor }): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={color}
      />
    </Svg>
  );
}

function BellIcon({ withDot }: { withDot: boolean }): React.ReactElement {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
        fill={AppColors.primaryDark}
      />
      {withDot ? <Circle cx={18} cy={6} r={4} fill={AppColors.error} /> : null}
    </Svg>
  );
}

/**
 * Female Home — the default tab after login. Greeting header, availability
 * toggle, 2×2 stats grid, recent activity feed. Pull-to-refresh re-fetches
 * everything in parallel.
 */
function FemaleHomeScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const session = useSessionStore(s => s.session);
  const firstName = firstNameFromSession(session?.user.user_metadata?.name);

  const [stats, setStats] = useState<HomeStats | null>(null);
  const [availability, setAvailabilityState] = useState<Availability | null>(null);
  const [activity, setActivity] = useState<ReadonlyArray<RecentActivity>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const loadAll = useCallback(async (): Promise<void> => {
    try {
      const [s, a, r, u] = await Promise.all([
        getHomeStats(),
        getAvailability(),
        getRecentActivity(),
        getUnreadNotificationCount(),
      ]);
      setStats(s);
      setAvailabilityState(a);
      setActivity(r);
      setUnreadCount(u);
    } catch (e) {
      logger.error('FemaleHomeScreen.loadAll failed', e);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      void getUnreadNotificationCount()
        .then(setUnreadCount)
        .catch(() => undefined);
    }, []),
  );

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const handleToggleAvailability = useCallback(
    (next: boolean): void => {
      if (toggling) {
        return;
      }
      setToggling(true);
      const prev = availability;
      setAvailabilityState({ online: next, lastToggledAt: new Date() });
      setAvailability(next)
        .catch(e => {
          if (e instanceof AppException) {
            logger.warn('Availability toggle failed', e.message);
          } else {
            logger.error('Availability toggle failed', e);
          }
          if (prev) {
            setAvailabilityState(prev);
          }
        })
        .finally(() => setToggling(false));
    },
    [availability, toggling],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{`Hi, ${firstName}!`}</Text>
            <Text style={styles.subgreeting}>Welcome back</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={12}
            onPress={() => navigation.navigate('Notifications')}
            style={styles.bellWrap}
          >
            <BellIcon withDot={unreadCount > 0} />
          </Pressable>
        </View>

        <Card padding={AppSpacing.lg} containerStyle={styles.availabilityCard}>
          <View style={styles.availabilityHeader}>
            <Text style={styles.availabilityTitle}>Available for chats</Text>
            <AvailabilityToggle
              value={availability?.online ?? false}
              onValueChange={handleToggleAvailability}
              disabled={availability === null}
            />
          </View>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: availability?.online
                    ? AppColors.onlineGreen
                    : AppColors.offlineGray,
                },
              ]}
            />
            <Text style={styles.statusText}>
              {availability?.online ? 'You are online and visible' : 'You are offline'}
            </Text>
          </View>
          {availability ? (
            <Text style={styles.lastToggled}>
              {availability.online
                ? `Online since ${relativeOnline(availability.lastToggledAt)}`
                : `Last online ${relativeOnline(availability.lastToggledAt)}`}
            </Text>
          ) : null}
        </Card>

        <View style={styles.statsGrid}>
          <StatCell
            label="Today's Earnings"
            value={stats ? stats.todayEarningsInr.toLocaleString() : '—'}
            trend={stats?.todayTrend ?? null}
            renderIcon={() => <CoinIcon size={20} />}
          />
          <StatCell
            label="This Week"
            value={stats ? stats.weekEarningsInr.toLocaleString() : '—'}
            trend={stats?.weekTrend ?? null}
            renderIcon={() => <CoinIcon size={20} />}
          />
          <StatCell
            label="Chats Today"
            value={stats ? String(stats.chatsToday) : '—'}
            trend={null}
            renderIcon={c => <ChatIcon color={c} />}
          />
          <StatCell
            label="Rating"
            value={stats ? stats.ratingAvg.toFixed(1) : '—'}
            trend={null}
            footnote={stats ? `from ${stats.ratingCount} chats` : undefined}
            renderIcon={c => <StarIcon color={c} />}
          />
        </View>

        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Pressable hitSlop={8} accessibilityRole="link" onPress={() => undefined}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {activity.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <ChatIcon color={AppColors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyBody}>
              Turn on availability to start receiving chat requests.
            </Text>
          </View>
        ) : (
          <Card padding={0} containerStyle={styles.activityCard}>
            {activity.slice(0, 5).map((item, idx) => (
              <View
                key={item.id}
                style={idx < activity.length - 1 ? styles.activityRow : undefined}
              >
                <RecentActivityItem item={item} />
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type StatCellProps = {
  label: string;
  value: string;
  trend: Trend | null;
  footnote?: string;
  renderIcon: (color: string) => React.ReactElement;
};

function StatCell({
  label,
  value,
  trend,
  footnote,
  renderIcon,
}: StatCellProps): React.ReactElement {
  return (
    <View style={styles.statCell}>
      <View style={styles.statIcon}>{renderIcon(AppColors.primary)}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend ? (
        <Text style={[styles.statTrend, { color: trendColor(trend) }]}>{trend.label}</Text>
      ) : null}
      {footnote ? <Text style={styles.statFootnote}>{footnote}</Text> : null}
    </View>
  );
}

const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + FAB_PROTRUSION + AppSpacing.lg;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: { paddingBottom: BOTTOM_CLEAR },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.md,
  },
  headerText: { flex: 1 },
  greeting: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
  },
  subgreeting: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  bellWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityCard: {
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.lg,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityTitle: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
    flex: 1,
    marginRight: AppSpacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm,
    marginTop: AppSpacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
  },
  lastToggled: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.lg,
    rowGap: AppSpacing.sm,
  },
  statCell: {
    width: '48.5%',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.md,
    padding: AppSpacing.md,
    borderWidth: 1.5,
    borderColor: AppColors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: { marginBottom: AppSpacing.sm },
  statValue: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
  },
  statLabel: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  statTrend: {
    ...AppTypography.labelSmall,
    marginTop: 4,
  },
  statFootnote: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.lg,
    marginBottom: AppSpacing.sm,
  },
  sectionTitle: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
  },
  seeAll: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
  },
  activityCard: {
    marginHorizontal: AppSpacing.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: AppColors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  activityRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppColors.divider,
  },
  empty: {
    alignItems: 'center',
    marginHorizontal: AppSpacing.lg,
    marginTop: AppSpacing.lg,
    padding: AppSpacing.lg,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.md,
  },
  emptyBody: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
  },
});

export default FemaleHomeScreen;
