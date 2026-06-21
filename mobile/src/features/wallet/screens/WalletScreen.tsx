import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import CoinIcon from '@core/components/CoinIcon';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { inr } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

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
import { GradientFill, HeroBackdrop } from '../components/WalletGradients';
import { COIN_PACKAGES, type CoinPackage, totalCoinsFor } from '../constants';
import { useCoinBalance } from '../store/walletStore';
import { WC, WR, WS, WShadow } from '../walletTheme';

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

// ─── Icons ──────────────────────────────────────────────────────────────────
function BellIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={WC.text}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" stroke={WC.text} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function HistoryIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8v4l3 2"
        stroke={WC.text}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.05 11a9 9 0 1 1 .5 4"
        stroke={WC.text}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 4v4h4"
        stroke={WC.text}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon(): React.ReactElement {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14ZM20 20l-3.2-3.2"
        stroke={WC.textDim}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SortIcon(): React.ReactElement {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M7 12h10M10 18h4"
        stroke={WC.text}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
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
 * Male Wallet tab — premium fintech redesign (scoped to the wallet feature).
 *
 *   * Wallet view — frosted balance hero + analytics stat cards + subscription
 *     style coin packs + recent activity + sticky buy CTA.
 *   * Transaction view — analytics overview + glass search/sort + segmented
 *     category control + premium activity feed.
 *
 * All data, navigation routes, payment flow and store logic are unchanged.
 */
function WalletScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const coinBalance = useCoinBalance();

  const [activeTab, setActiveTab] = useState<WalletTab>('wallet');
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [txFilter, setTxFilter] = useState<WalletTransactionFilter>('all');
  const [transactions, setTransactions] = useState<ReadonlyArray<WalletTransaction>>([]);
  const [recentTxs, setRecentTxs] = useState<ReadonlyArray<WalletTransaction>>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [walletRefreshing, setWalletRefreshing] = useState(false);
  const [txRefreshing, setTxRefreshing] = useState(false);

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
    setTxLoading(true);
    listTransactions(txFilter)
      .then(setTransactions)
      .catch(e => logger.warn('Transactions load failed', e))
      .finally(() => setTxLoading(false));
  }, [activeTab, txFilter]);

  const handleConfirmPurchase = useCallback((): void => {
    if (!selectedPkg) {
      return;
    }
    setConfirmOpen(false);
    navigation.navigate('PaymentProcessing', { packageId: selectedPkg.id });
  }, [navigation, selectedPkg]);

  const handleWalletRefresh = useCallback(async (): Promise<void> => {
    setWalletRefreshing(true);
    try {
      await Promise.all([
        fetchWalletSnapshot(),
        listTransactions('all').then(txs => setRecentTxs(txs.slice(0, 3))),
      ]);
    } catch (e) {
      logger.warn('Wallet refresh failed', e);
    } finally {
      setWalletRefreshing(false);
    }
  }, []);

  const handleTxRefresh = useCallback(async (): Promise<void> => {
    setTxRefreshing(true);
    try {
      setTransactions(await listTransactions(txFilter));
    } catch (e) {
      logger.warn('Transactions refresh failed', e);
    } finally {
      setTxRefreshing(false);
    }
  }, [txFilter]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Wallet</Text>
          <Text style={styles.headerSubtitle}>Manage your balance and purchases</Text>
        </View>
        <View style={styles.headerIcons}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={6}
            onPress={() => navigation.navigate('Notifications')}
            style={styles.iconBtn}
          >
            <View style={styles.iconDot} />
            <BellIcon />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Transaction history"
            hitSlop={6}
            onPress={() => setActiveTab('transaction')}
            style={styles.iconBtn}
          >
            <HistoryIcon />
          </Pressable>
        </View>
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
          selectedPkg={selectedPkg}
          onSelectPkg={setSelectedPkg}
          onBuy={() => setConfirmOpen(true)}
          recentTxs={recentTxs}
          onSeeAllActivity={() => setActiveTab('transaction')}
          refreshing={walletRefreshing}
          onRefresh={handleWalletRefresh}
        />
      ) : (
        <TransactionView
          filter={txFilter}
          onFilterChange={setTxFilter}
          transactions={transactions}
          loading={txLoading}
          refreshing={txRefreshing}
          onRefresh={handleTxRefresh}
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

// ─── Wallet view ──────────────────────────────────────────────────────────────
type WalletViewProps = {
  coinBalance: number;
  selectedPkg: CoinPackage | null;
  onSelectPkg: (pkg: CoinPackage) => void;
  onBuy: () => void;
  recentTxs: ReadonlyArray<WalletTransaction>;
  onSeeAllActivity: () => void;
  refreshing: boolean;
  onRefresh: () => void;
};

function WalletView({
  coinBalance,
  selectedPkg,
  onSelectPkg,
  onBuy,
  recentTxs,
  onSeeAllActivity,
  refreshing,
  onRefresh,
}: WalletViewProps): React.ReactElement {
  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={WC.primary}
            colors={[WC.primary]}
          />
        }
      >
        {/* Balance hero */}
        <Animated.View entering={FadeInDown.duration(480)} style={[styles.hero, WShadow.hero]}>
          <HeroBackdrop radius={WR.hero} />
          <View style={styles.heroTopHighlight} pointerEvents="none" />
          <Text style={styles.heroLabel}>CURRENT BALANCE</Text>
          <View style={styles.heroBalanceRow}>
            <Text style={styles.heroBalance}>{coinBalance.toLocaleString()}</Text>
            <Text style={styles.heroUnit}>Coins</Text>
          </View>
        </Animated.View>

        {/* Coin packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose your coin pack</Text>
          <Text style={styles.sectionSubtitle}>Unlock conversations instantly with more coins</Text>
        </View>

        <View style={styles.pkgList}>
          {COIN_PACKAGES.map((pkg, index) => (
            <Animated.View key={pkg.id} entering={FadeInDown.duration(380).delay(120 + index * 55)}>
              <CoinPackageCard
                pkg={pkg}
                selected={selectedPkg?.id === pkg.id}
                onPress={() => onSelectPkg(pkg)}
              />
            </Animated.View>
          ))}
        </View>

        {/* Trust strip */}
        <View style={styles.trust}>
          <TrustItem label="Instant Delivery" />
          <TrustItem label="Secure Payment" />
          <TrustItem label="No Hidden Charges" />
        </View>

        {/* Recent activity teaser */}
        {recentTxs.length > 0 ? (
          <View style={styles.activityWrap}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>Recent Activity</Text>
              <Pressable accessibilityRole="link" hitSlop={8} onPress={onSeeAllActivity}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <View style={styles.feedCard}>
              {recentTxs.map((tx, idx) => (
                <View key={tx.id}>
                  {idx > 0 ? <View style={styles.feedDivider} /> : null}
                  <TransactionRow item={tx} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {selectedPkg ? (
        <Animated.View entering={FadeInDown.duration(260)} style={styles.stickyBuy}>
          <Pressable
            accessibilityRole="button"
            onPress={onBuy}
            style={({ pressed }) => [styles.buyBtn, WShadow.primary, pressed && styles.pressed]}
          >
            <GradientFill radius={WR.md + 2} />
            <Text style={styles.buyBtnText}>
              {`Buy ${totalCoinsFor(selectedPkg)} coins · ${inr(selectedPkg.priceInr)}`}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </>
  );
}

function TrustItem({ label }: { label: string }): React.ReactElement {
  return (
    <View style={styles.trustItem}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 6 9 17l-5-5"
          stroke={WC.successText}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={styles.trustText}>{label}</Text>
    </View>
  );
}

// ─── Transaction view ─────────────────────────────────────────────────────────
type TransactionViewProps = {
  filter: WalletTransactionFilter;
  onFilterChange: (f: WalletTransactionFilter) => void;
  transactions: ReadonlyArray<WalletTransaction>;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onGoToPackages: () => void;
};

function TransactionView({
  filter,
  onFilterChange,
  transactions,
  loading,
  refreshing,
  onRefresh,
  onGoToPackages,
}: TransactionViewProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>(
    'date_desc',
  );

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

  const sortLabel =
    sortBy === 'date_desc'
      ? 'Newest'
      : sortBy === 'date_asc'
        ? 'Oldest'
        : sortBy === 'amount_desc'
          ? 'Highest'
          : 'Lowest';

  return (
    <ScrollView
      style={styles.txWrap}
      contentContainerStyle={styles.txScroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={WC.primary}
          colors={[WC.primary]}
        />
      }
    >
      {/* Search + sort */}
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions…"
            placeholderTextColor={WC.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort: ${sortLabel}`}
          onPress={toggleSort}
          style={({ pressed }) => [styles.sortBtn, pressed && styles.pressed]}
        >
          <SortIcon />
          <Text style={styles.sortLabel}>{sortLabel}</Text>
        </Pressable>
      </View>

      {/* Category segmented control */}
      <View style={styles.filterWrap}>
        <SliderTabs<WalletTransactionFilter>
          options={TX_FILTERS}
          value={filter}
          onChange={onFilterChange}
        />
      </View>

      {loading ? (
        <SkeletonFeed />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState onGoToPackages={onGoToPackages} />
      ) : (
        grouped.map(group => (
          <View key={group.bucket} style={styles.txGroup}>
            <Text style={styles.feedHeader}>{BUCKET_LABEL[group.bucket]}</Text>
            <View style={styles.feedCard}>
              {group.items.map((tx, idx) => (
                <Animated.View key={tx.id} entering={FadeIn.duration(280).delay(idx * 40)}>
                  {idx > 0 ? <View style={styles.feedDivider} /> : null}
                  <TransactionRow item={tx} />
                </Animated.View>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ─── Skeleton + empty ─────────────────────────────────────────────────────────
function SkeletonFeed(): React.ReactElement {
  const pulse = useSharedValue(0.4);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.8, { duration: 700 }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.txGroup}>
      <View style={[styles.skelLine, styles.skelHeader]} />
      <View style={styles.feedCard}>
        {[0, 1, 2, 3].map(i => (
          <View key={i}>
            {i > 0 ? <View style={styles.feedDivider} /> : null}
            <View style={styles.skelRow}>
              <Animated.View style={[styles.skelIcon, pulseStyle]} />
              <View style={styles.skelMid}>
                <Animated.View style={[styles.skelLine, styles.skelLineLg, pulseStyle]} />
                <Animated.View style={[styles.skelLine, styles.skelLineSm, pulseStyle]} />
              </View>
              <Animated.View style={[styles.skelAmt, pulseStyle]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function EmptyState({ onGoToPackages }: { onGoToPackages: () => void }): React.ReactElement {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <CoinIcon size={56} />
      </View>
      <Text style={styles.emptyTitle}>No transactions yet</Text>
      <Text style={styles.emptyBody}>
        Your purchases, chats and refunds will appear here once you get started.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onGoToPackages}
        style={({ pressed }) => [styles.emptyBtn, WShadow.primary, pressed && styles.pressed]}
      >
        <GradientFill radius={WR.md} />
        <Text style={styles.emptyBtnText}>Browse Packages</Text>
      </Pressable>
    </View>
  );
}

const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + FAB_PROTRUSION + WS.lg;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WC.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: WS.xl,
    paddingTop: WS.md,
    paddingBottom: WS.sm,
  },
  headerTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, color: WC.primary },
  headerSubtitle: { fontSize: 13, fontWeight: '500', color: WC.textDim, marginTop: 3 },
  headerIcons: { flexDirection: 'row', gap: WS.sm + 2 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: WR.md - 2,
    backgroundColor: WC.glass,
    borderWidth: 1,
    borderColor: WC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: WC.primary,
    borderWidth: 1.5,
    borderColor: WC.bg,
    zIndex: 1,
  },

  sliderWrap: { paddingHorizontal: WS.xl, marginTop: WS.md, marginBottom: WS.xs },
  scroll: { paddingBottom: BOTTOM_CLEAR + 88 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.94 },

  // Hero
  hero: {
    marginHorizontal: WS.xl,
    marginTop: WS.md,
    borderRadius: WR.hero,
    paddingVertical: WS.xxl,
    paddingHorizontal: WS.xl,
    borderWidth: 1,
    borderColor: WC.hairline,
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
    fontWeight: '600',
    color: WC.textDim,
    textAlign: 'center',
  },
  heroBalanceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 12 },
  heroBalance: { fontSize: 46, fontWeight: '800', letterSpacing: -1, color: WC.text, lineHeight: 48 },
  heroUnit: { fontSize: 18, fontWeight: '600', color: WC.textDim, marginBottom: 6 },

  // Section
  section: { marginHorizontal: WS.xl, marginTop: WS.xxl },
  sectionTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, color: WC.primary },
  sectionSubtitle: { fontSize: 13, fontWeight: '500', color: WC.textDim, marginTop: 3 },

  // Packages
  pkgList: { marginHorizontal: WS.xl, marginTop: WS.md, gap: WS.md },

  // Trust strip
  trust: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: WS.xl,
    marginTop: WS.lg,
    backgroundColor: WC.surface,
    borderWidth: 1,
    borderColor: WC.hairline,
    borderRadius: WR.md,
    paddingVertical: WS.md,
    paddingHorizontal: WS.md + 2,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { fontSize: 11.5, fontWeight: '600', color: WC.textDim },

  // Recent activity
  activityWrap: { marginHorizontal: WS.xl, marginTop: WS.xxl },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: WS.sm + 2,
  },
  activityTitle: { fontSize: 18, fontWeight: '700', color: WC.primary },
  seeAll: { fontSize: 14, fontWeight: '700', color: WC.primary },

  // Feed (shared)
  feedCard: {
    backgroundColor: WC.card,
    borderWidth: 1,
    borderColor: WC.hairline,
    borderRadius: WR.lg,
    overflow: 'hidden',
  },
  feedDivider: { height: 1, backgroundColor: WC.divider, marginLeft: 60 },
  feedHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: WC.textDim,
    marginBottom: WS.sm,
    marginLeft: WS.xs,
  },

  // Sticky buy
  stickyBuy: { position: 'absolute', left: WS.xl, right: WS.xl, bottom: BOTTOM_CLEAR },
  buyBtn: {
    height: 56,
    borderRadius: WR.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: WC.primary,
  },
  buyBtnText: { fontSize: 16, fontWeight: '800', color: WC.text },

  // Transaction view
  txWrap: { flex: 1 },
  txScroll: { paddingBottom: BOTTOM_CLEAR + 24, paddingTop: WS.sm },
  txGroup: { marginHorizontal: WS.xl, marginTop: WS.lg },

  // Search + sort
  searchRow: { flexDirection: 'row', gap: WS.sm + 2, marginHorizontal: WS.xl, marginTop: WS.lg },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: WS.sm + 2,
    backgroundColor: WC.surface,
    borderWidth: 1,
    borderColor: WC.hairline,
    borderRadius: WR.md,
    height: 46,
    paddingHorizontal: WS.md + 2,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', color: WC.text, padding: 0 },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 46,
    paddingHorizontal: WS.md + 2,
    borderRadius: WR.md,
    backgroundColor: WC.surface,
    borderWidth: 1,
    borderColor: WC.hairline,
  },
  sortLabel: { fontSize: 13, fontWeight: '700', color: WC.text },

  filterWrap: { marginHorizontal: WS.xl, marginTop: WS.md },

  // Skeleton
  skelHeader: { width: 70, height: 12, marginBottom: WS.sm, marginLeft: WS.xs, borderRadius: 6 },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: WS.md, padding: WS.md + 3 },
  skelIcon: { width: 44, height: 44, borderRadius: WR.md - 2, backgroundColor: WC.cardHi },
  skelMid: { flex: 1, gap: 6 },
  skelLine: { backgroundColor: WC.cardHi, borderRadius: 6 },
  skelLineLg: { width: '60%', height: 13 },
  skelLineSm: { width: '40%', height: 11 },
  skelAmt: { width: 44, height: 16, borderRadius: 6, backgroundColor: WC.cardHi },

  // Empty
  empty: { alignItems: 'center', paddingHorizontal: WS.xl, paddingTop: WS.huge + 12 },
  emptyIcon: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: WC.card,
    borderWidth: 1,
    borderColor: WC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: WS.lg,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: WC.text },
  emptyBody: {
    fontSize: 13.5,
    fontWeight: '500',
    color: WC.textDim,
    textAlign: 'center',
    marginTop: WS.sm,
    lineHeight: 20,
    paddingHorizontal: WS.md,
  },
  emptyBtn: {
    marginTop: WS.xl,
    height: 50,
    paddingHorizontal: WS.xxl,
    borderRadius: WR.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: WC.primary,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '800', color: WC.text },
});

export default WalletScreen;
