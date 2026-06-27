import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BadgeCheck, ChevronLeft, Clock, Heart, ShieldCheck, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import FeatureCard from '@core/components/FeatureCard';
import GradientAvatar from '@core/components/GradientAvatar';
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

/**
 * B7 · Profile Detail (Neue). The male's view of a female before sending a
 * chat request: centered gradient avatar + name/age, rating · verified ·
 * online, bio, a 3-stat row, the per-chat price, two feature-tinted info
 * cards, and a sticky "Send chat request" CTA. All request/favorite logic is
 * unchanged — only the presentation was rebuilt to the design.
 */
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
      navigation.replace('ChatRequestSent', { requestId, femaleName: female.name });
    } catch (e) {
      logger.warn('sendChatRequest failed', e);
      useWalletStore.getState().credit(female.coinPrice);
    } finally {
      setSubmitting(false);
    }
  }, [female, navigation, spend, submitting]);

  if (!female) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const topUpPkg = COIN_PACKAGES[0]!;
  const initial = female.name.trim().slice(0, 1).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <ChevronLeft size={24} color={AppColors.onSurface} strokeWidth={2} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={female.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          hitSlop={12}
          onPress={() => {
            void handleToggleFavorite();
          }}
          style={styles.iconBtn}
        >
          <Heart
            size={22}
            color={female.isFavorited ? AppColors.primary : AppColors.onSurface}
            fill={female.isFavorited ? AppColors.primary : 'transparent'}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <GradientAvatar
            initials={initial}
            seed={female.name}
            uri={female.imageUrl}
            size={108}
            online={female.isOnline}
          />
        </View>

        <Text style={styles.name}>{`${female.name}, ${female.age}`}</Text>

        <View style={styles.metaRow}>
          <Star size={15} color={AppColors.coinGold} fill={AppColors.coinGold} strokeWidth={0} />
          <Text style={styles.rating}>{female.rating.toFixed(1)}</Text>
          {female.isVerified ? (
            <BadgeCheck size={16} color={AppColors.featureBlue} strokeWidth={2.2} />
          ) : null}
          <View style={styles.metaDotGap} />
          <View
            style={[
              styles.onlineDot,
              {
                backgroundColor: female.isOnline ? AppColors.success : AppColors.onSurfaceDisabled,
              },
            ]}
          />
          <Text style={styles.onlineText}>{female.isOnline ? 'Online' : 'Offline'}</Text>
        </View>

        {female.bio ? <Text style={styles.bio}>{female.bio}</Text> : null}

        <View style={styles.statRow}>
          <StatCol value={String(female.totalChats)} label="Chats" />
          <View style={styles.statDivider} />
          <StatCol value={female.rating.toFixed(1)} label="Rating" />
          <View style={styles.statDivider} />
          <StatCol value={`~${female.averageResponseMinutes}m`} label="Replies in" />
        </View>

        <Text style={styles.priceLine}>{`${female.coinPrice} coins / chat`}</Text>

        <View style={styles.infoCards}>
          <FeatureCard
            tint={AppColors.featureGreen}
            icon={<Clock size={20} color="#0E1A14" strokeWidth={2} />}
            title="Quick to reply"
            subtitle={`Usually within ~${female.averageResponseMinutes} min`}
          />
          {female.isVerified ? (
            <FeatureCard
              tint={AppColors.featureMauve}
              icon={<ShieldCheck size={20} color="#1A0E18" strokeWidth={2} />}
              title="Verified profile"
              subtitle="Identity checked by our team"
            />
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, AppSpacing.md) }]}>
        <PrimaryButton label="Send chat request" onPress={handleSendPress} />
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
    </SafeAreaView>
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
  loadingText: { fontFamily: InterFont.regular, fontSize: 15, color: AppColors.onSurfaceMuted },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.md,
    height: 48,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
    paddingBottom: 140,
    alignItems: 'center',
  },
  avatarWrap: { marginTop: AppSpacing.md },
  name: {
    fontFamily: InterFont.semibold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: AppColors.onSurface,
    marginTop: AppSpacing.md,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: AppSpacing.sm,
  },
  rating: { fontFamily: InterFont.medium, fontSize: 14.5, color: AppColors.onSurface },
  metaDotGap: { width: 4 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  onlineText: { fontFamily: InterFont.regular, fontSize: 14, color: AppColors.onSurfaceMuted },
  bio: {
    fontFamily: InterFont.light,
    fontSize: 14.5,
    lineHeight: 21,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.md,
    maxWidth: 300,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: AppSpacing.xl,
    paddingHorizontal: AppSpacing.sm,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statValue: {
    fontFamily: InterFont.light,
    fontSize: 24,
    letterSpacing: -0.5,
    color: AppColors.onSurface,
  },
  statLabel: {
    fontFamily: InterFont.regular,
    fontSize: 12.5,
    color: AppColors.onSurfaceMuted,
    marginTop: 4,
  },
  statDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: AppColors.border },
  priceLine: {
    fontFamily: InterFont.medium,
    fontSize: 15,
    color: AppColors.primary,
    marginTop: AppSpacing.xl,
  },
  infoCards: { alignSelf: 'stretch', gap: 12, marginTop: AppSpacing.lg },
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
    backgroundColor: AppColors.background,
  },
});

export default FemaleProfilePreviewScreen;
