import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION, MIN_PAYOUT_AMOUNT_INR } from '@core/config/constants';
import { inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import { FC, FR, FS, FShadow } from '@features/femaleHome/femaleTheme';

import {
  type EarningsBalance,
  type Transaction,
  type TransactionFilter,
  getEarningsBalance,
  listTransactions,
} from '../api/earningsApi';
import TransactionItem from '../components/TransactionItem';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList>;

const FILTER_LABEL: Record<TransactionFilter, string> = {
  all: 'All',
  earning: 'Earnings',
  payout: 'Payouts',
  refund: 'Refunds',
};

function ClockIcon(): React.ReactElement {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
        fill={FC.text}
        fillOpacity={0.9}
      />
    </Svg>
  );
}

function EarningsHeroBackdrop({ radius = 28 }: { radius?: number }): React.ReactElement {
  const base = React.useId();
  const glowA = React.useId();
  const glowB = React.useId();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <SvgLinearGradient id={base} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1A1A22" />
            <Stop offset="1" stopColor="#141419" />
          </SvgLinearGradient>
          <RadialGradient id={glowA} cx="88%" cy="2%" r="72%">
            <Stop offset="0" stopColor={FC.secondary} stopOpacity={0.24} />
            <Stop offset="1" stopColor={FC.secondary} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={glowB} cx="2%" cy="100%" r="72%">
            <Stop offset="0" stopColor={FC.primary} stopOpacity={0.16} />
            <Stop offset="1" stopColor={FC.primary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={`url(#${base})`} />
        <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={`url(#${glowA})`} />
        <Rect x="0" y="0" width="100%" height="100%" rx={radius} fill={`url(#${glowB})`} />
      </Svg>
    </View>
  );
}

function EarningsDashboardScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const [balance, setBalance] = useState<EarningsBalance | null>(null);
  const [transactions, setTransactions] = useState<ReadonlyArray<Transaction>>([]);
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async (active: TransactionFilter): Promise<void> => {
    try {
      const [b, t] = await Promise.all([getEarningsBalance(), listTransactions(active)]);
      setBalance(b);
      setTransactions(t);
    } catch (e) {
      logger.error('EarningsDashboardScreen.loadAll failed', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAll(filter);
    }, [filter, loadAll]),
  );

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await loadAll(filter);
    setRefreshing(false);
  }, [filter, loadAll]);

  const handleFilterPick = useCallback((next: TransactionFilter): void => {
    setFilter(next);
    setFilterSheetOpen(false);
  }, []);

  const payoutBlocked =
    (balance?.availableInr ?? 0) < MIN_PAYOUT_AMOUNT_INR ||
    (balance?.pendingPayoutInr ?? null) !== null;

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
          <Text style={styles.headerTitle}>Earnings</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(480)} style={[styles.hero, FShadow.hero]}>
          <EarningsHeroBackdrop radius={FR.hero} />
          <View style={styles.heroTopHighlight} pointerEvents="none" />
          <Text style={styles.heroLabel}>AVAILABLE TO WITHDRAW</Text>
          <View style={styles.heroBalanceRow}>
            <Text style={styles.heroBalance}>{balance ? inr(balance.availableInr) : '—'}</Text>
          </View>
          {balance?.pendingPayoutInr != null ? (
            <View style={styles.pendingRow}>
              <ClockIcon />
              <Text style={styles.pendingText}>
                {inr(balance.pendingPayoutInr)} payout in review
              </Text>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={payoutBlocked}
              onPress={() => navigation.navigate('PayoutRequest')}
              style={({ pressed }) => [
                styles.payoutBtn,
                pressed && styles.payoutBtnPressed,
                payoutBlocked && styles.payoutBtnDisabled,
              ]}
            >
              <Text style={styles.payoutBtnLabel}>Request Payout</Text>
            </Pressable>
          )}
        </Animated.View>

        <View style={styles.quickStats}>
          <Animated.View entering={FadeInDown.duration(380).delay(100)} style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>This Month</Text>
            <View style={styles.statCoinRow}>
              <Text style={styles.quickStatValue}>
                {balance ? inr(balance.monthEarningsInr) : '—'}
              </Text>
            </View>
            {balance ? (
              <Text style={[styles.quickStatTrend, { color: FC.success }]}>
                {balance.monthTrend.label}
              </Text>
            ) : null}
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(380).delay(200)} style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>Lifetime</Text>
            <View style={styles.statCoinRow}>
              <Text style={styles.quickStatValue}>
                {balance ? inr(balance.lifetimeEarningsInr) : '—'}
              </Text>
            </View>
            <Text style={[styles.quickStatTrend, { color: FC.textFaint }]}>since joining</Text>
          </Animated.View>
        </View>

        <View style={styles.txHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFilterSheetOpen(true)}
            hitSlop={8}
            style={styles.filterChip}
          >
            <Text style={styles.filterChipText}>{FILTER_LABEL[filter]}</Text>
          </Pressable>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Svg width={48} height={48} viewBox="0 0 24 24">
                <Path
                  d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8z"
                  fill={FC.primary}
                />
              </Svg>
            </View>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyBody}>
              Your earnings will appear here once you start chatting.
            </Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {transactions.map(t => (
              <TransactionItem key={t.id} item={t} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter bottom sheet */}
      {filterSheetOpen && (
        <View style={styles.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFilterSheetOpen(false)} />
          <Animated.View entering={FadeInDown.duration(300)} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filter transactions</Text>
            <View style={styles.sheetOptions}>
              {(Object.keys(FILTER_LABEL) as TransactionFilter[]).map(f => (
                <Pressable
                  key={f}
                  accessibilityRole="button"
                  onPress={() => handleFilterPick(f)}
                  style={[styles.sheetOption, f === filter && styles.sheetOptionActive]}
                >
                  <Text
                    style={[styles.sheetOptionLabel, f === filter && styles.sheetOptionLabelActive]}
                  >
                    {FILTER_LABEL[f]}
                  </Text>
                  {f === filter ? <View style={styles.sheetCheck} /> : null}
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Poppins',
    color: FC.text,
    lineHeight: 30,
  },
  hero: {
    marginHorizontal: FS.md,
    marginTop: FS.lg,
    borderRadius: FR.hero,
    paddingVertical: FS.xxl,
    paddingHorizontal: FS.xl,
    borderWidth: 1,
    borderColor: FC.hairline,
    overflow: 'hidden',
    alignItems: 'center',
  },
  heroTopHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroLabel: {
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: '700',
    fontFamily: 'Nunito',
    color: FC.textDim,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  heroBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FS.sm + 4,
    marginTop: FS.md,
  },
  heroBalance: {
    fontSize: 46,
    fontWeight: '800',
    fontFamily: 'Poppins',
    letterSpacing: -1,
    color: FC.text,
    lineHeight: 48,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FS.xs,
    marginTop: FS.sm,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito',
    color: FC.textDim,
  },
  payoutBtn: {
    marginTop: FS.lg,
    backgroundColor: FC.primary,
    borderRadius: FR.md,
    paddingVertical: FS.md,
    paddingHorizontal: FS.xxl,
    alignItems: 'center',
    minWidth: 200,
  },
  payoutBtnPressed: { opacity: 0.85 },
  payoutBtnDisabled: { opacity: 0.5 },
  payoutBtnLabel: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Nunito',
    color: FC.text,
  },
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: FS.md,
    marginTop: FS.md,
    gap: FS.sm,
  },
  quickStat: {
    flex: 1,
    backgroundColor: FC.card,
    borderRadius: FR.lg,
    padding: FS.lg,
    borderWidth: 1,
    borderColor: FC.hairline,
    ...FShadow.card,
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Nunito',
    color: FC.textDim,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Poppins',
    color: FC.text,
    letterSpacing: -0.3,
  },
  statCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: FS.sm,
  },
  quickStatTrend: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Nunito',
    marginTop: 4,
  },
  txHeader: {
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
  filterChip: {
    paddingHorizontal: FS.sm + 4,
    paddingVertical: FS.xs + 2,
    borderRadius: FR.pill,
    backgroundColor: FC.primarySoft,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Nunito',
    color: FC.primary,
  },
  txList: {
    marginHorizontal: FS.md,
    backgroundColor: FC.card,
    borderRadius: FR.lg,
    borderWidth: 1,
    borderColor: FC.hairline,
    overflow: 'hidden',
    ...FShadow.card,
  },
  empty: {
    alignItems: 'center',
    marginTop: FS.lg,
    padding: FS.lg,
  },
  emptyIcon: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: FC.card,
    borderWidth: 1,
    borderColor: FC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: FS.lg,
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
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: FC.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: FC.card,
    borderTopLeftRadius: FR.xl,
    borderTopRightRadius: FR.xl,
    paddingHorizontal: FS.xl,
    paddingBottom: FS.huge,
    paddingTop: FS.sm,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: FC.textFaint,
    alignSelf: 'center',
    marginBottom: FS.lg,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Poppins',
    color: FC.text,
    marginBottom: FS.md,
  },
  sheetOptions: {
    gap: 4,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: FS.md,
    paddingHorizontal: FS.md,
    borderRadius: FR.md,
  },
  sheetOptionActive: {
    backgroundColor: FC.primarySoft,
  },
  sheetOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Nunito',
    color: FC.textDim,
  },
  sheetOptionLabelActive: {
    color: FC.primary,
    fontWeight: '700',
  },
  sheetCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FC.primary,
  },
});

export default EarningsDashboardScreen;
