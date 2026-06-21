import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';

import { inr } from '@core/utils/formatters';

export type InsufficientCoinsModalProps = {
  visible: boolean;
  femaleName: string;
  coinCost: number;
  currentBalance: number;
  topUpCoins: number;
  topUpInr: number;
  onCancel: () => void;
  onTopUp: () => void;
  onGoToWallet: () => void;
};

function CloseIcon(): React.ReactElement {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        fill={AppColors.onSurfaceMuted}
      />
    </Svg>
  );
}

function GradientCtaButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.ReactElement {
  const gradientId = React.useId();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 200,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[{ transform: [{ scale }] }]}>
        <View style={styles.gradientCta}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#FF4FA3" />
                  <Stop offset="0.5" stopColor="#E84393" />
                  <Stop offset="1" stopColor="#D946EF" />
                </LinearGradient>
              </Defs>
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                rx={16}
                fill={`url(#${gradientId})`}
              />
            </Svg>
          </View>
          <Text style={styles.gradientCtaLabel}>{label}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function InsufficientCoinsModal({
  visible,
  femaleName,
  coinCost,
  currentBalance,
  topUpCoins,
  topUpInr,
  onCancel,
  onTopUp,
  onGoToWallet,
}: InsufficientCoinsModalProps): React.ReactElement {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 260,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const slideTransform = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.scrim, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Animated.View
          style={[
            styles.sheet,
            AppShadows.e3,
            { transform: [{ translateY: slideTransform }] },
          ]}
        >
          <View style={styles.handle} />
          <Pressable style={styles.closeBtn} onPress={onCancel} hitSlop={12}>
            <CloseIcon />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Svg width={28} height={28} viewBox="0 0 24 24">
                <Path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                  fill={AppColors.primary}
                />
              </Svg>
            </View>
            <Text style={styles.title}>Unlock Chat Access</Text>
            <Text style={styles.subtitle}>
              You need{' '}
              <Text style={styles.bold}>{coinCost} coins</Text> to chat with{' '}
              {femaleName}, but you{' '}
              <Text style={styles.bold}>only have {currentBalance}</Text>.
            </Text>
          </View>

          <View style={styles.offerCard}>
            <View style={styles.offerBadgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeLabel}>BEST QUICK TOP-UP</Text>
              </View>
            </View>
            <View style={styles.offerBody}>
              <View style={styles.offerLeft}>
                <Text style={styles.offerCoins}>{topUpCoins}</Text>
                <Text style={styles.offerCoinsLabel}>Coins</Text>
              </View>
              <View style={styles.offerRight}>
                <Text style={styles.offerPrice}>{inr(topUpInr)}</Text>
                <Text style={styles.offerPriceLabel}>one-time purchase</Text>
              </View>
            </View>
            <View style={styles.offerAction}>
              <GradientCtaButton label="Buy Now" onPress={onTopUp} />
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onGoToWallet}
            style={({ pressed }) => [
              styles.walletBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.walletBtnLabel}>Go to Wallet</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={({ pressed }) => [
              styles.cancelBtn,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <Text style={styles.cancelBtnLabel}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.xl + AppSpacing.sm,
    paddingTop: AppSpacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.borderStrong,
    alignSelf: 'center',
    marginBottom: AppSpacing.xs,
  },
  closeBtn: {
    position: 'absolute',
    right: AppSpacing.md,
    top: AppSpacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginTop: AppSpacing.sm,
    marginBottom: AppSpacing.lg,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppSpacing.md,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.onSurface,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    fontWeight: '400',
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: AppSpacing.xs,
    paddingHorizontal: AppSpacing.sm,
  },
  bold: {
    fontWeight: '700',
    color: AppColors.onSurface,
  },
  offerCard: {
    backgroundColor: AppColors.surfaceVariant,
    borderRadius: AppRadii.lg,
    padding: AppSpacing.md,
    borderWidth: 1,
    borderColor: AppColors.primaryBorderSoft,
  },
  offerBadgeRow: {
    flexDirection: 'row',
    marginBottom: AppSpacing.sm,
  },
  badge: {
    backgroundColor: AppColors.primarySubtle,
    borderRadius: AppRadii.full,
    paddingHorizontal: AppSpacing.sm + 2,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: AppColors.primaryBorderSoft,
  },
  badgeLabel: {
    fontFamily: 'Nunito',
    fontSize: 10,
    fontWeight: '800',
    color: AppColors.primary,
    letterSpacing: 0.8,
  },
  offerBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  offerCoins: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.onSurface,
    letterSpacing: -0.5,
  },
  offerCoinsLabel: {
    fontFamily: 'Nunito',
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.onSurfaceMuted,
  },
  offerRight: {
    alignItems: 'flex-end',
  },
  offerPrice: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.onSurface,
    letterSpacing: -0.3,
  },
  offerPriceLabel: {
    fontFamily: 'Nunito',
    fontSize: 11,
    fontWeight: '500',
    color: AppColors.onSurfaceMuted,
    marginTop: 1,
  },
  offerAction: {
    marginTop: AppSpacing.md,
  },
  gradientCta: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: AppColors.primary,
    ...AppShadows.e2,
  },
  gradientCtaLabel: {
    fontFamily: 'Nunito',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  walletBtn: {
    minHeight: 48,
    borderRadius: AppRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceHigh,
    borderWidth: 1,
    borderColor: AppColors.borderStrong,
    marginTop: AppSpacing.sm,
  },
  walletBtnLabel: {
    fontFamily: 'Nunito',
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.onSurface,
    letterSpacing: 0.2,
  },
  cancelBtn: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: AppSpacing.xs,
  },
  cancelBtnLabel: {
    fontFamily: 'Nunito',
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.onSurfaceMuted,
  },
});

export default InsufficientCoinsModal;
