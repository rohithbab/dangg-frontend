import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';



import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { sendChatRequest } from '@features/chatRequests/api/chatRequestApi';
import ChatRequestConfirmModal from '@features/chatRequests/components/ChatRequestConfirmModal';
import InsufficientCoinsModal from '@features/chatRequests/components/InsufficientCoinsModal';
import { COIN_PACKAGES } from '@features/wallet/constants';
import { useWalletStore } from '@features/wallet/store/walletStore';

import { type AvailableFemale, getFemaleById, toggleFavorite } from '../api/maleHomeApi';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'FemaleProfilePreview'>;
type Route = RouteProp<MaleAppStackParamList, 'FemaleProfilePreview'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.55);

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

/* ─────────────────────── Premium Color Palette ─────────────────────── */
const P = {
  bg: '#09090B',
  surface: '#121217',
  card: '#18181F',
  primary: '#FF4FA3',
  secondary: '#9D5CFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  border: 'rgba(255,255,255,0.05)',
  frosted: 'rgba(15,15,20,0.82)',
  frostedBorder: 'rgba(255,255,255,0.12)',
  scrim: '#09090B',
  onlineGreen: '#10B981',
  offlineGray: '#52525B',
  coinGold: '#F59E0B',
  gradient1: '#FF4FA3',
  gradient2: '#9D5CFF',
} as const;

/* ─────────────────────── SVG Icons ─────────────────────── */

function ChevronLeft(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" fill={P.textPrimary} />
    </Svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? P.primary : 'transparent'}
        stroke={filled ? 'transparent' : P.textPrimary}
        strokeWidth={filled ? 0 : 1.5}
      />
    </Svg>
  );
}

function StarIcon({ size, color }: { size: number; color: string }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={color}
      />
    </Svg>
  );
}

/* ─────────────────────── Pressable Button Wrapper ─────────────────────── */

function AnimatedPressable({
  onPress,
  accessibilityRole,
  accessibilityLabel,
  hitSlop,
  style,
  children,
}: {
  onPress: () => void;
  accessibilityRole: 'button';
  accessibilityLabel: string;
  hitSlop?: number;
  style?: object;
  children: React.ReactNode;
}): React.ReactElement {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        hitSlop={hitSlop}
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/* ─────────────────────── Main Screen ─────────────────────── */

/** Full-bleed female profile preview with sticky Send Chat Request CTA. */
function FemaleProfilePreviewScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { femaleId } = route.params;

  const insets = useSafeAreaInsets();

  const coinBalance = useWalletStore(s => s.coinBalance);
  const spend = useWalletStore(s => s.spend);

  const [female, setFemale] = useState<AvailableFemale | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ── Scroll tracking for header transition ── */
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HERO_HEIGHT * 0.4], [0, 1], 'clamp'),
  }));

  const heroImageStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [-HERO_HEIGHT * 0.3, 0, HERO_HEIGHT * 0.3], [1.15, 1, 0.95], 'clamp');
    const translateY = interpolate(scrollY.value, [0, HERO_HEIGHT * 0.3], [0, HERO_HEIGHT * 0.08], 'clamp');
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  useEffect(() => {
    getFemaleById(femaleId)
      .then(setFemale)
      .catch(e => logger.warn('getFemaleById failed', e));
  }, [femaleId]);

  const handleToggleFavorite = useCallback(async (): Promise<void> => {
    if (!female) {
      return;
    }
    setFemale(prev => (prev ? { ...prev, isFavorited: !prev.isFavorited } : prev));
    try {
      await toggleFavorite(female.id);
    } catch (e) {
      logger.warn('toggleFavorite failed', e);
      setFemale(prev => (prev ? { ...prev, isFavorited: !prev.isFavorited } : prev));
    }
  }, [female]);

  const handleSendPress = useCallback((): void => {
    if (!female) {
      return;
    }
    if (coinBalance < female.coinPrice) {
      setInsufficientOpen(true);
      return;
    }
    setConfirmOpen(true);
  }, [coinBalance, female]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (!female || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      spend(female.coinPrice);
      const { requestId } = await sendChatRequest({
        femaleId: female.id,
        coinCost: female.coinPrice,
      });
      setConfirmOpen(false);
      navigation.replace('ChatRequestSent', { requestId });
    } catch (e) {
      logger.warn('sendChatRequest failed', e);
      // Refund the optimistic spend if the request failed.
      useWalletStore.getState().credit(female.coinPrice);
    } finally {
      setSubmitting(false);
    }
  }, [female, navigation, spend, submitting]);

  if (!female) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const topUpPkg = COIN_PACKAGES[0]!;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* ── Scroll-reactive header backdrop ── */}
      <Animated.View style={[styles.headerBackdrop, headerBgStyle]} pointerEvents="none" />

      <AnimatedScrollView
        contentContainerStyle={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* ═══════════════════ HERO IMAGE ═══════════════════ */}
        <Animated.View
          entering={FadeIn.duration(600)}
          style={[styles.hero, { height: HERO_HEIGHT }]}
        >
          <AnimatedFastImage
            source={{ uri: female.imageUrl }}
            style={[StyleSheet.absoluteFill, heroImageStyle]}
            resizeMode="cover"
          />
          {/* Bottom gradient fade — 70% of hero for cinematic effect */}
          <Svg
            style={styles.heroGradient}
            width="100%"
            height={Math.round(HERO_HEIGHT * 0.7)}
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={P.scrim} stopOpacity="0" />
                <Stop offset="40%" stopColor={P.scrim} stopOpacity="0.3" />
                <Stop offset="70%" stopColor={P.scrim} stopOpacity="0.75" />
                <Stop offset="100%" stopColor={P.scrim} stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#heroFade)" />
          </Svg>

          {/* ── Top Action Buttons ── */}
          <SafeAreaView style={styles.heroOverlay} edges={['top']} pointerEvents="box-none">
            <View style={styles.heroTopRow}>
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => navigation.goBack()}
                hitSlop={8}
                style={styles.iconBtn}
              >
                <ChevronLeft />
              </AnimatedPressable>
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={female.isFavorited ? 'Unfavorite' : 'Add to favorites'}
                onPress={() => {
                  void handleToggleFavorite();
                }}
                hitSlop={8}
                style={styles.iconBtn}
              >
                <HeartIcon filled={female.isFavorited} />
              </AnimatedPressable>
            </View>
          </SafeAreaView>

          {/* ── Hero Bottom Info ── */}
          <View style={styles.heroBottom}>
            <Text style={styles.heroName}>{`${female.name}, ${female.age}`}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.statusPill}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: female.isOnline
                        ? P.onlineGreen
                        : P.offlineGray,
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {female.isOnline ? 'Online now' : 'Offline'}
                </Text>
              </View>
              <View style={styles.ratingBadge}>
                <StarIcon size={14} color={P.coinGold} />
                <Text style={styles.ratingText}>
                  {`${female.rating.toFixed(1)} (${female.totalChats} chats)`}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ═══════════════════ BODY ═══════════════════ */}
        <Animated.View entering={FadeIn.duration(500).delay(200)} style={styles.bodyBlock}>
          {/* ── Price + Response Row ── */}
          <View style={styles.actionRow}>
            <View style={styles.priceCapsule}>
              <Text style={styles.priceCapsuleText}>{`${female.coinPrice} coins per chat`}</Text>
            </View>
            <Text style={styles.responseText}>
              {`Responds in ${female.averageResponseMinutes} min`}
            </Text>
          </View>

          {/* ── About Section ── */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{female.bio}</Text>

          {/* ── Statistics Card (Glassmorphism) ── */}
          <Animated.View
            entering={FadeIn.duration(500).delay(400)}
            style={styles.statsCard}
          >
            <StatCol value={String(female.totalChats)} label="Chats" />
            <View style={styles.statDivider} />
            <StatCol value={female.rating.toFixed(1)} label="Rating" />
            <View style={styles.statDivider} />
            <StatCol value={`${female.averageResponseMinutes}m`} label="Response" />
          </Animated.View>
        </Animated.View>
      </AnimatedScrollView>

      {/* ═══════════════════ BOTTOM CTA ═══════════════════ */}
      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <PremiumCTA
          label={`Send Chat Request — ${female.coinPrice} coins`}
          onPress={handleSendPress}
        />
        <Text style={styles.balanceHint}>{`Your balance: ${coinBalance} coins`}</Text>
      </View>

      <ChatRequestConfirmModal
        visible={confirmOpen}
        femaleName={female.name}
        femaleAvatarUrl={female.imageUrl}
        coinCost={female.coinPrice}
        currentBalance={coinBalance}
        submitting={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void handleConfirm();
        }}
      />

      <InsufficientCoinsModal
        visible={insufficientOpen}
        femaleName={female.name}
        coinCost={female.coinPrice}
        currentBalance={coinBalance}
        topUpCoins={topUpPkg.baseCoins}
        topUpInr={topUpPkg.priceInr}
        onCancel={() => setInsufficientOpen(false)}
        onTopUp={() => {
          setInsufficientOpen(false);
          navigation.navigate('PaymentProcessing', { packageId: topUpPkg.id });
        }}
        onGoToWallet={() => {
          setInsufficientOpen(false);
          navigation.navigate('MaleTabs', { screen: 'Wallet' });
        }}
      />
    </View>
  );
}

/* ─────────────────────── Stat Column ─────────────────────── */

function StatCol({ value, label }: { value: string; label: string }): React.ReactElement {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ─────────────────────── Premium CTA Button ─────────────────────── */

function PremiumCTA({ label, onPress }: { label: string; onPress: () => void }): React.ReactElement {
  const scale = useSharedValue(1);
  const gradientId = React.useId();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 25, stiffness: 350 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        }}
        style={ctaStyles.base}
      >
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FF4FA3" />
              <Stop offset="0.55" stopColor="#E84393" />
              <Stop offset="1" stopColor="#D946EF" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" rx={20} fill={`url(#${gradientId})`} />
        </Svg>
        <View style={ctaStyles.inner}>
          <Text style={ctaStyles.label}>{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const ctaStyles = StyleSheet.create({
  base: {
    minHeight: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#E84393',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
    includeFontPadding: false,
  },
});

/* ═══════════════════════════════════════════════════════════════════════
   STYLES — Premium Luxury Design System
   ═══════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  /* ── Root ── */
  safe: {
    flex: 1,
    backgroundColor: P.bg,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.bg,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: P.textSecondary,
  },
  scroll: {
    paddingBottom: 180,
  },

  /* ── Scroll-reactive header backdrop ── */
  headerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? 56 + (StatusBar.currentHeight ?? 0) : 100,
    backgroundColor: P.bg,
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.border,
  },

  /* ── Hero Image ── */
  hero: {
    width: '100%',
    backgroundColor: P.surface,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === 'android' ? 12 + (StatusBar.currentHeight ?? 0) : 8,
  },

  /* ── Frosted glass icon buttons ── */
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: P.frosted,
    borderWidth: 1,
    borderColor: P.frostedBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },

  /* ── Hero bottom info overlay ── */
  heroBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  heroName: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.5,
    color: P.textPrimary,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },

  /* ── Online status pill ── */
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.frosted,
    borderWidth: 1,
    borderColor: P.frostedBorder,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: P.textPrimary,
    letterSpacing: 0.1,
  },

  /* ── Rating glass badge ── */
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.frosted,
    borderWidth: 1,
    borderColor: P.frostedBorder,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '500',
    color: P.textPrimary,
    letterSpacing: 0.1,
  },

  /* ── Body Section ── */
  bodyBlock: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  /* ── Price + Response Row ── */
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceCapsule: {
    backgroundColor: 'rgba(255,79,163,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,79,163,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#FF4FA3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  priceCapsuleText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.primary,
    letterSpacing: 0.2,
  },
  responseText: {
    fontSize: 14,
    fontWeight: '400',
    color: P.textSecondary,
  },

  /* ── About Section ── */
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: P.textPrimary,
    marginTop: 32,
    letterSpacing: -0.3,
  },
  bioText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 24,
    color: P.textSecondary,
    marginTop: 10,
    letterSpacing: 0.1,
  },

  /* ── Statistics Card (Glassmorphism) ── */
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(24,24,31,0.7)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 28,
    paddingHorizontal: 8,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    color: P.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    color: P.textSecondary,
    marginTop: 6,
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 4,
  },

  /* ── Bottom CTA ── */
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: 'rgba(9,9,11,0.92)',
  },
  balanceHint: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.3,
  },
});

export default FemaleProfilePreviewScreen;
