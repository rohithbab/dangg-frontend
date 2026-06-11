import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [cardLayout, setCardLayout] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll}>
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
            <View style={styles.heroContent}>
              <Text style={styles.heroLabelWhite}>Current Balance</Text>
              <View style={styles.heroBalanceRow}>
                <CoinIcon size={40} />
                <Text style={styles.heroBalanceWhite}>{coinBalance.toLocaleString()}</Text>
              </View>
            </View>
          </View>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>(
    'date_desc',
  );

  // Compute analytics dynamically
  const analytics = useMemo(() => {
    let purchased = 0;
    let spent = 0;
    let refunded = 0;

    for (const tx of transactions) {
      const amt = Math.abs(tx.coinDelta);
      if (tx.kind === 'purchase') {
        purchased += amt;
      } else if (tx.kind === 'chat') {
        spent += amt;
      } else if (tx.kind === 'refund') {
        refunded += amt;
      }
    }

    const total = purchased + spent + refunded;
    return {
      purchased,
      spent,
      refunded,
      purchasedPct: total > 0 ? (purchased / total) * 100 : 0,
      spentPct: total > 0 ? (spent / total) * 100 : 0,
      refundedPct: total > 0 ? (refunded / total) * 100 : 0,
    };
  }, [transactions]);

  // Apply search and sort filters client-side
  const filteredAndSorted = useMemo(() => {
    let result = [...transactions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        tx =>
          tx.title.toLowerCase().includes(q) ||
          tx.subtitle.toLowerCase().includes(q) ||
          tx.id.toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return b.occurredAt.getTime() - a.occurredAt.getTime();
      }
      if (sortBy === 'date_asc') {
        return a.occurredAt.getTime() - b.occurredAt.getTime();
      }
      if (sortBy === 'amount_desc') {
        return Math.abs(b.coinDelta) - Math.abs(a.coinDelta);
      }
      if (sortBy === 'amount_asc') {
        return Math.abs(a.coinDelta) - Math.abs(b.coinDelta);
      }
      return 0;
    });

    return result;
  }, [transactions, searchQuery, sortBy]);

  const grouped = useMemo(() => {
    const now = new Date();
    const buckets: Record<DayBucket, WalletTransaction[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };
    for (const tx of filteredAndSorted) {
      buckets[bucketFor(tx.occurredAt, now)].push(tx);
    }
    return (['today', 'yesterday', 'thisWeek', 'older'] as const)
      .map(b => ({ bucket: b, items: buckets[b] }))
      .filter(g => g.items.length > 0);
  }, [filteredAndSorted]);

  const toggleSort = () => {
    setSortBy(prev => {
      if (prev === 'date_desc') return 'amount_desc';
      if (prev === 'amount_desc') return 'amount_asc';
      if (prev === 'amount_asc') return 'date_asc';
      return 'date_desc';
    });
  };

  return (
    <View style={styles.txWrap}>
      {/* Analytics Card */}
      <View style={[styles.analyticsCard, AppShadows.e1]}>
        <Text style={styles.analyticsTitle}>Analytics Overview</Text>
        <View style={styles.analyticsStatsRow}>
          <View style={styles.analyticsStat}>
            <Text style={[styles.analyticsStatValue, { color: AppColors.success }]}>
              {analytics.purchased.toLocaleString()}
            </Text>
            <Text style={styles.analyticsStatLabel}>Purchased</Text>
          </View>
          <View style={styles.analyticsStatDivider} />
          <View style={styles.analyticsStat}>
            <Text style={[styles.analyticsStatValue, { color: AppColors.primary }]}>
              {analytics.spent.toLocaleString()}
            </Text>
            <Text style={styles.analyticsStatLabel}>Spent</Text>
          </View>
          <View style={styles.analyticsStatDivider} />
          <View style={styles.analyticsStat}>
            <Text style={[styles.analyticsStatValue, { color: AppColors.info }]}>
              {analytics.refunded.toLocaleString()}
            </Text>
            <Text style={styles.analyticsStatLabel}>Refunded</Text>
          </View>
        </View>

        {/* Proportional Segmented Bar */}
        <View style={styles.analyticsBar}>
          {analytics.purchasedPct > 0 && (
            <View
              style={[
                styles.analyticsBarSegment,
                { flex: analytics.purchasedPct, backgroundColor: AppColors.success },
              ]}
            />
          )}
          {analytics.spentPct > 0 && (
            <View
              style={[
                styles.analyticsBarSegment,
                { flex: analytics.spentPct, backgroundColor: AppColors.primary },
              ]}
            />
          )}
          {analytics.refundedPct > 0 && (
            <View
              style={[
                styles.analyticsBarSegment,
                { flex: analytics.refundedPct, backgroundColor: AppColors.info },
              ]}
            />
          )}
          {analytics.purchased === 0 && analytics.spent === 0 && analytics.refunded === 0 && (
            <View style={[styles.analyticsBarSegment, styles.analyticsBarSegmentEmpty]} />
          )}
        </View>
      </View>

      {/* Search and Sort Row */}
      <View style={styles.searchSortRow}>
        <View style={styles.searchContainer}>
          <Svg width={16} height={16} viewBox="0 0 24 24" style={styles.searchIcon}>
            <Path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              fill={AppColors.onSurfaceMuted}
            />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search description..."
            placeholderTextColor={AppColors.onSurfaceMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        <Pressable style={styles.sortButton} onPress={toggleSort}>
          <Text style={styles.sortButtonText}>
            {sortBy === 'date_desc' && 'Newest'}
            {sortBy === 'date_asc' && 'Oldest'}
            {sortBy === 'amount_desc' && 'Highest Coin'}
            {sortBy === 'amount_asc' && 'Lowest Coin'}
          </Text>
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path d="M3 18h6v-2H3v2zM3 5v2h18V5H3zm0 7h12v-2H3v2z" fill={AppColors.primary} />
          </Svg>
        </Pressable>
      </View>

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

      {filteredAndSorted.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <CoinIcon size={64} />
          </View>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyBody}>
            Try modifying your search query or check your filters.
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
  sliderWrap: { paddingHorizontal: AppSpacing.md, marginTop: AppSpacing.sm },
  scroll: { paddingBottom: BOTTOM_CLEAR + 80 },

  heroCardContainer: {
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.md,
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
  heroContent: {
    zIndex: 1,
    alignItems: 'center',
  },
  heroLabelWhite: {
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
  heroBalanceWhite: {
    ...AppTypography.displayLarge,
    color: '#FFFFFF',
    fontWeight: '800',
    lineHeight: 56,
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

  // Analytics Card
  analyticsCard: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.md,
    padding: AppSpacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  analyticsTitle: {
    ...AppTypography.titleMedium,
    color: AppColors.onSurface,
    fontWeight: '700',
    marginBottom: AppSpacing.sm,
  },
  analyticsStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: AppSpacing.md,
  },
  analyticsStat: {
    flex: 1,
    alignItems: 'center',
  },
  analyticsStatValue: {
    ...AppTypography.titleLarge,
    fontWeight: '800',
  },
  analyticsStatLabel: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  analyticsStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: AppColors.divider,
  },
  analyticsBar: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: AppColors.surfaceVariant,
  },
  analyticsBarSegment: {
    height: '100%',
  },
  analyticsBarSegmentEmpty: {
    flex: 1,
    backgroundColor: AppColors.border,
  },

  // Search & Sort Row
  searchSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: AppSpacing.md,
    marginTop: AppSpacing.md,
    gap: AppSpacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.full,
    paddingHorizontal: AppSpacing.md,
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    ...AppTypography.bodyMedium,
    color: AppColors.onSurface,
    padding: 0,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.full,
    paddingHorizontal: AppSpacing.md,
    height: 40,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  sortButtonText: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
    fontWeight: '700',
    fontSize: 12,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AppSpacing.xs,
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.md,
  },
  txList: {
    paddingBottom: BOTTOM_CLEAR,
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
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
