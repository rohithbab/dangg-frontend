import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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

import { InterFont } from '@theme/typography';

import CoinIcon from '@core/components/CoinIcon';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { type WalletTransaction, fetchWalletSnapshot, listTransactions } from '../api/walletApi';
import SliderTabs from '../components/SliderTabs';
import { useCoinBalance } from '../store/walletStore';
import { WC, WR, WS } from '../walletTheme';

type Nav = NativeStackNavigationProp<MaleAppStackParamList>;
type WalletFilter = 'all' | 'spent' | 'added';

const PAD = 24;
const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + FAB_PROTRUSION + WS.lg;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FILTERS: ReadonlyArray<{ value: WalletFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'spent', label: 'Spent' },
  { value: 'added', label: 'Added' },
];

function txDateLabel(date: Date, now: Date = new Date()): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) {
    let h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `Today · ${h}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

// ─── Row icons ────────────────────────────────────────────────────────────────
function PurchaseIcon(): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8v8M8 12h8" stroke={WC.successText} strokeWidth={1.9} strokeLinecap="round" />
      <Path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke={WC.successText} strokeWidth={1.7} />
    </Svg>
  );
}

function ChatIcon(): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"
        stroke={WC.textDim}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GiftIcon(): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12v8H4v-8M2 8h20v4H2zM12 8v12M12 8s-1-4-4-4a2 2 0 0 0 0 4h4Zm0 0s1-4 4-4a2 2 0 0 1 0 4h-4Z"
        stroke={WC.successText}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RowIcon({ kind }: { kind: WalletTransaction['kind'] }): React.ReactElement {
  if (kind === 'purchase') {
    return <PurchaseIcon />;
  }
  if (kind === 'refund') {
    return <GiftIcon />;
  }
  return <ChatIcon />;
}

function TxRow({ item }: { item: WalletTransaction }): React.ReactElement {
  const positive = item.coinDelta > 0;
  const sign = positive ? '+' : '−';
  const magnitude = Math.abs(item.coinDelta).toLocaleString();
  return (
    <View style={styles.txRow}>
      <View style={styles.txTile}>
        <RowIcon kind={item.kind} />
      </View>
      <View style={styles.txMid}>
        <Text style={styles.txTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.txSub} numberOfLines={1}>
          {txDateLabel(item.occurredAt)}
        </Text>
      </View>
      <Text style={[styles.txAmount, positive ? styles.txAmountPos : styles.txAmountNeg]}>
        {`${sign}${magnitude}`}
      </Text>
    </View>
  );
}

/**
 * Male Wallet tab (B11) — balance, an "Add coins" entry into the Coin Store,
 * an All / Spent / Added filter, and the transaction list. Buying coins lives
 * on the separate Coin Store screen; this screen is balance + history.
 */
function WalletScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const coinBalance = useCoinBalance();

  const [filter, setFilter] = useState<WalletFilter>('all');
  const [transactions, setTransactions] = useState<ReadonlyArray<WalletTransaction>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    await Promise.all([
      fetchWalletSnapshot().catch(e => logger.warn('Wallet snapshot failed', e)),
      listTransactions('all')
        .then(setTransactions)
        .catch(e => logger.warn('Transactions load failed', e)),
    ]);
  }, []);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
    );
    if (filter === 'spent') {
      return sorted.filter(t => t.coinDelta < 0);
    }
    if (filter === 'added') {
      return sorted.filter(t => t.coinDelta > 0);
    }
    return sorted;
  }, [transactions, filter]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={WC.primary}
            colors={[WC.primary]}
          />
        }
      >
        <Text style={styles.title}>Wallet</Text>

        {/* Balance + Add coins */}
        <Animated.View entering={FadeInDown.duration(420)} style={styles.balanceRow}>
          <View style={styles.balanceLeft}>
            <CoinIcon size={22} />
            <View>
              <Text style={styles.balanceNum}>{coinBalance.toLocaleString()}</Text>
              <Text style={styles.coinsLabel}>coins</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add coins"
            onPress={() => navigation.navigate('CoinStore')}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          >
            <Text style={styles.addBtnText}>Add coins</Text>
          </Pressable>
        </Animated.View>

        {/* Filter */}
        <View style={styles.filterWrap}>
          <SliderTabs<WalletFilter> options={FILTERS} value={filter} onChange={setFilter} />
        </View>

        {/* List */}
        {loading ? (
          <SkeletonList />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.list}>
            {filtered.map((tx, idx) => (
              <Animated.View key={tx.id} entering={FadeIn.duration(260).delay(idx * 35)}>
                <TxRow item={tx} />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SkeletonList(): React.ReactElement {
  const pulse = useSharedValue(0.4);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.85, { duration: 700 }), -1, true);
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.list}>
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={styles.txRow}>
          <Animated.View style={[styles.txTile, styles.skelTile, pulseStyle]} />
          <View style={styles.txMid}>
            <Animated.View style={[styles.skelLine, styles.skelLineLg, pulseStyle]} />
            <Animated.View style={[styles.skelLine, styles.skelLineSm, pulseStyle]} />
          </View>
          <Animated.View style={[styles.skelAmt, pulseStyle]} />
        </View>
      ))}
    </View>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No transactions yet</Text>
      <Text style={styles.emptyBody}>Your purchases, chats and bonuses will show up here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: WC.bg },
  flex: { flex: 1 },
  scroll: { paddingBottom: BOTTOM_CLEAR + 24 },
  pressed: { transform: [{ scale: 0.96 }], opacity: 0.92 },

  title: {
    fontFamily: InterFont.light,
    fontSize: 30,
    letterSpacing: -0.75,
    color: WC.text,
    paddingHorizontal: PAD,
    marginTop: WS.xl,
  },

  // Balance
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    marginTop: WS.lg,
  },
  balanceLeft: { flexDirection: 'row', alignItems: 'center', gap: WS.md },
  balanceNum: {
    fontFamily: InterFont.light,
    fontSize: 52,
    lineHeight: 60,
    letterSpacing: -1,
    color: WC.text,
  },
  coinsLabel: { fontFamily: InterFont.regular, fontSize: 14, color: WC.textDim, marginTop: -4 },
  addBtn: {
    height: 46,
    paddingHorizontal: WS.xl,
    borderRadius: WR.lg + 3,
    backgroundColor: WC.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontFamily: InterFont.medium, fontSize: 15, color: WC.text },

  // Filter
  filterWrap: { paddingHorizontal: PAD, marginTop: WS.xl },

  // List
  list: { paddingHorizontal: PAD, marginTop: WS.lg, gap: WS.lg + 2 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: WS.md },
  txTile: {
    width: 44,
    height: 44,
    borderRadius: WR.sm,
    backgroundColor: WC.surfaceDeep,
    borderWidth: 1,
    borderColor: WC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMid: { flex: 1, minWidth: 0 },
  txTitle: { fontFamily: InterFont.regular, fontSize: 15, color: WC.text },
  txSub: { fontFamily: InterFont.regular, fontSize: 12, color: WC.textDim, marginTop: 3 },
  txAmount: { fontFamily: InterFont.medium, fontSize: 15.5 },
  txAmountPos: { color: WC.success },
  txAmountNeg: { color: WC.textDim },

  // Skeleton
  skelTile: { backgroundColor: WC.cardHi, borderColor: WC.transparent },
  skelLine: { backgroundColor: WC.cardHi, borderRadius: 6 },
  skelLineLg: { width: '55%', height: 13 },
  skelLineSm: { width: '35%', height: 11, marginTop: 7 },
  skelAmt: { width: 44, height: 16, borderRadius: 6, backgroundColor: WC.cardHi },

  // Empty
  empty: { alignItems: 'center', paddingHorizontal: PAD, paddingTop: WS.huge + WS.lg },
  emptyTitle: { fontFamily: InterFont.medium, fontSize: 17, color: WC.text },
  emptyBody: {
    fontFamily: InterFont.regular,
    fontSize: 13.5,
    color: WC.textDim,
    textAlign: 'center',
    marginTop: WS.sm,
    lineHeight: 20,
  },
});

export default WalletScreen;
