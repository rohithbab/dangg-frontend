import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import BottomSheet from '@core/components/BottomSheet';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION, MIN_PAYOUT_AMOUNT_INR } from '@core/config/constants';
import { inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type FemaleAppStackParamList } from '@navigation/types';

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
        fill="#FFFFFF"
        fillOpacity={0.9}
      />
    </Svg>
  );
}

/**
 * Female Earnings dashboard. Rose-gradient hero with available balance +
 * Request Payout CTA, monthly/lifetime quick stats, and a filterable
 * transaction list. Pull-to-refresh re-fetches all sections.
 */
function EarningsDashboardScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();

  const [balance, setBalance] = useState<EarningsBalance | null>(null);
  const [transactions, setTransactions] = useState<ReadonlyArray<Transaction>>([]);
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cardLayout, setCardLayout] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const loadAll = useCallback(async (active: TransactionFilter): Promise<void> => {
    try {
      const [b, t] = await Promise.all([getEarningsBalance(), listTransactions(active)]);
      setBalance(b);
      setTransactions(t);
    } catch (e) {
      logger.error('EarningsDashboardScreen.loadAll failed', e);
    }
  }, []);

  // useFocusEffect handles both first mount and re-focus, so the dashboard
  // refreshes after a payout is submitted on PayoutRequestScreen and the
  // user is navigation-reset back here. Without this the cached `balance`
  // still has `pendingPayoutInr === null` and the CTA stays enabled.
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
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings</Text>
        </View>

        <View style={styles.heroCardContainer}>
          <View
            style={styles.heroCardContent}
            onLayout={e => {
              const { width, height } = e.nativeEvent.layout;
              setCardLayout({ width, height });
            }}
          >
            {cardLayout.width > 0 && cardLayout.height > 0 ? (
              <Svg
                height={cardLayout.height}
                width={cardLayout.width}
                viewBox={`0 0 ${cardLayout.width} ${cardLayout.height}`}
                style={StyleSheet.absoluteFillObject}
              >
                <Defs>
                  <SvgLinearGradient id="heroCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={AppColors.primaryDark} />
                    <Stop offset="100%" stopColor={AppColors.primaryLight} />
                  </SvgLinearGradient>
                </Defs>
                <Rect
                  x={0}
                  y={0}
                  width={cardLayout.width}
                  height={cardLayout.height}
                  fill="url(#heroCardGrad)"
                />
                {/* Decorative elements for depth and premium finish */}
                <Circle cx={cardLayout.width - 20} cy={20} r={45} fill="#FFFFFF" opacity={0.12} />
                <Circle cx={30} cy={cardLayout.height - 10} r={30} fill="#FFFFFF" opacity={0.06} />
              </Svg>
            ) : null}
            <Text style={styles.heroLabel}>Available to withdraw</Text>
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
          </View>
        </View>

        <View style={styles.quickStats}>
          <View style={[styles.quickStat, AppShadows.e1]}>
            <Text style={styles.quickStatLabel}>This Month</Text>
            <View style={styles.statCoinRow}>
              <Text style={styles.quickStatValue}>
                {balance ? inr(balance.monthEarningsInr) : '—'}
              </Text>
            </View>
            {balance ? <Text style={styles.quickStatTrend}>{balance.monthTrend.label}</Text> : null}
          </View>
          <View style={[styles.quickStat, AppShadows.e1]}>
            <Text style={styles.quickStatLabel}>Lifetime</Text>
            <View style={styles.statCoinRow}>
              <Text style={styles.quickStatValue}>
                {balance ? inr(balance.lifetimeEarningsInr) : '—'}
              </Text>
            </View>
            <Text style={styles.quickStatTrend}>since joining</Text>
          </View>
        </View>

        <View style={styles.txHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFilterSheetOpen(true)}
            hitSlop={8}
            style={styles.filterChip}
          >
            <Text style={styles.filterChipText}>{`${FILTER_LABEL[filter]} ▾`}</Text>
          </Pressable>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Svg width={48} height={48} viewBox="0 0 24 24">
                <Path
                  d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8z"
                  fill={AppColors.primary}
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

      <BottomSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filter transactions"
      >
        {(Object.keys(FILTER_LABEL) as TransactionFilter[]).map(f => (
          <Pressable
            key={f}
            accessibilityRole="button"
            onPress={() => handleFilterPick(f)}
            style={[styles.filterOption, f === filter && styles.filterOptionActive]}
          >
            <Text
              style={[styles.filterOptionLabel, f === filter && styles.filterOptionLabelActive]}
            >
              {FILTER_LABEL[f]}
            </Text>
          </Pressable>
        ))}
      </BottomSheet>
    </SafeAreaView>
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
  headerTitle: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
  },
  heroCardContainer: {
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.lg,
    borderRadius: AppRadii.xl,
    backgroundColor: AppColors.primaryDark,
    // Soft, deep colored glow shadow for premium aesthetics
    shadowColor: AppColors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
  heroCardContent: {
    borderRadius: AppRadii.xl,
    overflow: 'hidden',
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.lg + 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroLabel: {
    ...AppTypography.labelLarge,
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  heroBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.sm + 4,
    marginTop: AppSpacing.sm,
  },
  heroBalance: {
    ...AppTypography.displayLarge,
    color: '#FFFFFF',
    fontWeight: '800',
    lineHeight: 56,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.xs,
    marginTop: AppSpacing.sm,
  },
  pendingText: {
    ...AppTypography.bodyMedium,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  payoutBtn: {
    marginTop: AppSpacing.md,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.md,
    paddingVertical: AppSpacing.sm + 4,
    alignItems: 'center',
  },
  payoutBtnPressed: { opacity: 0.85 },
  payoutBtnDisabled: { opacity: 0.6 },
  payoutBtnLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.md,
    gap: AppSpacing.sm,
  },
  quickStat: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.md,
    padding: AppSpacing.md,
  },
  quickStatLabel: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
  },
  quickStatValue: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
    marginTop: 0,
  },
  statCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  quickStatTrend: {
    ...AppTypography.labelSmall,
    color: AppColors.success,
    marginTop: 4,
  },
  txHeader: {
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
  filterChip: {
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: 4,
    borderRadius: AppRadii.full,
    backgroundColor: AppColors.primarySubtle,
  },
  filterChipText: {
    ...AppTypography.labelSmall,
    color: AppColors.primary,
  },
  txList: {
    backgroundColor: AppColors.surface,
  },
  empty: {
    alignItems: 'center',
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
  filterOption: {
    paddingVertical: AppSpacing.md,
    paddingHorizontal: AppSpacing.md,
    borderRadius: AppRadii.md,
  },
  filterOptionActive: { backgroundColor: AppColors.primarySubtle },
  filterOptionLabel: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
  },
  filterOptionLabelActive: { color: AppColors.primary, fontWeight: '600' },
});

export default EarningsDashboardScreen;
