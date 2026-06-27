import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageCircle } from 'lucide-react-native';
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

import { InterFont } from '@theme/typography';

import GradientAvatar from '@core/components/GradientAvatar';
import { BOTTOM_NAV_HEIGHT } from '@core/config/constants';
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

import { getProfile } from '@features/profile/api/profileApi';

import { VerificationStatus } from '@app-types/domain';

import {
  type Availability,
  type HomeStats,
  type RecentActivity,
  getAvailability,
  getHomeStats,
  getRecentActivity,
  setAvailability,
} from '../api/femaleHomeApi';
import AvailabilityToggle from '../components/AvailabilityToggle';
import RecentActivityItem from '../components/RecentActivityItem';
import { FC, FS } from '../femaleTheme';
import { useAvailabilityHeartbeat } from '../hooks/useAvailabilityHeartbeat';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList>;

const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + 48;

function firstNameFromSession(fullName: string | undefined): string {
  if (!fullName) {
    return 'there';
  }
  return fullName.split(/\s+/)[0] ?? fullName;
}

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) {
    return 'Good morning';
  }
  if (h < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  // Profile picture for the greeting avatar (falls back to the initial).
  useFocusEffect(
    useCallback(() => {
      getProfile()
        .then(p => setAvatarUrl(p.avatarUrl))
        .catch(e => logger.warn('FemaleHome: getProfile failed', e));
    }, []),
  );

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
      if (toggling) {
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

  const online = availability?.online === true;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={FC.primary}
            colors={[FC.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <GradientAvatar
            initials={firstName.slice(0, 1).toUpperCase()}
            seed={session?.user.id ?? firstName}
            uri={avatarUrl}
            size={46}
            shape="squircle"
          />
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{greetingForNow()}</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chats"
            hitSlop={10}
            onPress={() => navigation.navigate('ChatsInbox')}
            style={styles.chatBtn}
          >
            <MessageCircle size={20} color={FC.text} strokeWidth={1.9} />
          </Pressable>
        </View>

        {!isVerified ? (
          <VerificationBanner
            status={verificationStatus}
            onVerify={() => navigation.navigate('FemaleTabs', { screen: 'Profile' })}
          />
        ) : null}

        {/* Online toggle card */}
        <View style={[styles.onlineCard, online && styles.onlineCardActive]}>
          <View style={styles.onlineDotCol}>
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: online ? FC.onlineGreen : FC.offlineGray },
              ]}
            />
          </View>
          <View style={styles.onlineText}>
            <Text style={styles.onlineTitle}>{online ? "You're online" : "You're offline"}</Text>
            <Text style={styles.onlineSub}>
              {online ? 'Visible to users — accepting requests' : 'Go online to receive requests'}
            </Text>
          </View>
          <AvailabilityToggle
            value={isVerified ? online : false}
            onValueChange={handleToggleAvailability}
            disabled={availability === null || !isVerified}
          />
        </View>

        {/* Earnings */}
        <Text style={styles.earningsLabel}>TODAY'S EARNINGS</Text>
        <View style={styles.earningsRow}>
          <View style={styles.earningsLeft}>
            <Text style={styles.earningsValue}>
              {`₹${(stats?.todayEarningsInr ?? 0).toLocaleString()}`}
            </Text>
            <Text style={styles.earningsSub}>
              {`≈ ₹${(stats?.weekEarningsInr ?? 0).toLocaleString()} this week`}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Withdraw earnings"
            onPress={() => navigation.navigate('PayoutRequest')}
            style={({ pressed }) => [styles.withdraw, pressed && styles.pressed]}
          >
            <Text style={styles.withdrawText}>Withdraw</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Stat triplet */}
        <View style={styles.triplet}>
          <StatCol value={stats ? String(stats.chatsToday) : '—'} label="Chats today" />
          <View style={styles.tripletDivider} />
          <StatCol
            value={stats ? `₹${stats.weekEarningsInr.toLocaleString()}` : '—'}
            label="This week"
          />
          <View style={styles.tripletDivider} />
          <StatCol value={stats ? stats.ratingAvg.toFixed(1) : '—'} label="Rating" />
        </View>

        {/* Recent activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
        </View>

        {activity.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyBody}>
              Turn on availability to start receiving chat requests.
            </Text>
          </View>
        ) : (
          <View style={styles.activityCard}>
            {activity.slice(0, 5).map((item, idx) => (
              <View key={item.id} style={idx > 0 ? styles.activityRow : undefined}>
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

function StatCol({ value, label }: { value: string; label: string }): React.ReactElement {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function VerificationBanner({
  status,
  onVerify,
}: {
  status: VerificationStatus;
  onVerify: () => void;
}): React.ReactElement {
  const pending = status === VerificationStatus.Pending;
  const title = pending
    ? 'Verification under review — finish to start earning'
    : 'Verify your account to start earning';
  return (
    <Pressable style={styles.verifyBanner} onPress={onVerify} accessibilityRole="button">
      <View style={styles.verifyDot} />
      <Text style={styles.verifyText} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.verifyAction}>Verify</Text>
    </Pressable>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: FC.bg },
  scroll: { paddingHorizontal: FS.md + 4, paddingBottom: BOTTOM_CLEAR },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: FS.sm },
  headerText: { flex: 1 },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FC.card,
    borderWidth: 1,
    borderColor: FC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: { fontFamily: InterFont.light, fontSize: 13, color: '#8C8C94' },
  name: {
    fontFamily: InterFont.regular,
    fontSize: 20,
    color: FC.text,
    letterSpacing: -0.4,
    marginTop: 2,
  },

  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: FS.lg,
    backgroundColor: '#0E0E10',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,165,36,0.35)',
    paddingHorizontal: FS.md,
    paddingVertical: FS.md,
  },
  verifyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: FC.warning },
  verifyText: {
    flex: 1,
    fontFamily: InterFont.regular,
    fontSize: 13.5,
    color: FC.text,
    lineHeight: 18,
  },
  verifyAction: { fontFamily: InterFont.medium, fontSize: 13.5, color: FC.primary },

  onlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: FS.lg,
    backgroundColor: '#0E0E10',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FC.hairline,
    paddingHorizontal: 17,
    paddingVertical: 15,
  },
  onlineCardActive: { borderColor: 'rgba(51,199,89,0.3)' },
  onlineDotCol: { justifyContent: 'flex-start', alignSelf: 'flex-start', paddingTop: 5 },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  onlineText: { flex: 1, marginLeft: 10 },
  onlineTitle: { fontFamily: InterFont.medium, fontSize: 16, color: FC.text },
  onlineSub: { fontFamily: InterFont.light, fontSize: 12.5, color: '#8C8C94', marginTop: 3 },

  earningsLabel: {
    fontFamily: InterFont.medium,
    fontSize: 11.5,
    letterSpacing: 0.7,
    color: '#73737A',
    marginTop: FS.xl,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: FS.sm,
  },
  earningsLeft: { flex: 1 },
  earningsValue: { fontFamily: InterFont.light, fontSize: 52, letterSpacing: -1.6, color: FC.text },
  earningsSub: { fontFamily: InterFont.light, fontSize: 14, color: '#8C8C94', marginTop: 6 },
  withdraw: {
    height: 46,
    paddingHorizontal: 26,
    borderRadius: 15,
    backgroundColor: FC.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawText: { fontFamily: InterFont.medium, fontSize: 15, color: '#FFFFFF' },
  pressed: { opacity: 0.9 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginTop: FS.xl },

  triplet: { flexDirection: 'row', alignItems: 'center', marginTop: FS.lg },
  tripletDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.07)' },
  statCol: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: InterFont.light, fontSize: 24, color: FC.text },
  statLabel: { fontFamily: InterFont.light, fontSize: 12, color: '#8C8C94', marginTop: 8 },

  sectionHeader: { marginTop: FS.xl, marginBottom: FS.md },
  sectionTitle: { fontFamily: InterFont.medium, fontSize: 15, color: FC.text },

  activityCard: {
    backgroundColor: '#0E0E10',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  activityRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },

  empty: { alignItems: 'center', paddingVertical: FS.xxl },
  emptyTitle: { fontFamily: InterFont.medium, fontSize: 16, color: FC.text },
  emptyBody: {
    fontFamily: InterFont.light,
    fontSize: 13.5,
    color: '#8C8C94',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: FS.lg,
  },

  toast: {
    position: 'absolute',
    top: FS.sm,
    left: FS.lg,
    right: FS.lg,
    backgroundColor: FC.card,
    paddingVertical: FS.sm,
    paddingHorizontal: FS.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FC.hairline,
  },
  toastText: { fontFamily: InterFont.regular, fontSize: 14, color: FC.text, textAlign: 'center' },
});

export default FemaleHomeScreen;
