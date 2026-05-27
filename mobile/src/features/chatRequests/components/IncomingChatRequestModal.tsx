import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, Modal, PanResponder, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import Avatar from '@core/components/Avatar';
import PrimaryButton from '@core/components/PrimaryButton';
import SecondaryButton from '@core/components/SecondaryButton';
import { CHAT_REQUEST_AUTO_DECLINE_S } from '@core/config/constants';
import { logger } from '@core/utils/logger';

import { navigationRef } from '@navigation/navigationRef';

import { acceptRequest, declineRequest } from '../api/chatRequestApi';
import { type IncomingChatRequest, useChatRequestStore } from '../store/chatRequestStore';

function formatCountdown(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Global incoming chat request modal. Rendered once in `App.tsx`; reads
 * the single-slot `chatRequestStore`. Counts down from 30s and auto-
 * declines on expiry. Backdrop is non-dismissible — user must Accept or
 * Decline (or wait for the auto-decline).
 */
function IncomingChatRequestModal(): React.ReactElement | null {
  const incoming = useChatRequestStore(s => s.incoming);
  const clear = useChatRequestStore(s => s.clear);
  const [secondsLeft, setSecondsLeft] = useState(CHAT_REQUEST_AUTO_DECLINE_S);

  const [lastRequest, setLastRequest] = useState<IncomingChatRequest | null>(null);

  useEffect(() => {
    if (incoming) {
      setLastRequest(incoming);
    }
  }, [incoming]);

  const displayRequest = incoming || lastRequest;
  useEffect(() => {
    if (!incoming) {
      setSecondsLeft(CHAT_REQUEST_AUTO_DECLINE_S);
      return undefined;
    }
    setSecondsLeft(CHAT_REQUEST_AUTO_DECLINE_S);
    const tick = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [incoming]);

  const autoDecline = useCallback(async (): Promise<void> => {
    if (!incoming) {
      return;
    }
    const reqId = incoming.id;
    clear();
    try {
      await declineRequest(reqId, 'timeout');
    } catch (e) {
      logger.warn('autoDecline failed in background', e);
    }
  }, [clear, incoming]);

  useEffect(() => {
    if (incoming && secondsLeft === 0) {
      void autoDecline();
    }
  }, [autoDecline, incoming, secondsLeft]);

  const handleDecline = useCallback(async (): Promise<void> => {
    if (!incoming) {
      return;
    }
    const reqId = incoming.id;
    clear();
    try {
      await declineRequest(reqId, 'manual');
    } catch (e) {
      logger.warn('declineRequest failed in background', e);
    }
  }, [clear, incoming]);

  const handleAccept = useCallback(async (): Promise<void> => {
    if (!incoming) {
      return;
    }
    const reqId = incoming.id;
    // Navigate immediately to avoid network lag
    if (navigationRef.isReady()) {
      navigationRef.navigate('FemaleApp', {
        screen: 'ChatRequestAccepted',
        params: { requestId: reqId },
      });
    }
    clear();
    try {
      await acceptRequest(reqId);
    } catch (e) {
      logger.warn('acceptRequest failed in background', e);
    }
  }, [clear, incoming]);

  const latestRef = React.useRef({ handleAccept, handleDecline });
  latestRef.current = { handleAccept, handleDecline };

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (incoming) {
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [incoming, translateX, translateY]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => Math.abs(gestureState.dx) > 10,
      onMoveShouldSetPanResponderCapture: (_evt, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_evt, gestureState) => {
        translateX.value = gestureState.dx;
        translateY.value = gestureState.dy;
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const threshold = 120;
        const velocityThreshold = 0.5;

        if (gestureState.dx > threshold || gestureState.vx > velocityThreshold) {
          translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 200 });
          void latestRef.current.handleAccept();
        } else if (gestureState.dx < -threshold || gestureState.vx < -velocityThreshold) {
          translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 200 });
          void latestRef.current.handleDecline();
        } else {
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
        }
      },
      onPanResponderTerminate: () => {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      },
    }),
  ).current;

  const animatedCardStyle = useAnimatedStyle(() => {
    const rot = `${translateX.value * 0.08}deg`;
    const borderColor = interpolateColor(
      translateX.value,
      [-120, 0, 120],
      [AppColors.error, 'transparent', AppColors.onlineGreen],
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: rot },
      ],
      borderWidth: 2,
      borderColor,
    };
  });

  const acceptBadgeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [0, 80], [0, 1], Extrapolate.CLAMP);
    return { opacity };
  });

  const declineBadgeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(translateX.value, [-80, 0], [1, 0], Extrapolate.CLAMP);
    return { opacity };
  });

  if (!displayRequest) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={incoming !== null}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        void handleDecline();
      }}
    >
      <View style={styles.scrim}>
        <Animated.View
          style={[styles.card, AppShadows.e3, animatedCardStyle]}
          {...panResponder.panHandlers}
        >
          {/* Swipe badges */}
          <Animated.View
            style={[styles.swipeBadge, styles.acceptBadge, acceptBadgeStyle]}
            pointerEvents="none"
          >
            <Text style={styles.acceptBadgeText}>ACCEPT</Text>
          </Animated.View>
          <Animated.View
            style={[styles.swipeBadge, styles.declineBadge, declineBadgeStyle]}
            pointerEvents="none"
          >
            <Text style={styles.declineBadgeText}>DECLINE</Text>
          </Animated.View>

          <View style={styles.accentStrip} />
          <View style={styles.body}>
            <Text style={styles.eyebrow}>Incoming Chat Request</Text>
            <View style={styles.avatarRing}>
              <Avatar
                uri={displayRequest.requesterAvatarUrl}
                size={96}
                initials={initialsFromName(displayRequest.requesterName)}
              />
            </View>
            <Text style={styles.name}>{displayRequest.requesterName}</Text>
            <Text
              style={styles.info}
            >{`Sending ${displayRequest.coinAmount} coins for this chat`}</Text>
            <Text style={styles.countdown}>
              {'Auto-declines in '}
              <Text style={styles.countdownBold}>{formatCountdown(secondsLeft)}</Text>
            </Text>
            <View style={styles.actions}>
              <View style={styles.actionHalf}>
                <SecondaryButton
                  label="Decline"
                  onPress={() => {
                    void handleDecline();
                  }}
                />
              </View>
              <View style={styles.actionHalf}>
                <PrimaryButton
                  label="Accept"
                  onPress={() => {
                    void handleAccept();
                  }}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: AppColors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.lg,
    overflow: 'hidden',
  },
  accentStrip: { height: 4, backgroundColor: AppColors.primary },
  body: { padding: AppSpacing.lg, alignItems: 'center' },
  eyebrow: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  avatarRing: {
    marginTop: AppSpacing.md,
    padding: 3,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: AppColors.primary,
  },
  name: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
    textAlign: 'center',
    marginTop: AppSpacing.md,
  },
  info: {
    ...AppTypography.bodyMedium,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  countdown: {
    ...AppTypography.bodyMedium,
    color: AppColors.warning,
    marginTop: AppSpacing.md,
  },
  countdownBold: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: AppSpacing.lg,
    gap: AppSpacing.sm,
  },
  actionHalf: { flex: 1 },
  swipeBadge: {
    position: 'absolute',
    top: 24,
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 99,
  },
  acceptBadge: {
    left: 24,
    borderColor: AppColors.onlineGreen,
    transform: [{ rotate: '-12deg' }],
  },
  acceptBadgeText: {
    ...AppTypography.titleMedium,
    color: AppColors.onlineGreen,
    fontWeight: '800',
  },
  declineBadge: {
    right: 24,
    borderColor: AppColors.error,
    transform: [{ rotate: '12deg' }],
  },
  declineBadgeText: {
    ...AppTypography.titleMedium,
    color: AppColors.error,
    fontWeight: '800',
  },
});

export default IncomingChatRequestModal;
