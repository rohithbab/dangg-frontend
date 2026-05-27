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
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path } from 'react-native-svg';

import { AppColors } from '@theme/colors';
import { AppRadii } from '@theme/radii';
import { AppShadows } from '@theme/shadows';
import { AppSpacing } from '@theme/spacing';
import { AppTypography } from '@theme/typography';

import ConfirmationDialog from '@core/components/ConfirmationDialog';
import { Env } from '@core/config/env';
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

const REQUEST_EXPIRY_S = 300;
const POLL_INTERVAL_MS = 3000;

const RADAR_SIZE = 300;

// Orbit avatar layout — positioned around the central avatar
const ORBIT_AVATARS: ReadonlyArray<{
  clipId: string;
  left: number;
  top: number;
  floatDelay: number;
}> = [
  { clipId: 'orbit-f1', left: 196, top: 22, floatDelay: 0 },
  { clipId: 'orbit-f2', left: 10, top: 100, floatDelay: 600 },
  { clipId: 'orbit-f3', left: 206, top: 186, floatDelay: 1200 },
  { clipId: 'orbit-f4', left: 22, top: 216, floatDelay: 900 },
];

// Concentric static radar rings (filled circles, decreasing opacity)
const RADAR_RINGS: ReadonlyArray<{ size: number; opacity: number }> = [
  { size: 80, opacity: 0.22 },
  { size: 130, opacity: 0.15 },
  { size: 180, opacity: 0.1 },
  { size: 230, opacity: 0.06 },
  { size: 282, opacity: 0.04 },
];

function CloseIcon(): React.ReactElement {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        fill={AppColors.primaryDark}
      />
    </Svg>
  );
}

function CheckIcon(): React.ReactElement {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill={AppColors.success} />
    </Svg>
  );
}

/** Single pulsing ring that expands from the center and fades out */
function PulseRing({ delay, size }: { delay: number; size: number }): React.ReactElement {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withRepeat(
        withTiming(1.55, { duration: 2400, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withTiming(0, { duration: 2400, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      );
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
      ]}
    />
  );
}

/** Female face silhouette icon — unique clipId prevents SVG conflicts across instances */
function FemaleFaceIcon({ size, clipId }: { size: number; clipId: string }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id={clipId}>
          <Circle cx={50} cy={50} r={50} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Circle cx={50} cy={50} r={50} fill={AppColors.primarySubtle} />
        {/* Shirt/shoulders */}
        <Path d="M 12 100 C 12 72 30 60 50 60 C 70 60 88 72 88 100 Z" fill={AppColors.primary} />
        {/* V collar */}
        <Path d="M 40 60 L 60 60 L 50 70 Z" fill={AppColors.surface} />
        {/* Neck */}
        <Path d="M 43 50 L 57 50 L 50 62 Z" fill={AppColors.surface} />
        {/* Face */}
        <Ellipse cx={50} cy={43} rx={17} ry={18} fill={AppColors.surface} />
        {/* Bob-cut hair */}
        <Path
          d="M 50 22 C 32 22 28 36 28 60 C 33 60 35 53 35 44 C 35 35 42 33 50 33 C 58 33 65 35 65 44 C 65 53 67 60 72 60 C 72 36 68 22 50 22 Z"
          fill={AppColors.primary}
        />
        {/* Ears */}
        <Circle cx={33} cy={44} r={3} fill={AppColors.surface} />
        <Circle cx={67} cy={44} r={3} fill={AppColors.surface} />
      </G>
    </Svg>
  );
}

/** Center male silhouette icon */
function MaleCenterIcon({ size }: { size: number }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id="center-male-clip">
          <Circle cx={50} cy={50} r={50} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#center-male-clip)">
        <Circle cx={50} cy={50} r={50} fill={AppColors.primarySubtle} />
        {/* Shirt/shoulders */}
        <Path d="M 12 100 C 12 72 30 60 50 60 C 70 60 88 72 88 100 Z" fill={AppColors.primary} />
        {/* Tie line */}
        <Path
          d="M 50 60 L 50 100"
          stroke={AppColors.surface}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
        {/* Neck */}
        <Path d="M 43 48 L 57 48 L 50 60 Z" fill={AppColors.surface} />
        {/* Ears */}
        <Circle cx={32} cy={42} r={3.5} fill={AppColors.surface} />
        <Circle cx={68} cy={42} r={3.5} fill={AppColors.surface} />
        {/* Face */}
        <Ellipse cx={50} cy={41} rx={17} ry={18} fill={AppColors.surface} />
        {/* Hair */}
        <Path
          d="M 32 36 C 31 29 36 22 47 22 C 59 22 69 26 69 37 C 66 32 57 30 49 32 C 41 34 34 36 32 36 Z"
          fill={AppColors.primary}
        />
        {/* Beard shade */}
        <Path
          d="M 33 37 C 33 53 40 58 50 58 C 60 58 67 53 67 37 C 67 47 58 51 50 51 C 42 51 33 47 33 37 Z"
          fill={AppColors.primaryLight}
        />
      </G>
    </Svg>
  );
}

/** Small orbit avatar bubble with a gentle vertical float */
function OrbitAvatar({
  clipId,
  left,
  top,
  floatDelay,
}: {
  clipId: string;
  left: number;
  top: number;
  floatDelay: number;
}): React.ReactElement {
  const floatY = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }, floatDelay);
    return () => {
      clearTimeout(timer);
      cancelAnimation(floatY);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View style={[styles.orbitAvatar, { left, top }, floatStyle]}>
      <FemaleFaceIcon size={52} clipId={clipId} />
    </Animated.View>
  );
}

/** Full radar stage: static depth rings + pulse rings + center avatar + orbit avatars */
function RadarStage(): React.ReactElement {
  return (
    <View style={styles.radarStage}>
      {/* Static concentric filled depth rings */}
      {RADAR_RINGS.map(ring => (
        <View
          key={ring.size}
          style={[
            styles.radarRingStatic,
            {
              width: ring.size,
              height: ring.size,
              borderRadius: ring.size / 2,
              opacity: ring.opacity,
            },
          ]}
        />
      ))}

      {/* Animated pulse rings */}
      <PulseRing delay={0} size={120} />
      <PulseRing delay={800} size={120} />
      <PulseRing delay={1600} size={120} />

      {/* Orbit avatars */}
      {ORBIT_AVATARS.map(av => (
        <OrbitAvatar key={av.clipId} {...av} />
      ))}

      {/* Central avatar */}
      <View style={styles.centerAvatarWrap}>
        <MaleCenterIcon size={90} />
      </View>
    </View>
  );
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

  // Entrance animation
  const enterOpacity = useSharedValue(0);
  const enterY = useSharedValue(24);
  useEffect(() => {
    enterOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    enterY.value = withSpring(0, { damping: 18, stiffness: 120 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const enterStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ translateY: enterY.value }],
  }));

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

  // DEV MODE: auto-accept after 5 s so the full flow can be tested
  useEffect(() => {
    if (!Env.devMode) {
      return;
    }
    const timer = setTimeout(() => routeForOutcome('accepted'), 5000);
    return () => clearTimeout(timer);
  }, [routeForOutcome]);

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
          <CloseIcon />
        </Pressable>
      </View>

      <Animated.View style={[styles.body, enterStyle]}>
        <RadarStage />

        <Text style={styles.title}>Waiting for response…</Text>
        <Text style={styles.subtitle}>She'll see your request now</Text>

        <View style={[styles.countdownCard, AppShadows.e1]}>
          <Text style={styles.countdownLabel}>Expires in</Text>
          <Text style={styles.countdownValue}>{fmtDuration(secondsLeft)}</Text>
        </View>

        <View style={styles.statusTrack}>
          <View style={styles.statusStep}>
            <View style={styles.statusDotSent}>
              <CheckIcon />
            </View>
            <Text style={styles.statusLabelSent}>Request sent</Text>
          </View>
          <View style={styles.statusConnector} />
          <View style={styles.statusStep}>
            <View style={styles.statusDotWaiting}>
              <Svg width={8} height={8} viewBox="0 0 8 8">
                <Circle cx={4} cy={4} r={3} fill={AppColors.onSurfaceMuted} />
              </Svg>
            </View>
            <Text style={styles.statusLabelWaiting}>Waiting…</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCancelDialog(true)}
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
        >
          <Text style={styles.cancelLabel}>Cancel Request</Text>
        </Pressable>
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
    backgroundColor: AppColors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
    gap: AppSpacing.md,
  },

  // Radar stage
  radarStage: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRingStatic: {
    position: 'absolute',
    backgroundColor: AppColors.primary,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  orbitAvatar: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: AppColors.primaryLight,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  centerAvatarWrap: {
    borderRadius: 999,
    borderWidth: 3,
    borderColor: AppColors.primaryLight,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
    padding: 4,
  },

  // Title
  title: {
    ...AppTypography.headlineMedium,
    color: AppColors.primaryDark,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    ...AppTypography.bodyLarge,
    color: AppColors.onSurfaceMuted,
    textAlign: 'center',
    marginTop: -AppSpacing.xs,
  },

  // Countdown card
  countdownCard: {
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.xl,
    paddingVertical: AppSpacing.md + 2,
    paddingHorizontal: AppSpacing.xl + 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: AppColors.primaryLight,
    marginTop: AppSpacing.xs,
  },
  countdownLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.onSurfaceMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
  },
  countdownValue: {
    ...AppTypography.displayLarge,
    color: AppColors.primaryDark,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 2,
  },

  // Step status track
  statusTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusStep: {
    alignItems: 'center',
    gap: AppSpacing.xs,
  },
  statusConnector: {
    width: 48,
    height: 1.5,
    backgroundColor: AppColors.border,
    marginHorizontal: AppSpacing.sm,
    marginBottom: AppSpacing.lg,
  },
  statusDotSent: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotWaiting: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabelSent: {
    ...AppTypography.labelSmall,
    color: AppColors.success,
    fontWeight: '700',
  },
  statusLabelWaiting: {
    ...AppTypography.labelSmall,
    color: AppColors.onSurfaceMuted,
    fontWeight: '600',
  },

  // Footer
  footer: {
    paddingHorizontal: AppSpacing.md,
    paddingBottom: AppSpacing.md,
  },
  cancelBtn: {
    height: 56,
    borderRadius: AppRadii.xl,
    borderWidth: 1.5,
    borderColor: AppColors.primaryLight,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cancelBtnPressed: {
    opacity: 0.75,
    backgroundColor: AppColors.primarySubtle,
  },
  cancelLabel: {
    ...AppTypography.labelLarge,
    color: AppColors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ChatRequestSentScreen;
