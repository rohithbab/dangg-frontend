import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppSpacing } from '@theme/spacing';

import { inr } from '@core/utils/formatters';

import { type MaleAppStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'PaymentSuccess'>;
type Route = RouteProp<MaleAppStackParamList, 'PaymentSuccess'>;

function AnimatedCheckmark(): React.ReactElement {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 180,
      mass: 0.6,
    }).start();
  }, [scale]);

  const circleScale = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View
      style={[
        styles.checkCircle,
        { transform: [{ scale: circleScale }] },
      ]}
    >
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Path
          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
          fill={AppColors.success}
        />
      </Svg>
    </Animated.View>
  );
}

function AnimatedFadeSlide({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}): React.ReactElement {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        damping: 18,
        stiffness: 140,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

function PaymentSuccessScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { transactionId, coinsAdded, bonusCoins, amountInr, newBalance } = route.params;
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const toggleDetails = useCallback(() => {
    setDetailsOpen(prev => !prev);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.center}>
          <AnimatedFadeSlide delay={100}>
            <AnimatedCheckmark />
          </AnimatedFadeSlide>

          <AnimatedFadeSlide delay={250}>
            <Text style={styles.title}>Payment Successful!</Text>
          </AnimatedFadeSlide>

          <AnimatedFadeSlide delay={400}>
            <Text style={styles.coinsAdded}>{`${coinsAdded} Coins Added`}</Text>
          </AnimatedFadeSlide>

          <AnimatedFadeSlide delay={550}>
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceValue}>{`${newBalance} Coins`}</Text>
            </View>
          </AnimatedFadeSlide>
        </View>

        <AnimatedFadeSlide delay={700}>
          <View style={styles.detailsWrap}>
            <Pressable
              accessibilityRole="button"
              onPress={toggleDetails}
              style={styles.detailsToggle}
              hitSlop={8}
            >
              <Text style={styles.detailsToggleText}>
                {detailsOpen ? 'Hide Details' : 'View Details'}
              </Text>
              <Animated.View style={{ transform: [{ rotate: detailsOpen ? '180deg' : '0deg' }] }}>
                <Svg width={12} height={12} viewBox="0 0 24 24">
                  <Path
                    d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"
                    fill={AppColors.onSurfaceMuted}
                  />
                </Svg>
              </Animated.View>
            </Pressable>

            {detailsOpen ? (
              <View style={styles.detailsContent}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount paid</Text>
                  <Text style={styles.detailValue}>{inr(amountInr)}</Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValueMono} numberOfLines={1}>
                    {transactionId}
                  </Text>
                </View>
                {bonusCoins > 0 ? (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Bonus</Text>
                      <Text style={styles.detailValueBonus}>{`+${bonusCoins} coins`}</Text>
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
        </AnimatedFadeSlide>
      </View>

      <AnimatedFadeSlide delay={850}>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.replace('MaleTabs', { screen: 'Home' })}
            style={({ pressed }) => [
              styles.primaryCta,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.primaryCtaLabel}>Continue Browsing</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.replace('MaleTabs', { screen: 'Wallet' })}
            style={({ pressed }) => [
              styles.secondaryCta,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.secondaryCtaLabel}>View Wallet</Text>
          </Pressable>
        </View>
      </AnimatedFadeSlide>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  body: {
    flex: 1,
    paddingHorizontal: AppSpacing.lg,
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    paddingTop: AppSpacing.xxl + AppSpacing.lg,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppSpacing.md,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.onSurface,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  coinsAdded: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: AppSpacing.xs,
  },
  balanceSection: {
    alignItems: 'center',
    marginTop: AppSpacing.xl,
    paddingVertical: AppSpacing.lg,
    paddingHorizontal: AppSpacing.xl,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.xl,
    minWidth: 200,
  },
  balanceLabel: {
    fontFamily: 'Nunito',
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.onSurfaceMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontFamily: 'Poppins',
    fontSize: 32,
    fontWeight: '700',
    color: AppColors.onSurface,
    letterSpacing: -0.5,
    marginTop: AppSpacing.xs,
  },
  detailsWrap: {
    alignItems: 'center',
    paddingBottom: AppSpacing.md,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: AppSpacing.sm,
  },
  detailsToggleText: {
    fontFamily: 'Nunito',
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.onSurfaceMuted,
  },
  detailsContent: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.md,
    padding: AppSpacing.md,
    marginTop: AppSpacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontFamily: 'Nunito',
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.onSurfaceMuted,
  },
  detailValue: {
    fontFamily: 'Nunito',
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.onSurface,
  },
  detailValueMono: {
    fontFamily: 'Nunito',
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.onSurfaceMuted,
    maxWidth: 180,
  },
  detailValueBonus: {
    fontFamily: 'Nunito',
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.success,
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.border,
  },
  footer: {
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.xl,
    gap: AppSpacing.sm,
  },
  primaryCta: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
  },
  primaryCtaLabel: {
    fontFamily: 'Nunito',
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.onPrimary,
    letterSpacing: 0.3,
  },
  secondaryCta: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaLabel: {
    fontFamily: 'Nunito',
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.onSurfaceMuted,
    letterSpacing: 0.2,
  },
});

export default PaymentSuccessScreen;
