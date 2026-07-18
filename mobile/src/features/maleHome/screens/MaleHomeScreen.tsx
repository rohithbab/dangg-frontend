import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { MessageCircle } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
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
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import CoinIcon from '@core/components/CoinIcon';
import ConfirmationDialog from '@core/components/ConfirmationDialog';
import GradientAvatar from '@core/components/GradientAvatar';
import PaginationLoader from '@core/components/PaginationLoader';
import PersonRow from '@core/components/PersonRow';
import { BOTTOM_NAV_HEIGHT } from '@core/config/constants';
import { useRealtimeChannel } from '@core/hooks/useRealtimeChannel';
import { AppException } from '@core/network/apiException';
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

  const session = useSessionStore(s => s.session);
  const firstName = firstNameFromSession(session?.user.user_metadata?.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const filters = useFemaleFiltersStore();

  const [items, setItems] = useState<ReadonlyArray<AvailableFemale>>([]);
  const [favorites, setFavorites] = useState<ReadonlyArray<AvailableFemale>>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [selected, setSelected] = useState<AvailableFemale | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  // Hardware/gesture back on this tab's root would otherwise exit the app
  // with no warning — intercept and confirm first.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setExitConfirmOpen(true);
        return true;
      });
      return () => sub.remove();
    }, []),
  );

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
      const [{ items: page, hasMore: more }, favs] = await Promise.all([
        browseFemales(filtersSnapshot, PAGE_SIZE, 0),
        listFavorites().catch(() => [] as ReadonlyArray<AvailableFemale>),
      ]);
      setItems(page);
      setHasMore(more);
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
    if (coinBalance < selected.coinPrice) {
      setInsufficientOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      const { requestId, newCoinBalance } = await sendChatRequest({
        femaleId: selected.id,
        coinCost: 0,
      });
      if (newCoinBalance !== null) {
        useWalletStore.getState().setBalance(newCoinBalance);
      }
      setConfirmOpen(false);
      navigation.navigate('ChatRequestSent', { requestId, femaleName: selected.name });
    } catch (e) {
      logger.warn('sendChatRequest failed', e);
      setConfirmOpen(false);
      // Surface the reason (e.g. "She is busy in another chat…") instead of
      // silently swallowing it, so the male knows to try again later.
      const message =
        e instanceof AppException ? e.message : 'Could not send the request. Please try again.';
      Alert.alert('Couldn’t send request', message);
    } finally {
      setSubmitting(false);
    }
  }, [selected, submitting, coinBalance, navigation]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AvailableFemale>): React.ReactElement => (
      <View style={styles.rowWrap}>
        <PersonRow
          name={item.name}
          age={item.age}
          rating={item.rating}
          coinPrice={item.coinPrice}
          imageUrl={item.imageUrl}
          isBusy={item.isBusy}
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
            <Text style={styles.favLabel}>Favorites</Text>
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
            ) : (
              <View style={styles.favEmpty}>
                <Text style={styles.favEmptyText}>No favorites added yet</Text>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Online now</Text>
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

      <ConfirmationDialog
        visible={exitConfirmOpen}
        title="Exit Dangg?"
        body="Are you sure you want to close the app?"
        confirmLabel="Exit"
        cancelLabel="Stay"
        destructive
        onConfirm={() => {
          setExitConfirmOpen(false);
          BackHandler.exitApp();
        }}
        onCancel={() => setExitConfirmOpen(false)}
      />
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
    paddingTop: Platform.OS === 'android' ? AppSpacing.xl : AppSpacing.lg,
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
  favLabel: {
    fontFamily: InterFont.light,
    fontSize: 22,
    letterSpacing: -0.44,
    color: AppColors.onSurface,
    marginTop: AppSpacing.xl,
  },
  rail: { gap: 12, paddingTop: AppSpacing.md, paddingRight: AppSpacing.lg },
  favEmpty: {
    paddingTop: AppSpacing.md,
    paddingBottom: AppSpacing.xs,
  },
  favEmptyText: {
    fontFamily: InterFont.light,
    fontSize: 14,
    color: '#8C8C94',
  },
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
