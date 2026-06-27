import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { MessageCircle, Search } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import CoinIcon from '@core/components/CoinIcon';
import GradientAvatar from '@core/components/GradientAvatar';
import PaginationLoader from '@core/components/PaginationLoader';
import PersonRow from '@core/components/PersonRow';
import { BOTTOM_NAV_HEIGHT } from '@core/config/constants';
import { useRealtimeChannel } from '@core/hooks/useRealtimeChannel';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { useSessionStore } from '@store/sessionStore';

import { sendChatRequest } from '@features/chatRequests/api/chatRequestApi';
import ChatRequestConfirmModal from '@features/chatRequests/components/ChatRequestConfirmModal';
import InsufficientCoinsModal from '@features/chatRequests/components/InsufficientCoinsModal';
import { getProfile } from '@features/profile/api/profileApi';
import { fetchWalletSnapshot } from '@features/wallet/api/walletApi';
import { COIN_PACKAGES } from '@features/wallet/constants';
import { useCoinBalance, useWalletStore } from '@features/wallet/store/walletStore';

import { type AvailableFemale, browseFemales, listFavorites } from '../api/maleHomeApi';
import FemaleSearchFilterSheet from '../components/FemaleSearchFilterSheet';
import { useFemaleFiltersStore } from '../store/femaleFiltersStore';

type Nav = NativeStackNavigationProp<MaleAppStackParamList>;

const PAGE_SIZE = 20;
const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + AppSpacing.xl + AppSpacing.md;

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

/**
 * Male Home (Neue) — Discover surface. Header (brand + coin balance + chats),
 * search, an "online now" avatar rail, and a single-column list of person
 * rows with a per-row Chat CTA. Data layer (browse, wallet, realtime, chat
 * request) is unchanged from the previous implementation.
 */
function MaleHomeScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const coinBalance = useCoinBalance();
  const spend = useWalletStore(s => s.spend);
  const session = useSessionStore(s => s.session);
  const firstName = firstNameFromSession(session?.user.user_metadata?.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const activeFilterCount = useFemaleFiltersStore(s => s.activeCount)();
  const filters = useFemaleFiltersStore();

  const [items, setItems] = useState<ReadonlyArray<AvailableFemale>>([]);
  const [favorites, setFavorites] = useState<ReadonlyArray<AvailableFemale>>([]);
  const [totalOnline, setTotalOnline] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [selected, setSelected] = useState<AvailableFemale | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filtersSnapshot = useMemo(
    () => ({
      quick: filters.quick,
      onlineOnly: filters.onlineOnly,
      ageMin: filters.ageMin,
      ageMax: filters.ageMax,
      rating: filters.rating,
      price: filters.price,
      sortBy: filters.sortBy,
    }),
    [
      filters.quick,
      filters.onlineOnly,
      filters.ageMin,
      filters.ageMax,
      filters.rating,
      filters.price,
      filters.sortBy,
    ],
  );

  const loadFirstPage = useCallback(async (): Promise<void> => {
    try {
      const [{ items: page, hasMore: more, totalOnline: online }, favs] = await Promise.all([
        browseFemales(filtersSnapshot, PAGE_SIZE, 0),
        listFavorites().catch(() => [] as ReadonlyArray<AvailableFemale>),
      ]);
      setItems(page);
      setHasMore(more);
      setTotalOnline(online);
      setFavorites(favs);
      setInitialLoaded(true);
    } catch (e) {
      logger.warn('browseFemales failed', e);
    }
  }, [filtersSnapshot]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  useRealtimeChannel(
    'male_home_females_realtime',
    channel =>
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'females' }, () => {
        void loadFirstPage();
      }),
    [loadFirstPage],
  );

  useFocusEffect(
    useCallback(() => {
      fetchWalletSnapshot().catch(e => logger.warn('Wallet snapshot failed', e));
      getProfile()
        .then(p => setAvatarUrl(p.avatarUrl))
        .catch(e => logger.warn('MaleHome: getProfile failed', e));
      const id = setInterval(() => {
        void loadFirstPage();
      }, 5000);
      return () => clearInterval(id);
    }, [loadFirstPage]),
  );

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  const handleEndReached = useCallback(async (): Promise<void> => {
    if (loadingMore || !hasMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const { items: more, hasMore: stillMore } = await browseFemales(
        filtersSnapshot,
        PAGE_SIZE,
        items.length,
      );
      setItems(prev => [...prev, ...more]);
      setHasMore(stillMore);
    } catch (e) {
      logger.warn('browseFemales pagination failed', e);
    } finally {
      setLoadingMore(false);
    }
  }, [filtersSnapshot, hasMore, items.length, loadingMore]);

  const openProfile = useCallback(
    (female: AvailableFemale): void => {
      navigation.navigate('FemaleProfilePreview', { femaleId: female.id });
    },
    [navigation],
  );

  const handleChatPress = useCallback(
    (female: AvailableFemale): void => {
      setSelected(female);
      if (coinBalance < female.coinPrice) {
        setInsufficientOpen(true);
        return;
      }
      setConfirmOpen(true);
    },
    [coinBalance],
  );

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (!selected || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      spend(selected.coinPrice);
      const { requestId, newCoinBalance } = await sendChatRequest({
        femaleId: selected.id,
        coinCost: selected.coinPrice,
      });
      if (newCoinBalance !== null) {
        useWalletStore.getState().setBalance(newCoinBalance);
      }
      setConfirmOpen(false);
      navigation.navigate('ChatRequestSent', { requestId, femaleName: selected.name });
    } catch (e) {
      logger.warn('sendChatRequest failed', e);
      useWalletStore.getState().credit(selected.coinPrice);
    } finally {
      setSubmitting(false);
    }
  }, [selected, submitting, spend, navigation]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AvailableFemale>): React.ReactElement => (
      <View style={styles.rowWrap}>
        <PersonRow
          name={item.name}
          age={item.age}
          rating={item.rating}
          coinPrice={item.coinPrice}
          imageUrl={item.imageUrl}
          onPress={() => openProfile(item)}
          onChat={() => handleChatPress(item)}
        />
      </View>
    ),
    [openProfile, handleChatPress],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.topBar}>
        <View style={styles.greetWrap}>
          <GradientAvatar
            initials={firstName.slice(0, 1).toUpperCase()}
            seed={session?.user.id ?? firstName}
            uri={avatarUrl}
            size={46}
            shape="squircle"
          />
          <View style={styles.greetText}>
            <Text style={styles.greeting}>{greetingForNow()}</Text>
            <Text style={styles.greetName} numberOfLines={1}>
              {firstName}
            </Text>
          </View>
        </View>
        <View style={styles.topRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Wallet"
            onPress={() => navigation.navigate('MaleTabs', { screen: 'Wallet' })}
            style={styles.balancePill}
          >
            <CoinIcon size={16} />
            <Text style={styles.balanceText}>{coinBalance.toLocaleString()}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chats"
            hitSlop={10}
            onPress={() => navigation.navigate('ChatsInbox')}
            style={styles.chatBtn}
          >
            <MessageCircle size={20} color={AppColors.onSurface} strokeWidth={1.9} />
          </Pressable>
        </View>
      </View>

      <FlashList<AvailableFemale>
        data={items}
        keyExtractor={f => f.id}
        renderItem={renderItem}
        estimatedItemSize={92}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          void handleEndReached();
        }}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={AppColors.primary}
            colors={[AppColors.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Discover</Text>
            <Text style={styles.subtitle}>{`${totalOnline} people online now`}</Text>

            <Pressable
              accessibilityRole="search"
              onPress={() => setFilterSheetOpen(true)}
              style={styles.search}
            >
              <Search size={20} color="#808087" strokeWidth={1.8} />
              <Text style={styles.searchText}>Search people</Text>
              {activeFilterCount > 0 ? <View style={styles.searchBadge} /> : null}
            </Pressable>

            {favorites.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rail}
              >
                {favorites.map(f => (
                  <Pressable
                    key={f.id}
                    accessibilityRole="button"
                    accessibilityLabel={f.name}
                    onPress={() => openProfile(f)}
                    style={styles.railItem}
                  >
                    <GradientAvatar
                      initials={f.name.slice(0, 1).toUpperCase()}
                      seed={f.id}
                      uri={f.imageUrl}
                      size={56}
                      online={f.isOnline}
                    />
                    <Text style={styles.railName} numberOfLines={1}>
                      {f.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Online now</Text>
              <Pressable accessibilityRole="button" onPress={() => setFilterSheetOpen(true)}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          initialLoaded ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No one available right now</Text>
              <Text style={styles.emptyBody}>Check back in a few minutes</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          items.length > 0 ? <PaginationLoader isLoading={loadingMore} hasMore={hasMore} /> : null
        }
      />

      <FemaleSearchFilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
      />

      {selected ? (
        <>
          <ChatRequestConfirmModal
            visible={confirmOpen}
            femaleName={selected.name}
            femaleAvatarUrl={selected.imageUrl}
            coinCost={selected.coinPrice}
            currentBalance={coinBalance}
            submitting={submitting}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              void handleConfirm();
            }}
          />
          <InsufficientCoinsModal
            visible={insufficientOpen}
            femaleName={selected.name}
            coinCost={selected.coinPrice}
            currentBalance={coinBalance}
            topUpCoins={COIN_PACKAGES[0]?.baseCoins ?? 100}
            topUpInr={COIN_PACKAGES[0]?.priceInr ?? 99}
            onCancel={() => setInsufficientOpen(false)}
            onTopUp={() => {
              setInsufficientOpen(false);
              navigation.navigate('PaymentProcessing', {
                packageId: COIN_PACKAGES[0]?.id ?? 'pkg-100',
              });
            }}
            onGoToWallet={() => {
              setInsufficientOpen(false);
              navigation.navigate('MaleTabs', { screen: 'Wallet' });
            }}
          />
        </>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.lg,
    paddingTop: Platform.OS === 'android' ? AppSpacing.sm : AppSpacing.xs,
    paddingBottom: AppSpacing.sm,
  },
  greetWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  greetText: { flex: 1, minWidth: 0 },
  greeting: { fontFamily: InterFont.light, fontSize: 13, color: '#8C8C94' },
  greetName: {
    fontFamily: InterFont.regular,
    fontSize: 20,
    color: AppColors.onSurface,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 32,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 16,
    backgroundColor: '#0E0E10',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  balanceText: { fontFamily: InterFont.medium, fontSize: 14.5, color: AppColors.onSurface },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0E0E10',
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingHorizontal: AppSpacing.lg, paddingBottom: BOTTOM_CLEAR },
  title: {
    fontFamily: InterFont.light,
    fontSize: 32,
    letterSpacing: -0.64,
    color: AppColors.onSurface,
    marginTop: AppSpacing.sm,
  },
  subtitle: {
    fontFamily: InterFont.light,
    fontSize: 14.5,
    color: '#8C8C94',
    marginTop: 6,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 15,
    borderRadius: AppRadii.lg,
    backgroundColor: '#0E0E10',
    borderWidth: 1,
    borderColor: AppColors.border,
    marginTop: AppSpacing.lg,
  },
  searchText: { fontFamily: InterFont.light, fontSize: 15, color: '#808087' },
  searchBadge: {
    marginLeft: 'auto',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
  },
  rail: { gap: 12, paddingTop: AppSpacing.lg, paddingRight: AppSpacing.lg },
  railItem: { width: 56, alignItems: 'center' },
  railName: {
    fontFamily: InterFont.light,
    fontSize: 12,
    color: '#8C8C94',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: AppSpacing.lg,
    marginBottom: AppSpacing.md,
  },
  sectionTitle: { fontFamily: InterFont.medium, fontSize: 15, color: AppColors.onSurface },
  seeAll: { fontFamily: InterFont.light, fontSize: 13.5, color: AppColors.primary },
  rowWrap: { marginBottom: 8 },
  empty: { alignItems: 'center', paddingVertical: AppSpacing.xxl },
  emptyTitle: {
    fontFamily: InterFont.medium,
    fontSize: 16,
    color: AppColors.onSurface,
    marginTop: AppSpacing.md,
  },
  emptyBody: {
    fontFamily: InterFont.light,
    fontSize: 14,
    color: '#8C8C94',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default MaleHomeScreen;
