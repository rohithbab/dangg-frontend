import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  cancelAnimation,
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Avatar from '@core/components/Avatar';
import CoinIcon from '@core/components/CoinIcon';
import PaginationLoader from '@core/components/PaginationLoader';
import PrimaryButton from '@core/components/PrimaryButton';
import { BOTTOM_NAV_HEIGHT, FAB_PROTRUSION } from '@core/config/constants';
import { useRealtimeChannel } from '@core/hooks/useRealtimeChannel';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { useSessionStore } from '@store/sessionStore';

import { sendChatRequest } from '@features/chatRequests/api/chatRequestApi';
import ChatRequestConfirmModal from '@features/chatRequests/components/ChatRequestConfirmModal';
import InsufficientCoinsModal from '@features/chatRequests/components/InsufficientCoinsModal';
import { fetchWalletSnapshot } from '@features/wallet/api/walletApi';
import { COIN_PACKAGES } from '@features/wallet/constants';
import { useCoinBalance, useWalletStore } from '@features/wallet/store/walletStore';

import {
  type AvailableFemale,
  browseFemales,
  listFavorites,
  toggleFavorite,
} from '../api/maleHomeApi';
import AvailableFemaleCard from '../components/AvailableFemaleCard';
import FemaleSearchFilterSheet from '../components/FemaleSearchFilterSheet';
import { GradientFill } from '../components/HomeGradients';
import { HC, HGradient } from '../homeTheme';
import { useFemaleFiltersStore } from '../store/femaleFiltersStore';

type Nav = NativeStackNavigationProp<MaleAppStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.6);
const GRID_HORIZONTAL_PADDING = AppSpacing.md;
const GRID_GAP = AppSpacing.sm + 4;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;
const PAGE_SIZE = 20;

function FilterIcon(): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A1 1 0 0 0 18.95 4H5.04a1 1 0 0 0-.79 1.61z"
        fill={HC.primary}
      />
    </Svg>
  );
}

function ChatsIcon(): React.ReactElement {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
        fill={HC.text}
      />
    </Svg>
  );
}

function SearchOffIcon(): React.ReactElement {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24">
      <Path
        d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        fill={HC.textDim}
      />
    </Svg>
  );
}

function firstNameFromSession(fullName: string | undefined): string {
  if (!fullName) {
    return 'there';
  }
  return fullName.split(/\s+/)[0] ?? fullName;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

function mixHexColor(from: string, to: string, amount: number): string {
  const start = Number.parseInt(from.replace('#', ''), 16);
  const end = Number.parseInt(to.replace('#', ''), 16);
  const mix = (shift: number): number => {
    const a = (start >> shift) & 255;
    const b = (end >> shift) & 255;
    return Math.round(a + (b - a) * amount);
  };
  return `#${[mix(16), mix(8), mix(0)].map(value => value.toString(16).padStart(2, '0')).join('')}`;
}

function GradientGreetingName({ name }: { name: string }): React.ReactElement {
  const letters = Array.from(name);
  const denominator = Math.max(letters.length - 1, 1);

  return (
    <Text style={styles.greetingName}>
      {letters.map((letter, index) => (
        <Text
          key={`${letter}-${index}`}
          style={{ color: mixHexColor(HGradient[0], HGradient[1], index / denominator) }}
        >
          {letter}
        </Text>
      ))}
    </Text>
  );
}

function ChevronLeft(): React.ReactElement {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" fill={HC.text} />
    </Svg>
  );
}

function PreviewHeartIcon({ filled }: { filled: boolean }): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? HC.primary : 'transparent'}
        stroke={filled ? 'transparent' : '#FFFFFF'}
        strokeWidth={filled ? 0 : 2}
      />
    </Svg>
  );
}

function PreviewStarIcon({ size, color }: { size: number; color: string }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={color}
      />
    </Svg>
  );
}

function StatCol({ value, label }: { value: string; label: string }): React.ReactElement {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type FavoriteItemProps = {
  item: AvailableFemale;
  onPress: (
    item: AvailableFemale,
    pageX: number,
    pageY: number,
    width: number,
    height: number,
  ) => void;
};

function FavoriteItem({ item, onPress }: FavoriteItemProps): React.ReactElement {
  const itemRef = React.useRef<View>(null);

  const handlePress = useCallback(() => {
    if (itemRef.current) {
      itemRef.current.measure((_x, _y, width, height, pageX, pageY) => {
        onPress(item, pageX, pageY, width, height);
      });
    }
  }, [item, onPress]);

  return (
    <Pressable accessibilityRole="button" onPress={handlePress} style={styles.favItem}>
      <View ref={itemRef} collapsable={false} style={styles.favAvatarRing}>
        <GradientFill radius={999} />
        <View style={styles.favAvatarInner}>
          <Avatar uri={item.imageUrl} size={64} initials={initialsFromName(item.name)} />
        </View>
      </View>
      {item.isOnline ? <View style={styles.favStatusDot} /> : null}
      <Text style={styles.favName} numberOfLines={1}>
        {item.name}
      </Text>
    </Pressable>
  );
}

/**
 * Male Home — the browse-females surface. 2-column FlashList grid, header
 * with greeting + coin pill + bell, quick filter chip row, favorites
 * carousel, infinite scroll, pull-to-refresh.
 */
function MaleHomeScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const sessionName = useSessionStore(s => s.session?.user.user_metadata?.name);
  const firstName = firstNameFromSession(sessionName);
  const { top: topInset } = useSafeAreaInsets();

  const coinBalance = useCoinBalance();
  const filters = useFemaleFiltersStore();
  const activeFilterCount = useFemaleFiltersStore(s => s.activeCount)();

  const [items, setItems] = useState<ReadonlyArray<AvailableFemale>>([]);
  const [favorites, setFavorites] = useState<ReadonlyArray<AvailableFemale>>([]);
  const [totalOnline, setTotalOnline] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Genie Shared Element Transition states
  const [selectedFavorite, setSelectedFavorite] = useState<AvailableFemale | null>(null);
  const [genieCoords, setGenieCoords] = useState({ x: 0, y: 0, w: 72, h: 72 });
  const [isGenieActive, setIsGenieActive] = useState(false);
  const genieProgress = useSharedValue(0);
  // 0 = circle-expand (favorites), 1 = settle/zoom-in (discovery cards).
  const genieSettle = useSharedValue(0);

  const walletCoins = useWalletStore(s => s.coinBalance);
  const spend = useWalletStore(s => s.spend);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFavoritePress = useCallback(
    (
      item: AvailableFemale,
      pageX: number,
      pageY: number,
      width: number,
      height: number,
      settle = false,
    ) => {
      // Cancel any in-flight close animation and reset immediately so reopen is always clean
      cancelAnimation(genieProgress);
      genieProgress.value = 0;
      genieSettle.value = settle ? 1 : 0;
      setGenieCoords({
        x: pageX || SCREEN_WIDTH / 2 - 36,
        y: pageY || 180,
        w: width || 72,
        h: height || 72,
      });
      setSelectedFavorite(item);
      setIsGenieActive(true);
      genieProgress.value = withTiming(1, { duration: settle ? 340 : 280 });
    },
    [genieProgress, genieSettle],
  );

  const handleCloseGenie = useCallback(() => {
    // Always clear state — even if animation is interrupted — to prevent stale genie state
    genieProgress.value = withTiming(0, { duration: 250 }, () => {
      runOnJS(setIsGenieActive)(false);
      runOnJS(setSelectedFavorite)(null);
    });
  }, [genieProgress]);

  // Pan-to-close: drag down maps directly to genieProgress so the modal
  // visually shrinks toward the avatar in sync with the finger.
  //
  // Uses the *Capture* variants so the outer View intercepts the touch
  // before the inner ScrollView claims it. Without capture, the ScrollView
  // always wins vertical drags.
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onMoveShouldSetPanResponderCapture: (_evt, gestureState) =>
        gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        cancelAnimation(genieProgress);
      },
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) {
          // Map drag distance to progress: 0..halfScreen -> 1..0
          const progress = Math.max(0, 1 - gestureState.dy / (SCREEN_HEIGHT * 0.5));
          genieProgress.value = progress;
        } else {
          genieProgress.value = 1;
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const shouldClose = gestureState.dy > SCREEN_HEIGHT * 0.18 || gestureState.vy > 0.8;
        if (shouldClose) {
          genieProgress.value = withTiming(0, { duration: 220 }, finished => {
            if (finished) {
              runOnJS(setIsGenieActive)(false);
              runOnJS(setSelectedFavorite)(null);
            }
          });
        } else {
          genieProgress.value = withTiming(1, { duration: 220 });
        }
      },
      onPanResponderTerminate: () => {
        genieProgress.value = withTiming(1, { duration: 220 });
      },
    }),
  ).current;

  useEffect(() => {
    if (!isGenieActive) {
      return;
    }
    const onBackPress = () => {
      handleCloseGenie();
      return true;
    };
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [isGenieActive, handleCloseGenie]);

  const handleSendPress = useCallback((): void => {
    if (!selectedFavorite) {
      return;
    }
    if (walletCoins < selectedFavorite.coinPrice) {
      setInsufficientOpen(true);
      return;
    }
    setConfirmOpen(true);
  }, [walletCoins, selectedFavorite]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (!selectedFavorite || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      spend(selectedFavorite.coinPrice);
      const { requestId, newCoinBalance } = await sendChatRequest({
        femaleId: selectedFavorite.id,
        coinCost: selectedFavorite.coinPrice,
      });
      // Reconcile the optimistic spend with the server's authoritative balance
      // (the backend may have auto-granted a dev top-up to cover the cost).
      if (newCoinBalance !== null) {
        useWalletStore.getState().setBalance(newCoinBalance);
      }
      setConfirmOpen(false);
      handleCloseGenie();
      navigation.navigate('ChatRequestSent', { requestId });
    } catch (e) {
      logger.warn('sendChatRequest failed', e);
      useWalletStore.getState().credit(selectedFavorite.coinPrice);
    } finally {
      setSubmitting(false);
    }
  }, [selectedFavorite, navigation, spend, submitting, handleCloseGenie]);

  // ─── Genie circle animation ─────────────────────────────────────────────
  // Strategy: the overlay literally starts AS the avatar circle (same position
  // and size) and expands to fill the screen. `overflow: 'hidden'` clips it
  // to a circle shape via borderRadius. No opacity tricks — the circle is
  // always visible so the user sees it grow in real-time.

  const animatedOverlayStyle = useAnimatedStyle(() => {
    const p = genieProgress.value;
    if (genieSettle.value === 1) {
      // Settle: a full-screen page that gently scales up + fades into place.
      return {
        left: 0,
        top: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        borderRadius: 0,
        opacity: interpolate(p, [0, 1], [0, 1]),
        transform: [{ scale: interpolate(p, [0, 1], [0.94, 1]) }],
      };
    }
    const { x, y, w, h } = genieCoords;
    const diameter = Math.max(w, h);
    return {
      left: interpolate(p, [0, 1], [x, 0]),
      top: interpolate(p, [0, 1], [y, 0]),
      width: interpolate(p, [0, 1], [diameter, SCREEN_WIDTH]),
      height: interpolate(p, [0, 1], [diameter, SCREEN_HEIGHT]),
      borderRadius: interpolate(p, [0, 1], [diameter / 2, 0]),
      opacity: 1,
      transform: [{ scale: 1 }],
    };
  });

  // Profile content: always full-screen sized, offset so it appears at the
  // correct screen coordinates regardless of the overlay's current position.
  const profileContentStyle = useAnimatedStyle(() => {
    const p = genieProgress.value;
    if (genieSettle.value === 1) {
      return {
        position: 'absolute' as const,
        left: 0,
        top: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        opacity: interpolate(p, [0, 0.5], [0, 1], Extrapolate.CLAMP),
      };
    }
    const { x, y } = genieCoords;
    return {
      position: 'absolute' as const,
      left: interpolate(p, [0, 1], [-x, 0]),
      top: interpolate(p, [0, 1], [-y, 0]),
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      opacity: interpolate(p, [0.25, 0.75], [0, 1], Extrapolate.CLAMP),
    };
  });

  // Avatar photo fills the expanding circle until content fades in (circle mode
  // only — the settle animation shows the full page directly).
  const circleHeroStyle = useAnimatedStyle(() => ({
    opacity:
      genieSettle.value === 1
        ? 0
        : interpolate(genieProgress.value, [0, 0.45], [1, 0], Extrapolate.CLAMP),
  }));

  // Buttons sit OUTSIDE the clipping overlay so they are never cropped.
  // They fade in once the overlay is large enough.
  const genieButtonsAnimStyle = useAnimatedStyle(() => ({
    top: topInset + 8,
    opacity: interpolate(genieProgress.value, [0.55, 1], [0, 1], Extrapolate.CLAMP),
  }));

  const renderFavoriteItem = useCallback(
    ({ item }: { item: AvailableFemale }) => (
      <FavoriteItem item={item} onPress={handleFavoritePress} />
    ),
    [handleFavoritePress],
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
      const {
        items: page,
        hasMore: more,
        totalOnline: online,
      } = await browseFemales(filtersSnapshot, PAGE_SIZE, 0);
      setItems(page);
      setHasMore(more);
      setTotalOnline(online);
      setInitialLoaded(true);
    } catch (e) {
      logger.warn('browseFemales failed', e);
    }
  }, [filtersSnapshot]);

  const loadFavorites = useCallback(async (): Promise<void> => {
    try {
      setFavorites(await listFavorites());
    } catch (e) {
      logger.warn('listFavorites failed', e);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  useRealtimeChannel(
    'male_home_females_realtime',
    channel =>
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'females',
        },
        payload => {
          logger.info('Realtime update on females table:', payload);
          void loadFirstPage();
          void loadFavorites();
        },
      ),
    [loadFirstPage, loadFavorites],
  );

  useFocusEffect(
    useCallback(() => {
      fetchWalletSnapshot().catch(e => logger.warn('Wallet snapshot failed', e));
    }, []),
  );

  // Live presence refresh. This stack's Realtime doesn't deliver `females`
  // changes, so the realtime channel above can't update the grid on its own.
  // While this screen is focused, re-fetch the discovery list on an interval so
  // a female toggling availability appears/disappears on her own — no manual
  // pull-to-refresh. Stops on blur/unmount.
  useFocusEffect(
    useCallback(() => {
      const id = setInterval(() => {
        void loadFirstPage();
        void loadFavorites();
      }, 5000);
      return () => clearInterval(id);
    }, [loadFirstPage, loadFavorites]),
  );

  const handleRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([loadFirstPage(), loadFavorites()]);
    setRefreshing(false);
  }, [loadFavorites, loadFirstPage]);

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

  const handleToggleFavorite = useCallback(
    async (femaleId: string): Promise<void> => {
      const flip = (list: ReadonlyArray<AvailableFemale>): ReadonlyArray<AvailableFemale> =>
        list.map(f => (f.id === femaleId ? { ...f, isFavorited: !f.isFavorited } : f));
      setItems(prev => flip(prev));
      try {
        const nowFavorited = await toggleFavorite(femaleId);
        // Reconcile: if the server disagrees with our optimistic flip, correct.
        setItems(prev =>
          prev.map(f => (f.id === femaleId ? { ...f, isFavorited: nowFavorited } : f)),
        );
        void loadFavorites();
      } catch (e) {
        logger.warn('toggleFavorite failed', e);
        setItems(prev => flip(prev));
      }
    },
    [loadFavorites],
  );

  const handleToggleFavoriteInsideGenie = useCallback(async (): Promise<void> => {
    if (!selectedFavorite) {
      return;
    }
    const targetId = selectedFavorite.id;
    setSelectedFavorite(prev => (prev ? { ...prev, isFavorited: !prev.isFavorited } : null));
    await handleToggleFavorite(targetId);
  }, [selectedFavorite, handleToggleFavorite]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<AvailableFemale>): React.ReactElement => {
      const isLeftColumn = index % 2 === 0;
      return (
        <View style={isLeftColumn ? styles.cardWrapLeft : styles.cardWrapRight}>
          <AvailableFemaleCard
            female={item}
            width={CARD_WIDTH}
            onPress={(x, y, w, h) => handleFavoritePress(item, x, y, w, h, true)}
            onToggleFavorite={() => {
              void handleToggleFavorite(item.id);
            }}
          />
        </View>
      );
    },
    [handleFavoritePress, handleToggleFavorite],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            Hi, <GradientGreetingName name={firstName} />
          </Text>
          <Text style={styles.subgreeting}>Find your match</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to wallet"
            hitSlop={6}
            onPress={() => navigation.navigate('MaleTabs', { screen: 'Wallet' })}
            style={styles.coinPill}
          >
            <CoinIcon size={18} />
            <Text style={styles.coinPillText}>{String(coinBalance)}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chats"
            hitSlop={12}
            onPress={() => navigation.navigate('ChatsInbox')}
            style={styles.chatsButton}
          >
            <ChatsIcon />
          </Pressable>
        </View>
      </View>

      <FlashList<AvailableFemale>
        data={items}
        keyExtractor={f => f.id}
        renderItem={renderItem}
        numColumns={2}
        estimatedItemSize={Math.round((CARD_WIDTH * 5) / 4 + GRID_GAP)}
        contentContainerStyle={styles.gridContent}
        onEndReached={() => {
          void handleEndReached();
        }}
        onEndReachedThreshold={0.2}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={HC.primary}
            colors={[HC.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {favorites.length > 0 ? (
                <View style={styles.favSection}>
                  <View style={styles.favHeader}>
                    <Text style={styles.favTitle}>Your Favorites</Text>
                  </View>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={favorites}
                  keyExtractor={f => f.id}
                  contentContainerStyle={styles.favListContent}
                  renderItem={renderFavoriteItem}
                />
              </View>
            ) : null}

            <View style={styles.availableHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filter and sort"
                onPress={() => setFilterSheetOpen(true)}
                style={styles.filterIconWrap}
                hitSlop={8}
              >
                <FilterIcon />
                {activeFilterCount > 0 ? (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{String(activeFilterCount)}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Text style={styles.availableTitle}>Available Now</Text>
              <Text style={styles.availableCount}>{`(${totalOnline} online)`}</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          initialLoaded ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <SearchOffIcon />
              </View>
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

      <Modal
        visible={isGenieActive}
        transparent
        animationType="none"
        onRequestClose={handleCloseGenie}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="auto" {...panResponder.panHandlers}>
          {selectedFavorite && (
            <>
              {/*
               * Expanding circle overlay.
               * Starts at avatar position as a circle; grows to fill the screen.
               * overflow:'hidden' + borderRadius creates the live circle clip.
               */}
              <Animated.View style={[styles.genieOverlay, animatedOverlayStyle]}>
                {/* Phase 1 — avatar photo fills the expanding circle */}
                <Animated.View
                  style={[StyleSheet.absoluteFill, circleHeroStyle]}
                  pointerEvents="none"
                >
                  <FastImage
                    source={{ uri: selectedFavorite.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                </Animated.View>

                {/* Phase 2 — full profile content, offset so it sits at correct screen coords */}
                <Animated.View style={profileContentStyle}>
                  <ScrollView contentContainerStyle={styles.genieScroll}>
                    <View style={[styles.genieHero, { height: HERO_HEIGHT }]}>
                      <FastImage
                        source={{ uri: selectedFavorite.imageUrl }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                      <Svg
                        style={styles.genieHeroGradient}
                        width="100%"
                        height={Math.round(HERO_HEIGHT * 0.4)}
                        preserveAspectRatio="none"
                      >
                        <Defs>
                          <LinearGradient id="genieHeroFade" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor="#000000" stopOpacity="0" />
                            <Stop offset="100%" stopColor="#000000" stopOpacity="0.9" />
                          </LinearGradient>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#genieHeroFade)" />
                      </Svg>

                      <View style={styles.genieHeroBottom}>
                        <Text
                          style={styles.genieHeroName}
                        >{`${selectedFavorite.name}, ${selectedFavorite.age}`}</Text>
                        <View style={styles.genieHeroMetaRow}>
                          <View style={styles.genieHeroMetaLeft}>
                            <View
                              style={[
                                styles.genieHeroDot,
                                {
                                  backgroundColor: selectedFavorite.isOnline
                                    ? HC.success
                                    : HC.textFaint,
                                },
                              ]}
                            />
                            <Text style={styles.genieHeroMetaText}>
                              {selectedFavorite.isOnline ? 'Online now' : 'Offline'}
                            </Text>
                          </View>
                          <View style={styles.genieHeroMetaRight}>
                            <PreviewStarIcon size={16} color="#FBBF24" />
                            <Text style={styles.genieHeroMetaText}>
                              {`${selectedFavorite.rating.toFixed(1)} (${selectedFavorite.totalChats ?? 12} chats)`}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.genieBodyBlock}>
                      <View style={styles.genieActionRow}>
                        <View style={styles.geniePricePill}>
                          <Text
                            style={styles.geniePricePillText}
                          >{`${selectedFavorite.coinPrice} coins per chat`}</Text>
                        </View>
                        <Text style={styles.genieResponseText}>
                          {`Responds in ${selectedFavorite.averageResponseMinutes ?? 5} min`}
                        </Text>
                      </View>

                      <Text style={styles.genieSectionTitle}>About</Text>
                      <Text style={styles.genieBioText}>
                        {selectedFavorite.bio || 'Available for chats and matches.'}
                      </Text>

                      <View style={styles.genieStatsCard}>
                        <StatCol value={String(selectedFavorite.totalChats ?? 12)} label="Chats" />
                        <View style={styles.genieStatDivider} />
                        <StatCol
                          value={(selectedFavorite.rating ?? 4.8).toFixed(1)}
                          label="Rating"
                        />
                        <View style={styles.genieStatDivider} />
                        <StatCol
                          value={`${selectedFavorite.averageResponseMinutes ?? 5}m`}
                          label="Response"
                        />
                      </View>
                    </View>
                  </ScrollView>

                  <View style={styles.genieCtaWrap} pointerEvents="auto">
                    <PrimaryButton
                      label={`Send Chat Request — ${selectedFavorite.coinPrice} coins`}
                      onPress={handleSendPress}
                    />
                    <Text
                      style={styles.genieBalanceHint}
                    >{`Your balance: ${walletCoins} coins`}</Text>
                  </View>
                </Animated.View>
              </Animated.View>

              {/*
               * Back + Heart buttons live OUTSIDE the expanding overlay so they
               * are never clipped. They fade in once the overlay is large enough.
               */}
              <Animated.View
                style={[styles.genieButtonsRow, genieButtonsAnimStyle]}
                pointerEvents="auto"
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                  onPress={handleCloseGenie}
                  hitSlop={12}
                  style={styles.genieIconBtn}
                >
                  <ChevronLeft />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    selectedFavorite.isFavorited ? 'Unfavorite' : 'Add to favorites'
                  }
                  onPress={() => {
                    void handleToggleFavoriteInsideGenie();
                  }}
                  hitSlop={12}
                  style={styles.genieIconBtn}
                >
                  <PreviewHeartIcon filled={selectedFavorite.isFavorited} />
                </Pressable>
              </Animated.View>
            </>
          )}
        </View>
      </Modal>

      {selectedFavorite && (
        <>
          <ChatRequestConfirmModal
            visible={confirmOpen}
            femaleName={selectedFavorite.name}
            femaleAvatarUrl={selectedFavorite.imageUrl}
            coinCost={selectedFavorite.coinPrice}
            currentBalance={walletCoins}
            submitting={submitting}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              void handleConfirm();
            }}
          />

          <InsufficientCoinsModal
            visible={insufficientOpen}
            femaleName={selectedFavorite.name}
            coinCost={selectedFavorite.coinPrice}
            currentBalance={walletCoins}
            topUpCoins={COIN_PACKAGES[0]?.baseCoins ?? 100}
            topUpInr={COIN_PACKAGES[0]?.priceInr ?? 99}
            onCancel={() => setInsufficientOpen(false)}
            onTopUp={() => {
              setInsufficientOpen(false);
              handleCloseGenie();
              navigation.navigate('PaymentProcessing', {
                packageId: COIN_PACKAGES[0]?.id ?? 'pkg-100',
              });
            }}
            onGoToWallet={() => {
              setInsufficientOpen(false);
              handleCloseGenie();
              navigation.navigate('MaleTabs', { screen: 'Wallet' });
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const BOTTOM_CLEAR = BOTTOM_NAV_HEIGHT + FAB_PROTRUSION + AppSpacing.lg;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: HC.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.md,
    paddingTop:
      Platform.OS === 'android' ? AppSpacing.sm + (StatusBar.currentHeight ?? 0) : AppSpacing.sm,
  },
  headerLeft: { flex: 1 },
  greeting: {
    ...AppTypography.titleLarge,
    color: HC.text,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginLeft: 1,
  },
  greetingName: { fontWeight: '800' },
  subgreeting: {
    ...AppTypography.bodyMedium,
    color: HC.textDim,
    marginTop: 0,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: AppSpacing.xs },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: HC.glass,
    borderWidth: 1,
    borderColor: HC.hairline,
    height: 34,
    paddingHorizontal: AppSpacing.sm + 4,
    borderRadius: AppRadii.full,
  },
  coinPillText: {
    ...AppTypography.labelLarge,
    color: HC.text,
    fontWeight: '800',
  },
  chatsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: HC.glass,
    borderWidth: 1,
    borderColor: HC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: HC.surface,
    borderWidth: 1,
    borderColor: HC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: AppSpacing.xs,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: HC.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    ...AppTypography.labelSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  favSection: { marginTop: AppSpacing.md },
  favHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  favTitle: {
    ...AppTypography.titleLarge,
    color: HC.text,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  favListContent: {
    paddingHorizontal: 0,
    gap: AppSpacing.sm + 2,
    paddingTop: AppSpacing.sm,
  },
  favItem: { width: 84, alignItems: 'center', position: 'relative' },
  favAvatarRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    padding: 2.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favAvatarInner: {
    borderRadius: 999,
    padding: 2.5,
    backgroundColor: HC.bg,
  },
  favStatusDot: {
    position: 'absolute',
    bottom: 24,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: HC.success,
    borderWidth: 2.5,
    borderColor: HC.bg,
  },
  favName: {
    ...AppTypography.bodySmall,
    color: HC.text,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  availableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginTop: AppSpacing.lg,
    marginBottom: AppSpacing.sm,
    gap: 8,
  },
  availableTitle: {
    ...AppTypography.titleLarge,
    color: HC.text,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  availableCount: {
    ...AppTypography.bodyMedium,
    color: HC.textDim,
  },
  gridContent: { paddingHorizontal: GRID_HORIZONTAL_PADDING, paddingBottom: BOTTOM_CLEAR },
  cardWrapLeft: {
    marginBottom: GRID_GAP,
    marginLeft: 0,
    marginRight: GRID_GAP / 2,
  },
  cardWrapRight: {
    marginBottom: GRID_GAP,
    marginLeft: GRID_GAP / 2,
    marginRight: 0,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: AppSpacing.lg,
    paddingVertical: AppSpacing.xl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: HC.surface,
    borderWidth: 1,
    borderColor: HC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...AppTypography.titleLarge,
    color: HC.text,
    fontWeight: '700',
    marginTop: AppSpacing.md,
  },
  emptyBody: {
    ...AppTypography.bodyMedium,
    color: HC.textDim,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
  },
  genieOverlay: {
    position: 'absolute',
    backgroundColor: HC.bg,
    zIndex: 9999,
    overflow: 'hidden',
  },
  genieScroll: { paddingBottom: 180 },
  genieHero: { width: '100%', backgroundColor: HC.cardHi, position: 'relative' },
  genieHeroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  genieButtonsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.md,
    zIndex: 10000,
  },
  genieIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: HC.glassStrong,
    borderWidth: 1,
    borderColor: HC.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genieHeroBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: AppSpacing.md,
    paddingBottom: AppSpacing.md,
  },
  genieHeroName: {
    ...AppTypography.headlineLarge,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  genieHeroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  genieHeroMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  genieHeroMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  genieHeroDot: { width: 10, height: 10, borderRadius: 5 },
  genieHeroMetaText: {
    ...AppTypography.bodyMedium,
    color: '#FFFFFF',
    opacity: 0.95,
  },
  genieBodyBlock: { paddingHorizontal: AppSpacing.md, paddingTop: AppSpacing.md },
  genieActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: AppSpacing.sm,
  },
  geniePricePill: {
    backgroundColor: HC.primarySoft,
    borderWidth: 1,
    borderColor: HC.hairline,
    borderRadius: AppRadii.full,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: 6,
  },
  geniePricePillText: {
    ...AppTypography.labelLarge,
    color: HC.primary,
    fontWeight: '800',
  },
  genieResponseText: {
    ...AppTypography.bodyMedium,
    color: HC.textDim,
  },
  genieSectionTitle: {
    ...AppTypography.titleMedium,
    color: HC.text,
    fontWeight: '700',
    marginTop: AppSpacing.lg,
  },
  genieBioText: {
    ...AppTypography.bodyLarge,
    color: HC.text,
    marginTop: 4,
  },
  genieStatsCard: {
    flexDirection: 'row',
    backgroundColor: HC.card,
    borderWidth: 1,
    borderColor: HC.hairline,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.md,
    marginTop: AppSpacing.lg,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statValue: {
    ...AppTypography.titleLarge,
    color: HC.text,
    fontWeight: '800',
  },
  statLabel: {
    ...AppTypography.bodySmall,
    color: HC.textDim,
    marginTop: 2,
  },
  genieStatDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: HC.border,
    marginVertical: 4,
  },
  genieCtaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
    paddingBottom: AppSpacing.md,
    backgroundColor: HC.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HC.border,
  },
  genieBalanceHint: {
    ...AppTypography.bodySmall,
    color: HC.textDim,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
  },
});

export default MaleHomeScreen;
