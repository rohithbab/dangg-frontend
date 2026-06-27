import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

import {
  type EarningsBalance,
  type Transaction,
  getEarningsBalance,
  listTransactions,
} from '../api/earningsApi';

type Nav = NativeStackNavigationProp<FemaleAppStackParamList>;

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

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
 * C22 · Earnings (Neue). Withdrawable balance hero + Withdraw pill, a weekly
 * earnings bar chart, Today / This week / All-time summary rows, and a link to
 * payout history. Balances are INR (what she actually withdraws); the weekly
 * bars + Today/This-week totals are derived client-side from the transactions
 * feed. All data sources (getEarningsBalance / listTransactions) are unchanged.
 */
function EarningsDashboardScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const [balance, setBalance] = useState<EarningsBalance | null>(null);
  const [transactions, setTransactions] = useState<ReadonlyArray<Transaction>>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async (): Promise<void> => {
    try {
      const [b, t] = await Promise.all([getEarningsBalance(), listTransactions('earning')]);
      setBalance(b);
      setTransactions(t);
    } catch (e) {
      logger.error('EarningsDashboardScreen.loadAll failed', e);
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
        <Text style={styles.title}>Earnings</Text>

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
          <SummaryRow label="All time" value={balance ? inr(balance.lifetimeEarningsInr) : '—'} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('PayoutHistory')}
          style={({ pressed }) => [styles.historyLink, pressed && styles.pressed]}
        >
          <Text style={styles.historyText}>Payout history</Text>
          <ChevronRight size={16} color={AppColors.onSurfaceMuted} strokeWidth={2} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
  title: {
    fontFamily: InterFont.regular,
    fontSize: 28,
    letterSpacing: -0.6,
    color: AppColors.onSurface,
  },
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
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: AppSpacing.xl,
  },
  historyText: { fontFamily: InterFont.medium, fontSize: 14, color: AppColors.onSurfaceMuted },
});

export default EarningsDashboardScreen;
