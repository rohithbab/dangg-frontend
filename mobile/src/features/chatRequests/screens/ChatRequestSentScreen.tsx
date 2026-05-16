import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Avatar from '@core/components/Avatar';
import ConfirmationDialog from '@core/components/ConfirmationDialog';
import SecondaryButton from '@core/components/SecondaryButton';
import { duration as fmtDuration } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import {
  cancelSentRequest,
  getSentRequestStatus,
  type SentRequestStatus,
} from '../api/chatRequestApi';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'ChatRequestSent'>;
type Route = RouteProp<MaleAppStackParamList, 'ChatRequestSent'>;

const REQUEST_EXPIRY_S = 300; // 5 minutes
const POLL_INTERVAL_MS = 3000;

function PulseRing({ delay }: { delay: number }): React.ReactElement {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.6, { duration: 1500, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.pulseRing, animatedStyle]} />;
}

/**
 * "Waiting for her response" screen. Polls request status every 3s and
 * routes to the matching outcome screen. Hardware back is intercepted —
 * the only exit is the Cancel Request button (with refund confirmation).
 */
function ChatRequestSentScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { requestId } = route.params;

  const [secondsLeft, setSecondsLeft] = useState(REQUEST_EXPIRY_S);
  const [cancelDialog, setCancelDialog] = useState(false);
  const cancelInFlightRef = useRef(false);

  const routeForOutcome = useCallback(
    (status: SentRequestStatus): void => {
      switch (status) {
        case 'accepted':
          navigation.replace('ChatRequestAccepted', { requestId });
          break;
        case 'declined':
          navigation.replace('ChatRequestDeclined', { requestId });
          break;
        case 'expired':
          navigation.replace('ChatRequestTimeout', { requestId });
          break;
        case 'pending':
        default:
          break;
      }
    },
    [navigation, requestId],
  );

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = async (): Promise<void> => {
      try {
        const status = await getSentRequestStatus(requestId);
        if (!cancelled && status !== 'pending') {
          routeForOutcome(status);
        }
      } catch (e) {
        logger.warn('getSentRequestStatus failed', e);
      }
    };
    const interval = setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [requestId, routeForOutcome]);

  useEffect(() => {
    if (secondsLeft === 0) {
      routeForOutcome('expired');
    }
  }, [routeForOutcome, secondsLeft]);

  const handleCancel = useCallback(async (): Promise<void> => {
    if (cancelInFlightRef.current) {
      return;
    }
    cancelInFlightRef.current = true;
    setCancelDialog(false);
    try {
      await cancelSentRequest(requestId);
      navigation.popToTop();
    } catch (e) {
      logger.warn('cancelSentRequest failed', e);
      cancelInFlightRef.current = false;
    }
  }, [navigation, requestId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => setCancelDialog(true)}
          hitSlop={12}
          style={styles.closeBtn}
        >
          <Text style={styles.closeGlyph}>{'×'}</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.avatarStage}>
          <PulseRing delay={0} />
          <PulseRing delay={500} />
          <View style={styles.avatarRing}>
            <Avatar size={120} initials="?" />
          </View>
        </View>

        <Text style={styles.title}>Waiting for response…</Text>
        <Text style={styles.subtitle}>She'll see your request now</Text>

        <Text style={styles.countdownLabel}>Expires in</Text>
        <Text style={styles.countdownValue}>{fmtDuration(secondsLeft)}</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusSent}>Request sent ✓</Text>
          <Text style={styles.statusWaiting}>Waiting…</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <SecondaryButton label="Cancel Request" onPress={() => setCancelDialog(true)} />
      </View>

      <ConfirmationDialog
        visible={cancelDialog}
        title="Cancel this request?"
        body="The coins you spent will be refunded to your wallet."
        confirmLabel="Yes, cancel"
        cancelLabel="Keep waiting"
        destructive
        onCancel={() => setCancelDialog(false)}
        onConfirm={() => {
          void handleCancel();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: {
    paddingHorizontal: AppSpacing.md,
    paddingTop: AppSpacing.sm,
    flexDirection: 'row',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontSize: 28,
    lineHeight: 30,
    color: AppColors.primaryDark,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  avatarStage: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: AppColors.primary,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.background,
  },
  title: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
    marginTop: AppSpacing.lg,
  },
  subtitle: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
    marginTop: 4,
  },
  countdownLabel: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.xl,
  },
  countdownValue: {
    ...AppTypography.displayLarge,
    color: AppColors.warning,
    marginTop: AppSpacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AppSpacing.md,
    marginTop: AppSpacing.md,
  },
  statusSent: {
    ...AppTypography.labelLarge,
    color: AppColors.success,
  },
  statusWaiting: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
  },
  footer: {
    padding: AppSpacing.md,
    gap: AppSpacing.sm,
  },
});

export default ChatRequestSentScreen;
