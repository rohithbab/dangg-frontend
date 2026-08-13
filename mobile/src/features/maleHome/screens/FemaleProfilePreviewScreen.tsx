import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BadgeCheck, ChevronLeft, Heart, MoreVertical, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { moderateScale, scaleFont } from '@theme/responsive';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import BlockReportSheet from '@core/components/BlockReportSheet';
import GradientAvatar from '@core/components/GradientAvatar';
import PrimaryButton from '@core/components/PrimaryButton';
import Toast from '@core/components/Toast';
import { showAlert } from '@core/feedback';
import { AppException } from '@core/network/apiException';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import { blockUser, reportUser, toReportReason } from '@features/blockReport/api/blockReportApi';
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

  const [female, setFemale] = useState<AvailableFemale | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [blockReportOpen, setBlockReportOpen] = useState(false);

  const handleBlock = useCallback(async (): Promise<void> => {
    if (!female) {
      return;
    }
    try {
      await blockUser(female.id);
      setNotice(`${female.name} has been blocked.`);
      // She must disappear from his world immediately, not on next refresh.
      navigation.goBack();
    } catch (e) {
      logger.warn('blockUser failed', e);
      setNotice(e instanceof AppException ? e.message : "Couldn't block. Please try again.");
    }
  }, [female, navigation]);

  const handleReport = useCallback(
    async (reason: string, comment: string): Promise<void> => {
      if (!female) {
        return;
      }
      try {
        await reportUser({
          reportedUserId: female.id,
          reason: toReportReason(reason),
          description: comment,
        });
        setNotice("Report submitted — we'll review it.");
      } catch (e) {
        logger.warn('reportUser failed', e);
        setNotice(e instanceof AppException ? e.message : "Couldn't report. Please try again.");
      }
    },
    [female],
  );

  useEffect(() => {
    getFemaleById(femaleId)
      .then(setFemale)
      .catch(e => logger.warn('getFemaleById failed', e));
  }, [femaleId]);

  const handleToggleFavorite = useCallback(async (): Promise<void> => {
    if (!female) {
      return;
    }
    const nowFavorited = !female.isFavorited;
    setFemale(prev => (prev ? { ...prev, isFavorited: nowFavorited } : prev));
    setNotice(
      nowFavorited ? 'You added this user to your favourites.' : 'Removed from your favourites.',
    );
    try {
      await toggleFavorite(female.id);
    } catch (e) {
      logger.warn('toggleFavorite failed', e);
      setFemale(prev => (prev ? { ...prev, isFavorited: !nowFavorited } : prev));
      setNotice("Couldn't update favourites. Please try again.");
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
      const { requestId } = await sendChatRequest({
        femaleId: female.id,
        coinCost: 0,
      });
      setConfirmOpen(false);
      navigation.replace('ChatRequestSent', { requestId, femaleName: female.name });
    } catch (e) {
      logger.warn('sendChatRequest failed', e);
      setConfirmOpen(false);
      const message =
        e instanceof AppException ? e.message : 'Could not send the request. Please try again.';
      showAlert({ title: 'Couldn’t send request', message });
    } finally {
      setSubmitting(false);
    }
  }, [female, navigation, submitting]);

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
        <View style={styles.topActions}>
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
          {/* Screen spec 2.7 calls for a block/report affordance here. The
              sheet existed but was never mounted anywhere in the app. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Block or report this user"
            hitSlop={12}
            onPress={() => setBlockReportOpen(true)}
            style={styles.iconBtn}
          >
            <MoreVertical size={22} color={AppColors.onSurface} strokeWidth={2} />
          </Pressable>
        </View>
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

        <View style={styles.statRow}>
          <StatCol value={String(female.totalChats)} label="Chats" />
          <View style={styles.statDivider} />
          <StatCol value={female.rating.toFixed(1)} label="Rating" />
          <View style={styles.statDivider} />
          <StatCol value={`~${female.averageResponseMinutes}m`} label="Replies in" />
        </View>

        <View style={styles.bioCard}>
          <Text style={styles.bioTitle}>About Me</Text>
          {female.bio ? (
            <Text style={styles.bioText}>{female.bio}</Text>
          ) : (
            <Text style={styles.bioEmpty}>No about details available for this user.</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, AppSpacing.md) }]}>
        <PrimaryButton
          label="Send chat request"
          disabled={!female.isOnline}
          onPress={handleSendPress}
        />
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
          // popTo, not navigate: this screen sits on top of the tabs, so
          // `navigate` would push a duplicate MaleTabs instead of returning
          // to the existing one (React Navigation v7 semantics).
          navigation.popTo('MaleTabs', { screen: 'Wallet' });
        }}
      />

      <BlockReportSheet
        visible={blockReportOpen}
        onClose={() => setBlockReportOpen(false)}
        targetName={female.name}
        target="female"
        onBlock={handleBlock}
        onReport={handleReport}
      />

      <Toast message={notice} onHide={() => setNotice(null)} />
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
  loadingText: { fontFamily: InterFont.regular, fontSize: scaleFont(15), color: AppColors.onSurfaceMuted },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: AppSpacing.md,
    height: 48,
  },
  topActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
    paddingBottom: moderateScale(140),
    alignItems: 'center',
  },
  avatarWrap: { marginTop: AppSpacing.md },
  name: {
    fontFamily: InterFont.semibold,
    fontSize: scaleFont(26),
    letterSpacing: -0.5,
    color: AppColors.onSurface,
    marginTop: AppSpacing.md,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(5),
    marginTop: AppSpacing.sm,
  },
  rating: { fontFamily: InterFont.medium, fontSize: scaleFont(14.5), color: AppColors.onSurface },
  metaDotGap: { width: 4 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  onlineText: { fontFamily: InterFont.regular, fontSize: scaleFont(14), color: AppColors.onSurfaceMuted },
  bioCard: {
    alignSelf: 'stretch',
    borderRadius: AppRadii.card,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: AppSpacing.lg,
    marginTop: AppSpacing.lg,
  },
  bioTitle: {
    fontFamily: InterFont.semibold,
    fontSize: scaleFont(16),
    color: AppColors.primary,
    marginBottom: AppSpacing.sm,
  },
  bioText: {
    fontFamily: InterFont.regular,
    fontSize: scaleFont(16.5),
    lineHeight: scaleFont(24),
    color: AppColors.onSurface,
  },
  bioEmpty: {
    fontFamily: InterFont.regular,
    fontSize: scaleFont(15),
    lineHeight: scaleFont(22),
    color: AppColors.onSurfaceMuted,
    fontStyle: 'italic',
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
    fontSize: scaleFont(24),
    letterSpacing: -0.5,
    color: AppColors.onSurface,
  },
  statLabel: {
    fontFamily: InterFont.regular,
    fontSize: scaleFont(12.5),
    color: AppColors.onSurfaceMuted,
    marginTop: moderateScale(4),
  },
  statDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: AppColors.border },

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
