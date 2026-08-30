import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { scaleFont } from '@theme/responsive';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import ConfirmationDialog from '@core/components/ConfirmationDialog';
import GradientAvatar from '@core/components/GradientAvatar';
import { CHAT_REQUEST_AUTO_DECLINE_S } from '@core/config/constants';
import { USE_MOCK_DATA } from '@core/config/env';
import { duration as fmtDuration } from '@core/utils/formatters';
import { logger } from '@core/utils/logger';

import { type MaleAppStackParamList } from '@navigation/types';

import {
  cancelSentRequest,
  getSentRequestStatus,
  serverNowMs,
  syncServerClock,
  type SentRequestStatus,
} from '../api/chatRequestApi';

type Nav = NativeStackNavigationProp<MaleAppStackParamList, 'ChatRequestSent'>;
type Route = RouteProp<MaleAppStackParamList, 'ChatRequestSent'>;

// Mirror the female-side auto-decline window so both ends show the same clock.
const REQUEST_EXPIRY_S = CHAT_REQUEST_AUTO_DECLINE_S;
const POLL_INTERVAL_MS = 3000;

// Never show a request window longer than our configured max. A backend still
// issuing an over-long expires_at (e.g. a not-yet-redeployed 120s build) would
// otherwise make the male's countdown disagree with the real 30s auto-decline;
// min() trims that down while leaving a genuine shorter remaining (resume)
// untouched. `undefined` → a fresh full window from now.
const cappedExpiry = (target: number | undefined | null): number => {
  const cap = serverNowMs() + REQUEST_EXPIRY_S * 1000;
  // Only trust a finite, positive target — undefined/null/NaN → fresh window.
  return typeof target === 'number' && Number.isFinite(target) && target > 0
    ? Math.min(target, cap)
    : cap;
};

/**
 * B8 · Waiting (Neue). Ripple-ring avatar of the requested female + "Waiting
 * for {name} to accept…". Polls status every 3s and routes to the matching
 * outcome; hardware/close both go through the Cancel confirmation (refund).
 */
function ChatRequestSentScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { requestId, femaleName, expiresAt: resumedExpiresAt } = route.params;

  // Absolute expiry (epoch ms, server clock), fixed once for this request. On a
  // fresh send we estimate it from now + the window; on resume the real
  // `expires_at` is passed in. Deriving the countdown from this — instead of a
  // decrementing counter — keeps it synced with the female and immune to the JS
  // timer pausing while the app is backgrounded.
  const expiresAtRef = useRef(cappedExpiry(resumedExpiresAt));
  const remaining = useCallback(
    (): number => Math.max(0, Math.round((expiresAtRef.current - serverNowMs()) / 1000)),
    [],
  );
  const [secondsLeft, setSecondsLeft] = useState(remaining);
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

  // Smooth 1s countdown from the absolute expiry.
  useEffect(() => {
    const tick = setInterval(() => setSecondsLeft(remaining()), 1000);
    return () => clearInterval(tick);
  }, [remaining]);

  // Keep the clock honest against the SERVER, not the device — emulators and
  // skewed phones drift, and JS timers freeze while backgrounded. Re-sync on
  // mount and on every foreground, then recompute, so reopening snaps to the
  // true remaining and stays in step with the female's countdown.
  useEffect(() => {
    let cancelled = false;
    const resync = async (rebaseFresh: boolean): Promise<void> => {
      await syncServerClock();
      if (cancelled) {
        return;
      }
      // On mount, re-base against the corrected clock — this also trims a stale
      // over-long server window (a not-yet-redeployed backend) down to our max.
      // On a plain foreground we keep the fixed absolute target so the countdown
      // never jumps.
      if (rebaseFresh) {
        expiresAtRef.current = cappedExpiry(resumedExpiresAt);
      }
      setSecondsLeft(remaining());
    };
    void resync(true);
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        void resync(false);
      }
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [remaining, resumedExpiresAt]);

  // DEV MODE: auto-accept after 5s so the full flow can be exercised.
  useEffect(() => {
    if (!USE_MOCK_DATA) {
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

  const title = femaleName ? `Waiting for ${femaleName} to accept…` : 'Waiting for response…';
  const initial = (femaleName ?? '?').trim().slice(0, 1).toUpperCase();

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
          <X size={20} color={AppColors.onSurface} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.ringStage}>
          <View style={[styles.ring, styles.ring3]} />
          <View style={[styles.ring, styles.ring2]} />
          <View style={[styles.ring, styles.ring1]} />
          <GradientAvatar initials={initial} seed={femaleName ?? 'request'} size={104} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>She'll see your request now</Text>

        <Text style={styles.expires}>{`Expires in ${fmtDuration(secondsLeft)}`}</Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCancelDialog(true)}
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
        >
          <Text style={styles.cancelLabel}>Cancel request</Text>
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
    paddingTop:
      Platform.OS === 'android' ? AppSpacing.sm + (StatusBar.currentHeight ?? 0) : AppSpacing.sm,
    flexDirection: 'row',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppSpacing.lg,
  },
  ringStage: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1.5 },
  ring1: { width: 156, height: 156, borderColor: AppColors.primaryOutline },
  ring2: { width: 206, height: 206, borderColor: AppColors.primaryBorderSoft },
  ring3: { width: 260, height: 260, borderColor: AppColors.primaryBorderSubtle },
  title: {
    fontFamily: InterFont.semibold,
    fontSize: scaleFont(22),
    color: AppColors.onSurface,
    textAlign: 'center',
    marginTop: AppSpacing.xl,
  },
  subtitle: {
    fontFamily: InterFont.regular,
    fontSize: scaleFont(14.5),
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
    textAlign: 'center',
  },
  expires: {
    fontFamily: InterFont.medium,
    fontSize: scaleFont(13),
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.lg,
  },
  footer: { paddingHorizontal: AppSpacing.lg, paddingBottom: AppSpacing.md },
  cancelBtn: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: AppColors.primaryOutline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnPressed: { opacity: 0.75 },
  cancelLabel: { fontFamily: InterFont.medium, fontSize: scaleFont(16), color: AppColors.primary },
});

export default ChatRequestSentScreen;
