import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import CoinIcon from '@core/components/CoinIcon';
import PrimaryButton from '@core/components/PrimaryButton';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { compactNumber, inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import FilterChip from '@features/maleHome/components/FilterChip';

import {
  type WalletTransaction,
  type WalletTransactionFilter,
  fetchWalletSnapshot,
  listTransactions,
} from '../api/walletApi';
import CoinPackageCard from '../components/CoinPackageCard';
import CoinPurchaseConfirmModal from '../components/CoinPurchaseConfirmModal';
import SliderTabs from '../components/SliderTabs';
import TransactionRow from '../components/TransactionRow';
import { COIN_PACKAGES, type CoinPackage, totalCoinsFor } from '../constants';
import { useCoinBalance, useWalletStore } from '../store/walletStore';

type Nav = NativeStackNavigationProp<MaleAppStackParamList>;
type WalletTab = 'wallet' | 'transaction';
type DayBucket = 'today' | 'yesterday' | 'thisWeek' | 'older';

const TX_FILTERS: ReadonlyArray<{ value: WalletTransactionFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'chat', label: 'Chats' },
  { value: 'refund', label: 'Refunds' },
];

const BUCKET_LABEL: Record<DayBucket, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  older: 'Earlier',
};

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

function ChevronRightIcon(): React.ReactElement {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" fill={AppColors.primary} />
    </Svg>
  );
}

function bucketFor(date: Date, now: Date): DayBucket {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(now);
  const occurred = startOfDay(date);
  const diffDays = Math.round((today - occurred) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) {
    return 'today';
  }
  if (diffDays === 1) {
    return 'yesterday';
  }
  if (diffDays <= 7) {
    return 'thisWeek';
  }
  return 'older';
}

/**
 * Male Wallet tab with header slider between two sub-views.
 *
 *   * Wallet view — premium gold-coin hero + 6-package grid + recent activity
 *     teaser + sticky buy button.
 *   * Transaction view — filter chips + grouped transaction list with type icons.
 */
function WalletScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const coinBalance = useCoinBalance();
  const totalCoinsPurchased = useWalletStore(s => s.totalCoinsPurchased);
  const chatsStarted = useWalletStore(s => s.chatsStarted);

  const [activeTab, setActiveTab] = useState<WalletTab>('wallet');
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [txFilter, setTxFilter] = useState<WalletTransactionFilter>('all');
  const [transactions, setTransactions] = useState<ReadonlyArray<WalletTransaction>>([]);
  const [recentTxs, setRecentTxs] = useState<ReadonlyArray<WalletTransaction>>([]);

  useEffect(() => {
    fetchWalletSnapshot().catch(e => logger.warn('Wallet snapshot failed', e));
    listTransactions('all')
      .then(txs => setRecentTxs(txs.slice(0, 3)))
      .catch(e => logger.warn('Recent tx load failed', e));
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWalletSnapshot().catch(e => logger.warn('Wallet snapshot failed', e));
      listTransactions('all')
        .then(txs => setRecentTxs(txs.slice(0, 3)))
        .catch(e => logger.warn('Recent tx load failed', e));
    }, []),
  );

  useEffect(() => {
    if (activeTab !== 'transaction') {
      return;
    }
    listTransactions(txFilter)
      .then(setTransactions)
      .catch(e => logger.warn('Transactions load failed', e));
  }, [activeTab, txFilter]);

  const handleConfirmPurchase = useCallback((): void => {
    if (!selectedPkg) {
      return;
    }
    setConfirmOpen(false);
    navigation.navigate('PaymentProcessing', { packageId: selectedPkg.id });
  }, [navigation, selectedPkg]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={12}
          onPress={() => navigation.navigate('Notifications')}
          style={styles.bellWrap}
        >
          <BellIcon withDot />
        </Pressable>
      </View>

      <View style={styles.sliderWrap}>
        <SliderTabs<WalletTab>
          options={[
            { value: 'wallet', label: 'Wallet' },
            { value: 'transaction', label: 'Transaction' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />
      </View>

      {activeTab === 'wallet' ? (
        <WalletView
          coinBalance={coinBalance}
          totalCoinsPurchased={totalCoinsPurchased}
          chatsStarted={chatsStarted}
          selectedPkg={selectedPkg}
          onSelectPkg={setSelectedPkg}
          onBuy={() => setConfirmOpen(true)}
          recentTxs={recentTxs}
          onSeeAllActivity={() => setActiveTab('transaction')}
        />
      ) : (
        <TransactionView
          filter={txFilter}
          onFilterChange={setTxFilter}
          transactions={transactions}
          onGoToPackages={() => setActiveTab('wallet')}
        />
      )}

      <CoinPurchaseConfirmModal
        visible={confirmOpen}
        pkg={selectedPkg}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmPurchase}
      />
    </SafeAreaView>
  );
}

type StatCardProps = { label: string; value: string };
function StatCard({ label, value }: StatCardProps): React.ReactElement {
  return (
    <View style={[styles.statCard, AppShadows.e1]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type WalletViewProps = {
  coinBalance: number;
  totalCoinsPurchased: number;
  chatsStarted: number;
  selectedPkg: CoinPackage | null;
  onSelectPkg: (pkg: CoinPackage) => void;
  onBuy: () => void;
  recentTxs: ReadonlyArray<WalletTransaction>;
  onSeeAllActivity: () => void;
};

function WalletView({
  coinBalance,
  totalCoinsPurchased,
  chatsStarted,
  selectedPkg,
  onSelectPkg,
  onBuy,
  recentTxs,
  onSeeAllActivity,
}: WalletViewProps): React.ReactElement {
  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.heroCard, AppShadows.e2]}>
          <Text style={styles.heroLabel}>Current Balance</Text>
          <View style={styles.heroBalanceRow}>
            <CoinIcon size={40} />
            <Text style={styles.heroBalance}>{coinBalance.toLocaleString()}</Text>
          </View>
          <Text style={styles.heroEquivalent}>{`≈ ${inr(coinBalance)}`}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Purchased" value={compactNumber(totalCoinsPurchased)} />
          <StatCard label="Chats" value={String(chatsStarted)} />
          <StatCard label="Spent" value={inr(totalCoinsPurchased - coinBalance)} />
        </View>

        <Text style={styles.sectionTitle}>Choose a Package</Text>

        <View style={styles.grid}>
          {COIN_PACKAGES.map(pkg => (
            <CoinPackageCard
              key={pkg.id}
              pkg={pkg}
              selected={selectedPkg?.id === pkg.id}
              onPress={() => onSelectPkg(pkg)}
            />
          ))}
        </View>

        {recentTxs.length > 0 ? (
          <View style={styles.activityWrap}>
            <View style={styles.activityHeader}>
              <Text style={styles.sectionTitleInline}>Recent Activity</Text>
              <Pressable
                accessibilityRole="link"
                hitSlop={8}
                onPress={onSeeAllActivity}
                style={styles.seeAllPress}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <ChevronRightIcon />
              </Pressable>
            </View>
            <View style={[styles.activityCard, AppShadows.e1]}>
              {recentTxs.map((tx, idx) => (
                <View key={tx.id}>
                  {idx > 0 ? <View style={styles.activityDivider} /> : null}
                  <TransactionRow item={tx} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {selectedPkg ? (
        <View style={styles.stickyBuy}>
          <PrimaryButton
            label={`Buy ${totalCoinsFor(selectedPkg)} coins for ${inr(selectedPkg.priceInr)}`}
            onPress={onBuy}
          />
        </View>
      ) : null}
    </>
  );
}

type TransactionViewProps = {
  filter: WalletTransactionFilter;
  onFilterChange: (f: WalletTransactionFilter) => void;
  transactions: ReadonlyArray<WalletTransaction>;
  onGoToPackages: () => void;
};

function TransactionView({
  filter,
  onFilterChange,
  transactions,
  onGoToPackages,
}: TransactionViewProps): React.ReactElement {
  const grouped = useMemo(() => {
    const now = new Date();
    const buckets: Record<DayBucket, WalletTransaction[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };
    for (const tx of transactions) {
      buckets[bucketFor(tx.occurredAt, now)].push(tx);
    }
    return (['today', 'yesterday', 'thisWeek', 'older'] as const)
      .map(b => ({ bucket: b, items: buckets[b] }))
      .filter(g => g.items.length > 0);
  }, [transactions]);

  return (
    <View style={styles.txWrap}>
      <View style={styles.chipRow}>
        {TX_FILTERS.map(f => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={filter === f.value}
            onPress={() => onFilterChange(f.value)}
          />
        ))}
      </View>

      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <CoinIcon size={64} />
          </View>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptyBody}>
            Buy your first coin pack to start chatting. Your activity will show up here.
          </Text>
          <View style={styles.emptyCta}>
            <PrimaryButton label="Browse Packages" onPress={onGoToPackages} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.txList}>
          {grouped.map(group => (
            <View key={group.bucket} style={styles.txGroup}>
              <Text style={styles.txGroupHeader}>{BUCKET_LABEL[group.bucket]}</Text>
              <View style={[styles.txGroupCard, AppShadows.e1]}>
                {group.items.map((tx, idx) => (
                  <View key={tx.id}>
                    {idx > 0 ? <View style={styles.activityDivider} /> : null}
                    <TransactionRow item={tx} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + FAB_PROTRUSION + AppSpacing.lg;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
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
  bellWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  sliderWrap: { paddingHorizontal: AppSpacing.md, marginTop: AppSpacing.sm },
  scroll: { paddingBottom: BOTTOM_CLEAR + 80 },

  heroCard: {
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.md,
    borderRadius: AppRadii.xl,
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.lg + 4,
    backgroundColor: AppColors.primaryLight,
  },
  heroLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.primaryDark,
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
    color: AppColors.primaryDark,
    fontWeight: '800',
    lineHeight: 56,
  },
  heroEquivalent: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.xs,
  },

  // Stat cards row below the hero — clean white surface cards
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: AppSpacing.md,
    marginTop: AppSpacing.md,
    gap: AppSpacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.md,
    paddingVertical: AppSpacing.md,
    paddingHorizontal: AppSpacing.sm,
    alignItems: 'center',
  },
  statValue: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    fontWeight: '800',
  },
  statLabel: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Package grid
  sectionTitle: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.lg,
    marginBottom: AppSpacing.sm,
  },
  sectionTitleInline: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.md,
    rowGap: AppSpacing.sm + 4,
  },

  // Recent activity teaser
  activityWrap: {
    marginTop: AppSpacing.lg,
    paddingHorizontal: AppSpacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppSpacing.sm,
  },
  seeAllPress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
    fontWeight: '700',
  },
  activityCard: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    overflow: 'hidden',
  },
  activityDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.divider,
    marginLeft: 60,
  },

  // Sticky buy
  stickyBuy: {
    position: 'absolute',
    left: AppSpacing.md,
    right: AppSpacing.md,
    bottom: BOTTOM_CLEAR,
  },

  // Transaction view
  txWrap: { flex: 1 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppSpacing.xs,
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
  },
  txList: {
    paddingBottom: BOTTOM_CLEAR,
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.md,
  },
  txGroup: { marginBottom: AppSpacing.md },
  txGroupHeader: {
    ...AppTypography.labelLarge,
    color: AppColors.primaryDark,
    fontWeight: '700',
    marginBottom: AppSpacing.xs,
    marginLeft: AppSpacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  txGroupCard: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    overflow: 'hidden',
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingHorizontal: AppSpacing.xl,
    paddingTop: AppSpacing.xxl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppSpacing.md,
  },
  emptyTitle: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  emptyBody: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
    paddingHorizontal: AppSpacing.md,
  },
  emptyCta: {
    marginTop: AppSpacing.lg,
    alignSelf: 'stretch',
  },
});

export default WalletScreen;
