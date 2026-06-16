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
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import PrimaryButton from '@core/components/PrimaryButton';
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
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.6);

function ChevronLeft(): React.ReactElement {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" fill={AppColors.primaryDark} />
    </Svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }): React.ReactElement {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? AppColors.primary : AppColors.transparent}
        stroke={filled ? AppColors.transparent : AppColors.primaryDark}
        strokeWidth={filled ? 0 : 2}
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

/** Full-bleed female profile preview with sticky Send Chat Request CTA. */
function FemaleProfilePreviewScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { femaleId } = route.params;

  const coinBalance = useWalletStore(s => s.coinBalance);
  const spend = useWalletStore(s => s.spend);

  const [female, setFemale] = useState<AvailableFemale | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { height: HERO_HEIGHT }]}>
          <FastImage
            source={{ uri: female.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <Svg
            style={styles.heroGradient}
            width="100%"
            height={Math.round(HERO_HEIGHT * 0.4)}
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id="heroFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={AppColors.scrim} stopOpacity="0" />
                <Stop offset="100%" stopColor={AppColors.scrim} stopOpacity="0.85" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#heroFade)" />
          </Svg>

          <SafeAreaView style={styles.heroOverlay} edges={['top']} pointerEvents="box-none">
            <View style={styles.heroTopRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => navigation.goBack()}
                hitSlop={8}
                style={styles.iconBtn}
              >
                <ChevronLeft />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={female.isFavorited ? 'Unfavorite' : 'Add to favorites'}
                onPress={() => {
                  void handleToggleFavorite();
                }}
                hitSlop={8}
                style={styles.iconBtn}
              >
                <HeartIcon filled={female.isFavorited} />
              </Pressable>
            </View>
          </SafeAreaView>

          <View style={styles.heroBottom}>
            <Text style={styles.heroName}>{`${female.name}, ${female.age}`}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaLeft}>
                <View
                  style={[
                    styles.heroDot,
                    {
                      backgroundColor: female.isOnline
                        ? AppColors.onlineGreen
                        : AppColors.offlineGray,
                    },
                  ]}
                />
                <Text style={styles.heroMetaText}>
                  {female.isOnline ? 'Online now' : 'Offline'}
                </Text>
              </View>
              <View style={styles.heroMetaRight}>
                <StarIcon size={16} color={AppColors.surface} />
                <Text style={styles.heroMetaText}>
                  {`${female.rating.toFixed(1)} (${female.totalChats} chats)`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bodyBlock}>
          <View style={styles.actionRow}>
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>{`${female.coinPrice} coins per chat`}</Text>
            </View>
            <Text style={styles.responseText}>
              {`Responds in ${female.averageResponseMinutes} min`}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{female.bio}</Text>

          <View style={[styles.statsCard, AppShadows.e1]}>
            <StatCol value={String(female.totalChats)} label="Chats" />
            <View style={styles.statDivider} />
            <StatCol value={female.rating.toFixed(1)} label="Rating" />
            <View style={styles.statDivider} />
            <StatCol value={`${female.averageResponseMinutes}m`} label="Response" />
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.ctaWrap}>
        <PrimaryButton
          label={`Send Chat Request — ${female.coinPrice} coins`}
          onPress={handleSendPress}
        />
        <Text style={styles.balanceHint}>{`Your balance: ${coinBalance} coins`}</Text>
      </SafeAreaView>

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

function StatCol({ value, label }: { value: string; label: string }): React.ReactElement {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
  },
  scroll: { paddingBottom: 160 },
  hero: { width: '100%', backgroundColor: AppColors.primarySubtle, position: 'relative' },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: AppSpacing.md,
    paddingTop:
      Platform.OS === 'android' ? AppSpacing.sm + (StatusBar.currentHeight ?? 0) : AppSpacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    opacity: 0.92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: AppSpacing.md,
    paddingBottom: AppSpacing.md,
  },
  heroName: {
    ...AppTypography.headlineLarge,
    color: AppColors.surface,
    fontWeight: '700',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  heroMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroDot: { width: 10, height: 10, borderRadius: 5 },
  heroMetaText: {
    ...AppTypography.bodyMedium,
    color: AppColors.surface,
    opacity: 0.95,
  },
  bodyBlock: { paddingHorizontal: AppSpacing.md, paddingTop: AppSpacing.md },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: AppSpacing.sm,
  },
  pricePill: {
    backgroundColor: AppColors.primarySubtle,
    borderRadius: AppRadii.full,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: 6,
  },
  pricePillText: {
    ...AppTypography.labelLarge,
    color: AppColors.primaryDark,
    fontWeight: '700',
  },
  responseText: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
  },
  sectionTitle: {
    ...AppTypography.titleMedium,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.lg,
  },
  bioText: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurface,
    marginTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.md,
    marginTop: AppSpacing.lg,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statValue: {
    ...AppTypography.titleLarge,
    color: AppColors.primaryDark,
  },
  statLabel: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.divider,
    marginVertical: 4,
  },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
    backgroundColor: AppColors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppColors.divider,
  },
  balanceHint: {
    ...AppTypography.bodySmall,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
  },
});

export default FemaleProfilePreviewScreen;
