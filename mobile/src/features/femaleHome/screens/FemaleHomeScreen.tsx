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

import { AppTypography } from '@theme/typography';

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
import { FC, FGradient, FR, FS, FShadow } from '../femaleTheme';
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

function mixHexColor(a: string, b: string, amount: number): string {
  const parse = (hex: string) =>
    [1, 3, 5].map(pos => Number.parseInt(hex.slice(pos, pos + 2), 16));
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * amount);
  return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function GradientGreetingName({ name }: { name: string }): React.ReactElement {
  const letters = Array.from(name);
  const denominator = Math.max(letters.length - 1, 1);
  return (
    <Text>
      {letters.map((letter, index) => (
        <Text
          key={`${letter}-${index}`}
          style={{ color: mixHexColor(FGradient[0], FGradient[1], index / denominator) }}
        >
          {letter}
        </Text>
      ))}
    </Text>
  );
}

function trendColor(trend: Trend): string {
  if (trend.kind === 'up') {
    return FC.success;
  }
  if (trend.kind === 'down') {
    return FC.error;
  }
  return FC.textDim;
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
        fill={FC.primary}
      />
    </Svg>
  );
}

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

  useAvailabilityHeartbeat(availability?.online === true);

  const loadAll = useCallback(async (): Promise<void> => {
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
            tintColor={FC.primary}
            colors={[FC.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              Hi, <GradientGreetingName name={firstName} />!
            </Text>
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

        <View
          style={[
            styles.availabilityCard,
            availability?.online ? styles.availabilityCardOnline : null,
          ]}
        >
          <View style={styles.availabilityInner}>
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
                      ? FC.onlineGreen
                      : FC.offlineGray,
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
          </View>
        </View>

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
        </View>

        {activity.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <ChatIcon color={FC.primary} />
            </View>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyBody}>
              Turn on availability to start receiving chat requests.
            </Text>
          </View>
        ) : (
          <View style={styles.activityCard}>
            {activity.slice(0, 5).map((item, idx) => (
              <View
                key={item.id}
                style={idx < activity.length - 1 ? styles.activityRow : undefined}
              >
                <RecentActivityItem item={item} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <ShakeToast message={notice} onHide={clearNotice} />
    </SafeAreaView>
  );
}

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
      <View style={styles.statIcon}>{renderIcon(FC.primary)}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend ? (
        <Text style={[styles.statTrend, { color: trendColor(trend) }]}>{trend.label}</Text>
      ) : null}
      {footnote ? <Text style={styles.statFootnote}>{footnote}</Text> : null}
    </View>
  );
}

function VerificationBanner({ status }: { status: VerificationStatus }): React.ReactElement {
  const pending = status === VerificationStatus.Pending;
  const rejected = status === VerificationStatus.Rejected;
  const title = pending
    ? 'Verification under review'
    : rejected
      ? 'Verification rejected'
      : 'Account not verified';
  const body = pending
    ? 'Our team is reviewing your photo. You can go online once it\'s approved (usually within 2 days).'
    : rejected
      ? 'Your previous photo was rejected. Please re-submit a clear face photo to get verified.'
      : 'Submit a verification photo to get approved. You can go online and earn once verified.';
  return (
    <View style={styles.verifyBanner}>
      <Text style={styles.verifyTitle}>{title}</Text>
      <Text style={styles.verifyBody}>{body}</Text>
    </View>
  );
}

const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + FAB_PROTRUSION + FS.lg;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: FC.bg },
  scroll: { paddingBottom: BOTTOM_CLEAR },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: FS.lg,
    paddingTop: FS.md,
  },
  headerText: { flex: 1 },
  chatsButton: {
    width: 40,
    height: 40,
    borderRadius: FR.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FC.glass,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Poppins',
    color: FC.text,
    lineHeight: 30,
  },
  subgreeting: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito',
    color: FC.textDim,
    marginTop: 2,
  },
  toast: {
    position: 'absolute',
    top: FS.sm,
    left: FS.lg,
    right: FS.lg,
    backgroundColor: FC.card,
    paddingVertical: FS.sm,
    paddingHorizontal: FS.md,
    borderRadius: FR.sm,
    borderWidth: 1,
    borderColor: FC.hairline,
    ...FShadow.float,
  },
  toastText: {
    ...AppTypography.bodyMedium,
    color: FC.text,
    textAlign: 'center',
  },
  verifyBanner: {
    marginHorizontal: FS.md,
    marginTop: FS.lg,
    backgroundColor: FC.card,
    borderRadius: FR.lg,
    padding: FS.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    gap: FS.xs,
  },
  verifyTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins',
    color: FC.error,
  },
  verifyBody: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Nunito',
    color: FC.textDim,
    lineHeight: 18,
  },
  availabilityCard: {
    marginHorizontal: FS.md,
    marginTop: FS.lg,
    backgroundColor: FC.card,
    borderRadius: FR.lg,
    borderWidth: 1,
    borderColor: FC.hairline,
    overflow: 'hidden',
    ...FShadow.card,
  },
  availabilityCardOnline: {
    borderColor: FC.primaryEdge,
  },
  availabilityInner: {
    padding: FS.lg,
  },
  availabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Poppins',
    color: FC.text,
    flex: 1,
    marginRight: FS.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FS.sm,
    marginTop: FS.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Nunito',
    color: FC.textDim,
  },
  lastToggled: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Nunito',
    color: FC.textFaint,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: FS.md,
    marginTop: FS.lg,
    rowGap: FS.sm,
  },
  statCell: {
    width: '48.5%',
    backgroundColor: FC.card,
    borderRadius: FR.lg,
    padding: FS.lg,
    borderWidth: 1,
    borderColor: FC.hairline,
    ...FShadow.card,
  },
  statIcon: { marginBottom: FS.sm },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Poppins',
    color: FC.primary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito',
    color: FC.textDim,
    marginTop: 2,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  statTrend: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Nunito',
    marginTop: 4,
  },
  statFootnote: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Nunito',
    color: FC.textFaint,
    marginTop: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: FS.md,
    marginTop: FS.xl,
    marginBottom: FS.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Poppins',
    color: FC.text,
  },
  activityCard: {
    marginHorizontal: FS.md,
    backgroundColor: FC.card,
    borderRadius: FR.lg,
    borderWidth: 1,
    borderColor: FC.hairline,
    overflow: 'hidden',
    ...FShadow.card,
  },
  activityRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FC.border,
  },
  empty: {
    alignItems: 'center',
    marginHorizontal: FS.lg,
    marginTop: FS.lg,
    padding: FS.lg,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: FC.card,
    borderWidth: 1,
    borderColor: FC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Poppins',
    color: FC.text,
    marginTop: FS.md,
  },
  emptyBody: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Nunito',
    color: FC.textDim,
    textAlign: 'center',
    marginTop: FS.xs,
    lineHeight: 18,
  },
});

export default FemaleHomeScreen;
