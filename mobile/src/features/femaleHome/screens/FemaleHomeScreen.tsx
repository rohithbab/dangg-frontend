import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Card from '@core/components/Card';
import CoinIcon from '@core/components/CoinIcon';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { Env } from '@core/config/env';
import { AppException, ConflictException } from '@core/network/apiException';
import { getSupabaseClient } from '@core/network/supabaseClient';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import {
  useSessionStore,
  useVerificationStatus,
  parseVerificationStatus,
} from '@store/sessionStore';

import { VerificationStatus } from '@app-types/domain';

import {
  type Availability,
  type HomeStats,
  type RecentActivity,
  type Trend,
  getAvailability,
  getHomeStats,
  getRecentActivity,
  setAvailability,
} from '../api/femaleHomeApi';
import AvailabilityToggle from '../components/AvailabilityToggle';
import RecentActivityItem from '../components/RecentActivityItem';
import { useAvailabilityHeartbeat } from '../hooks/useAvailabilityHeartbeat';

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

function ChatsHeaderIcon(): React.ReactElement {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
        fill={AppColors.primaryDark}
      />
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
  const verificationStatus = useVerificationStatus();
  const isVerified = verificationStatus === VerificationStatus.Verified;

  const [stats, setStats] = useState<HomeStats | null>(null);
  const [availability, setAvailabilityState] = useState<Availability | null>(null);
  const [activity, setActivity] = useState<ReadonlyArray<RecentActivity>>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  // Keep her card on male discovery for as long as she is online + foregrounded.
  // Fires female_heartbeat() every 60s; the backend sweep only takes her offline
  // once these STOP (app backgrounded / closed / killed), within the grace window.
  // Without this the sweep dropped her ~3 min after toggling on.
  useAvailabilityHeartbeat(availability?.online === true);

  const loadAll = useCallback(async (): Promise<void> => {
    // allSettled (not Promise.all): each section loads independently so a
    // failure in stats/activity/notifications can never block `availability`
    // from being set — that would leave the "Available for chats" toggle
    // permanently disabled (disabled={availability === null || !isVerified}).
    const [s, a, r] = await Promise.allSettled([
      getHomeStats(),
      getAvailability(),
      getRecentActivity(),
    ]);
    if (s.status === 'fulfilled') {
      setStats(s.value);
    } else {
      logger.warn('FemaleHome: getHomeStats failed', s.reason);
    }
    if (a.status === 'fulfilled') {
      let availabilityVal = a.value;
      // In DEV_MODE, automatically toggle online on startup if verified and currently offline
      // so that she is immediately visible to the male user.
      if (Env.devMode && isVerified && !availabilityVal.online) {
        logger.info('DEV_MODE: Auto-toggling female availability to online');
        availabilityVal = { ...availabilityVal, online: true };
        setAvailability(true).catch(e => {
          logger.error('Failed to auto-toggle availability in DEV_MODE', e);
        });
      }
      setAvailabilityState(availabilityVal);
    } else {
      logger.error('FemaleHome: getAvailability failed — toggle will stay disabled', a.reason);
    }
    if (r.status === 'fulfilled') {
      setActivity(r.value);
    } else {
      logger.warn('FemaleHome: getRecentActivity failed', r.reason);
    }

    if (session?.user.id) {
      const { data: resData, error: verifyErr } = await getSupabaseClient()
        .from('females')
        .select('verification_status')
        .eq('id', session.user.id)
        .maybeSingle();
      if (!verifyErr && resData) {
        useSessionStore
          .getState()
          .setVerificationStatus(parseVerificationStatus(resData.verification_status));
      } else if (verifyErr) {
        logger.warn('FemaleHome: verification_status refresh failed', verifyErr.message);
      }
    }
  }, [session, isVerified]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const handleToggleAvailability = useCallback(
    (next: boolean): void => {
      logger.info('Availability toggle tapped', {
        next,
        toggling,
        isVerified,
        hasAvailability: availability !== null,
      });
      if (toggling) {
        logger.debug('Availability toggle ignored: request already in flight');
        return;
      }
      // Going online requires a verified account — the backend rejects it too
      // (female-availability-toggle). Ignore attempts to switch on when unverified.
      if (next && !isVerified) {
        logger.warn('Availability toggle ignored: cannot go online while unverified');
        return;
      }
      setToggling(true);
      const prev = availability;
      setAvailabilityState({ online: next, lastToggledAt: new Date() });
      setAvailability(next)
        .then(() => logger.info('Availability toggle committed', { next }))
        .catch(e => {
          // Missing payout details surfaces as a 409 ConflictException — show
          // the shake popup prompting her to add bank/UPI before going online.
          if (e instanceof ConflictException) {
            logger.warn('Availability toggle blocked: payout details missing');
            setNotice('Add payment details to go online');
          } else if (e instanceof AppException) {
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
    [availability, toggling, isVerified],
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
            accessibilityLabel="Chats"
            hitSlop={12}
            onPress={() => navigation.navigate('ChatsInbox')}
            style={styles.chatsButton}
          >
            <ChatsHeaderIcon />
          </Pressable>
        </View>

        {!isVerified ? <VerificationBanner status={verificationStatus} /> : null}

        <Card padding={AppSpacing.lg} containerStyle={styles.availabilityCard}>
          <View style={styles.availabilityHeader}>
            <Text style={styles.availabilityTitle}>Available for chats</Text>
            <AvailabilityToggle
              value={isVerified ? (availability?.online ?? false) : false}
              onValueChange={handleToggleAvailability}
              disabled={availability === null || !isVerified}
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
      <ShakeToast message={notice} onHide={clearNotice} />
    </SafeAreaView>
  );
}

/**
 * Small floating popup that shakes on appear and auto-dismisses. Used to nudge
 * the female (e.g. "add payment details to go online") without a blocking alert.
 */
function ShakeToast({
  message,
  onHide,
}: {
  message: string | null;
  onHide: () => void;
}): React.ReactElement | null {
  const tx = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!message) {
      return;
    }
    opacity.value = withTiming(1, { duration: 140 });
    tx.value = withSequence(
      withTiming(-8, { duration: 50, easing: Easing.linear }),
      withTiming(8, { duration: 50, easing: Easing.linear }),
      withTiming(-6, { duration: 50, easing: Easing.linear }),
      withTiming(6, { duration: 50, easing: Easing.linear }),
      withTiming(0, { duration: 50, easing: Easing.linear }),
    );
    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200 });
      setTimeout(onHide, 220);
    }, 2600);
    return () => clearTimeout(t);
  }, [message, onHide, opacity, tx]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: tx.value }],
  }));

  if (!message) {
    return null;
  }
  return (
    <Animated.View style={[styles.toast, style]} pointerEvents="none">
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
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

/**
 * Verification status banner shown on Home while the female is not yet
 * verified. Copy varies by status; admin approval flips her to 'verified'
 * (re-fetched on next session/refresh) and the banner disappears.
 */
function VerificationBanner({ status }: { status: VerificationStatus }): React.ReactElement {
  const pending = status === VerificationStatus.Pending;
  const rejected = status === VerificationStatus.Rejected;
  const title = pending
    ? 'Verification under review'
    : rejected
      ? 'Verification rejected'
      : 'Account not verified';
  const body = pending
    ? 'Our team is reviewing your photo. You can go online once it’s approved (usually within 2 days).'
    : rejected
      ? 'Your previous photo was rejected. Please re-submit a clear face photo to get verified.'
      : 'Submit a verification photo to get approved. You can go online and earn once verified.';
  return (
    <Card padding={AppSpacing.lg} containerStyle={styles.verifyBanner}>
      <Text style={styles.verifyTitle}>{title}</Text>
      <Text style={styles.verifyBody}>{body}</Text>
    </Card>
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
  chatsButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  greeting: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
  },
  subgreeting: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  toast: {
    position: 'absolute',
    top: AppSpacing.sm,
    left: AppSpacing.lg,
    right: AppSpacing.lg,
    backgroundColor: AppColors.primaryDark,
    paddingVertical: AppSpacing.sm,
    paddingHorizontal: AppSpacing.md,
    borderRadius: AppRadii.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  toastText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onPrimary,
    textAlign: 'center',
  },
  verifyBanner: {
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.lg,
    borderWidth: 1.5,
    borderColor: AppColors.error,
    backgroundColor: '#FDECEF',
    gap: AppSpacing.xs,
  },
  verifyTitle: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
  },
  verifyBody: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
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
