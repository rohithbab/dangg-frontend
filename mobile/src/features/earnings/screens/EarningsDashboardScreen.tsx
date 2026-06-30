import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import EmptyState from '@core/components/EmptyState';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import {
  type EarningsBalance,
  type PayoutRecord,
  type PayoutUiStatus,
  type Transaction,
  getEarningsBalance,
  listPayouts,
  listTransactions,
} from '../api/earningsApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList>;

type Tab = 'earnings' | 'payouts';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

const STATUS_META: Record<PayoutUiStatus, { label: string; color: string; tint: string }> = {
  processing: { label: 'Processing', color: AppColors.coinGold, tint: 'rgba(245,181,61,0.14)' },
  paid: { label: 'Paid', color: AppColors.success, tint: 'rgba(52,211,153,0.14)' },
  failed: { label: 'Failed', color: AppColors.error, tint: 'rgba(248,113,113,0.14)' },
  cancelled: { label: 'Cancelled', color: AppColors.onSurfaceMuted, tint: AppColors.surface },
};

/** Monday=0 … Sunday=6 index for a date (JS getDay is Sun=0). */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * C22 · Earnings (Neue). A top tab switcher toggles between two panels:
 *  • Earnings — withdrawable balance hero + Withdraw pill, weekly bar chart and
 *    Today / This week / All-time summary rows.
 *  • Payout history — month-grouped list of every withdrawal (pulled inline from
 *    the standalone PayoutHistory screen so it's reachable at the top).
 * The active tab is white, the inactive one grey; tapping swaps the content.
 */
function EarningsDashboardScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const [tab, setTab] = useState<Tab>('earnings');
  const [balance, setBalance] = useState<EarningsBalance | null>(null);
  const [transactions, setTransactions] = useState<ReadonlyArray<Transaction>>([]);
  const [payouts, setPayouts] = useState<ReadonlyArray<PayoutRecord>>([]);
  const [payoutsLoaded, setPayoutsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async (): Promise<void> => {
    try {
      const [b, t, p] = await Promise.all([
        getEarningsBalance(),
        listTransactions('earning'),
        listPayouts(),
      ]);
      setBalance(b);
      setTransactions(t);
      setPayouts(p);
    } catch (e) {
      logger.error('EarningsDashboardScreen.loadAll failed', e);
    } finally {
      setPayoutsLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAll();
    }, [loadAll]),
  );

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  /** Earnings summed per weekday for the current week (Mon→Sun), + today/week totals. */
  const { weekBars, todayInr, weekInr } = useMemo(() => {
    const bars = [0, 0, 0, 0, 0, 0, 0];
    const today0 = startOfToday().getTime();
    const weekStart = today0 - mondayIndex(new Date()) * 24 * 60 * 60 * 1000;
    let todaySum = 0;
    let weekSum = 0;
    for (const t of transactions) {
      if (t.kind !== 'earning') {
        continue;
      }
      const ts = t.occurredAt.getTime();
      if (ts >= weekStart) {
        bars[mondayIndex(t.occurredAt)] += t.amountInr;
        weekSum += t.amountInr;
      }
      if (ts >= today0) {
        todaySum += t.amountInr;
      }
    }
    return { weekBars: bars, todayInr: todaySum, weekInr: weekSum };
  }, [transactions]);

  /** Payouts grouped into [monthLabel, rows][] preserving newest-first order. */
  const payoutGroups = useMemo(() => {
    const out: Array<{ key: string; rows: PayoutRecord[] }> = [];
    for (const p of payouts) {
      const key = format(p.requestedAt, 'MMMM yyyy').toUpperCase();
      const last = out[out.length - 1];
      if (last && last.key === key) {
        last.rows.push(p);
      } else {
        out.push({ key, rows: [p] });
      }
    }
    return out;
  }, [payouts]);

  const pending = balance?.pendingPayoutInr ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
          />
        }
      >
        <View style={styles.tabsRow}>
          <TabLabel
            label="Earnings"
            active={tab === 'earnings'}
            onPress={() => setTab('earnings')}
          />
          <TabLabel
            label="Payout history"
            active={tab === 'payouts'}
            onPress={() => setTab('payouts')}
          />
        </View>

        {tab === 'earnings' ? (
          <>
            <Text style={styles.availLabel}>AVAILABLE</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balance}>{balance ? inr(balance.availableInr) : '—'}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Withdraw"
                onPress={() => navigation.navigate('WithdrawAmount')}
                style={({ pressed }) => [styles.withdrawPill, pressed && styles.pressed]}
              >
                <Text style={styles.withdrawLabel}>Withdraw</Text>
              </Pressable>
            </View>
            <Text style={styles.subBalance}>
              {pending != null ? `${inr(pending)} payout in review` : 'Available to withdraw'}
            </Text>

            <WeekChart bars={weekBars} />

            <View style={styles.summary}>
              <SummaryRow label="Today" value={`+${inr(todayInr)}`} />
              <SummaryRow label="This week" value={`+${inr(weekInr)}`} />
              <SummaryRow
                label="All time"
                value={balance ? inr(balance.lifetimeEarningsInr) : '—'}
              />
            </View>
          </>
        ) : payoutsLoaded && payouts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              title="No payouts yet"
              body="Your withdrawals will show up here once you request one."
            />
          </View>
        ) : (
          payoutGroups.map(group => (
            <View key={group.key} style={styles.group}>
              <Text style={styles.groupLabel}>{group.key}</Text>
              {group.rows.map(p => {
                const meta = STATUS_META[p.status];
                return (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    onPress={() => navigation.navigate('PayoutDetail', { payoutId: p.id })}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  >
                    <View style={[styles.dot, { backgroundColor: meta.color }]} />
                    <View style={styles.rowMain}>
                      <Text style={styles.amount}>{inr(p.amountInr)}</Text>
                      <Text style={styles.method}>{p.methodLabel}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <View style={[styles.badge, { backgroundColor: meta.tint }]}>
                        <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                      <Text style={styles.date}>{format(p.requestedAt, 'd MMM')}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabLabel({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress}>
      <Text style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}>{label}</Text>
    </Pressable>
  );
}

function WeekChart({ bars }: { bars: ReadonlyArray<number> }): React.ReactElement {
  const max = Math.max(1, ...bars);
  const CHART_H = 132;
  const BAR_W = 22;
  return (
    <View style={styles.chart}>
      <View style={styles.chartBars}>
        {bars.map((v, i) => {
          const h = Math.max(6, Math.round((v / max) * CHART_H));
          // Brightest bar = the week's peak day (matches the Figma highlight).
          const isPeak = v === max && v > 0;
          return (
            <View key={i} style={styles.barCol}>
              <Svg width={BAR_W} height={CHART_H}>
                <Rect
                  x={0}
                  y={CHART_H - h}
                  width={BAR_W}
                  height={h}
                  rx={6}
                  fill={isPeak ? AppColors.primary : AppColors.primaryDark}
                  fillOpacity={isPeak ? 1 : 0.55}
                />
              </Svg>
              <Text style={styles.barLabel}>{WEEKDAY_LABELS[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + FAB_PROTRUSION + AppSpacing.lg;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.md,
    paddingBottom: BOTTOM_CLEAR,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: AppSpacing.lg,
    marginBottom: AppSpacing.sm,
  },
  tab: {
    fontFamily: InterFont.regular,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  tabActive: { color: AppColors.onSurface, fontFamily: InterFont.medium },
  tabInactive: { color: AppColors.onSurfaceMuted },
  availLabel: {
    fontFamily: InterFont.medium,
    fontSize: 11.5,
    letterSpacing: 0.8,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.xl,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: AppSpacing.xs,
  },
  balance: {
    fontFamily: InterFont.light,
    fontSize: 52,
    letterSpacing: -1.6,
    color: AppColors.onSurface,
  },
  withdrawPill: {
    backgroundColor: AppColors.primary,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  pressed: { opacity: 0.85 },
  withdrawLabel: { fontFamily: InterFont.semibold, fontSize: 15, color: '#FFFFFF' },
  subBalance: {
    fontFamily: InterFont.regular,
    fontSize: 13.5,
    color: AppColors.onSurfaceMuted,
    marginTop: 4,
  },
  chart: { marginTop: AppSpacing.xl + 8 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barCol: { alignItems: 'center' },
  barLabel: {
    fontFamily: InterFont.regular,
    fontSize: 12,
    color: AppColors.onSurfaceMuted,
    marginTop: 8,
  },
  summary: { marginTop: AppSpacing.xl + 8, gap: 10 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  summaryLabel: { fontFamily: InterFont.regular, fontSize: 15, color: AppColors.onSurface },
  summaryValue: { fontFamily: InterFont.medium, fontSize: 15, color: AppColors.success },
  emptyWrap: { marginTop: 48 },
  group: { marginTop: AppSpacing.lg },
  groupLabel: {
    fontFamily: InterFont.medium,
    fontSize: 11.5,
    letterSpacing: 0.8,
    color: AppColors.onSurfaceMuted,
    marginBottom: AppSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  dot: { width: 9, height: 9, borderRadius: 4.5, marginRight: 12 },
  rowMain: { flex: 1 },
  amount: { fontFamily: InterFont.semibold, fontSize: 16, color: AppColors.onSurface },
  method: {
    fontFamily: InterFont.regular,
    fontSize: 12.5,
    color: AppColors.onSurfaceMuted,
    marginTop: 3,
  },
  rowRight: { alignItems: 'flex-end' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: InterFont.medium, fontSize: 12 },
  date: {
    fontFamily: InterFont.regular,
    fontSize: 12,
    color: AppColors.onSurfaceMuted,
    marginTop: 6,
  },
});

export default EarningsDashboardScreen;
