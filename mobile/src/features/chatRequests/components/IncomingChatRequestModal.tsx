import { Check, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { moderateScale, scaleFont } from '@theme/responsive';
import { InterFont } from '@theme/typography';

import GradientAvatar from '@core/components/GradientAvatar';
import { CHAT_REQUEST_AUTO_DECLINE_S } from '@core/config/constants';
import { logger } from '@core/utils/logger';

import { navigationRef } from '@navigation/navigationRef';

import { useSessionStore } from '@store/sessionStore';

import { UserRole } from '@app-types/domain';

import { acceptRequest, declineRequest, serverNowMs, syncServerClock } from '../api/chatRequestApi';
import { type IncomingChatRequest, useChatRequestStore } from '../store/chatRequestStore';

function formatCountdown(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function initialsFromName(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase();
}

/**
 * C21 · Incoming chat request (Neue ringing). Rendered once in `App.tsx` from
 * the single-slot `chatRequestStore`. Call-style rings + avatar, the coin
 * offer, a 30s auto-decline countdown, and circular Decline / Accept.
 */
function IncomingChatRequestModal(): React.ReactElement | null {
  const incoming = useChatRequestStore(s => s.incoming);
  const clear = useChatRequestStore(s => s.clear);
  // Only an authenticated female may see incoming requests. Gating here (in
  // addition to clearing the store on logout) makes it impossible for a card
  // to appear after sign-out, even if an in-flight poll/realtime callback
  // raced and set one.
  const isAuthedFemale = useSessionStore(s => s.session !== null && s.role === UserRole.Female);
  const [secondsLeft, setSecondsLeft] = useState(CHAT_REQUEST_AUTO_DECLINE_S);
  const [lastRequest, setLastRequest] = useState<IncomingChatRequest | null>(null);

  useEffect(() => {
    if (incoming) {
      setLastRequest(incoming);
    }
  }, [incoming]);

  const displayRequest = incoming || lastRequest;

  // Absolute expiry we count down to, captured once per request (after the
  // clock is synced) and CAPPED at our configured max. A backend that hasn't
  // picked up the shortened window yet can still hand us an over-long
  // expires_at (e.g. a not-yet-redeployed 120s build); capping keeps her card
  // in step with the real 30s auto-decline. Fixed once so `now + max` moving
  // forward each tick can't freeze the countdown.
  const effectiveExpiryRef = useRef(0);

  // Countdown derived from the request's ABSOLUTE (capped) expiry — server
  // clock, not a naive counter — so it shows the true time left even if she was
  // backgrounded when the request arrived, stays in lockstep with the male's
  // waiting screen, and hits 0 exactly when the backend expires it (never lets
  // her accept a request the male has already given up on).
  const remaining = useCallback(
    (): number =>
      incoming
        ? Math.max(0, Math.round((effectiveExpiryRef.current - serverNowMs()) / 1000))
        : 0,
    [incoming],
  );

  useEffect(() => {
    if (!incoming) {
      setSecondsLeft(CHAT_REQUEST_AUTO_DECLINE_S);
      return undefined;
    }
    const serverExpiry = incoming.expiresAt;
    let cancelled = false;
    let tick: ReturnType<typeof setInterval> | null = null;
    // `expiresAt` is a SERVER timestamp — sync the clock so the countdown is
    // measured against server time, not the device clock (which can be skewed,
    // esp. on emulators, otherwise showing absurd values like "2645:31"). Show a
    // placeholder until the sync lands, then start ticking against real time.
    const start = async (): Promise<void> => {
      await syncServerClock();
      if (cancelled) {
        return;
      }
      // Cap the window at our configured max the moment it lands (see
      // effectiveExpiryRef); leaves a genuine shorter remaining untouched.
      effectiveExpiryRef.current = Math.min(
        serverExpiry,
        serverNowMs() + CHAT_REQUEST_AUTO_DECLINE_S * 1000,
      );
      setSecondsLeft(remaining());
      tick = setInterval(() => setSecondsLeft(remaining()), 1000);
    };
    setSecondsLeft(CHAT_REQUEST_AUTO_DECLINE_S);
    void start();
    // Recompute immediately on return (the interval is throttled while
    // backgrounded, so it would otherwise resume from a stale value).
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') {
        void syncServerClock().then(() => {
          if (!cancelled) {
            setSecondsLeft(remaining());
          }
        });
      }
    });
    return () => {
      cancelled = true;
      if (tick) {
        clearInterval(tick);
      }
      sub.remove();
    };
  }, [incoming, remaining]);

  useEffect(() => {
    if (incoming && secondsLeft === 0) {
      // Timed out — just dismiss the card locally and let the request EXPIRE on
      // the backend (the expiry cron notifies the male "no response"). We must
      // NOT decline it here: a timeout is not a decline, and declining wrongly
      // tells the male "she declined your chat request" when she simply never
      // answered (both the "No Response" screen AND a false "declined" toast).
      clear();
    }
  }, [clear, incoming, secondsLeft]);

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

  if (!displayRequest || !isAuthedFemale) {
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
      <View style={styles.root}>
        <Text style={styles.eyebrow}>Incoming chat request</Text>

        <View style={styles.ringStage}>
          <View style={[styles.ring, styles.ring3]} />
          <View style={[styles.ring, styles.ring2]} />
          <View style={[styles.ring, styles.ring1]} />
          <GradientAvatar
            initials={initialsFromName(displayRequest.requesterName)}
            seed={displayRequest.requesterName}
            uri={displayRequest.requesterAvatarUrl}
            size={120}
          />
        </View>

        <Text style={styles.name}>{displayRequest.requesterName}</Text>
        <Text style={styles.wants}>wants to chat</Text>

        <Text style={styles.countdown}>{`Auto-declines in ${formatCountdown(secondsLeft)}`}</Text>

        <View style={styles.actions}>
          <View style={styles.actionCol}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decline"
              onPress={() => {
                void handleDecline();
              }}
              style={({ pressed }) => [
                styles.circleBtn,
                styles.declineBtn,
                pressed && styles.pressed,
              ]}
            >
              <X size={28} color={AppColors.onSurface} strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.actionLabel}>Decline</Text>
          </View>
          <View style={styles.actionCol}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Accept"
              onPress={() => {
                void handleAccept();
              }}
              style={({ pressed }) => [
                styles.circleBtn,
                styles.acceptBtn,
                pressed && styles.pressed,
              ]}
            >
              <Check size={30} color="#FFFFFF" strokeWidth={2.6} />
            </Pressable>
            <Text style={styles.actionLabel}>Accept</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(8,3,8,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(32),
  },
  eyebrow: {
    position: 'absolute',
    top: 72,
    fontFamily: InterFont.medium,
    fontSize: scaleFont(12.5),
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: AppColors.primary,
  },
  ringStage: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1.5 },
  ring1: { width: 168, height: 168, borderColor: AppColors.primaryOutline },
  ring2: { width: 220, height: 220, borderColor: AppColors.primaryBorderSoft },
  ring3: { width: 280, height: 280, borderColor: AppColors.primaryBorderSubtle },
  name: {
    fontFamily: InterFont.semibold,
    fontSize: scaleFont(26),
    color: AppColors.onSurface,
    marginTop: moderateScale(8),
  },
  wants: {
    fontFamily: InterFont.regular,
    fontSize: scaleFont(15),
    color: AppColors.onSurfaceMuted,
    marginTop: moderateScale(4),
  },

  countdown: {
    fontFamily: InterFont.regular,
    fontSize: scaleFont(13),
    color: AppColors.coinGold,
    marginTop: moderateScale(12),
  },
  actions: { flexDirection: 'row', gap: moderateScale(56), marginTop: moderateScale(44) },
  actionCol: { alignItems: 'center', gap: moderateScale(10) },
  circleBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: { backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border },
  acceptBtn: { backgroundColor: AppColors.primary },
  pressed: { opacity: 0.8 },
  actionLabel: { fontFamily: InterFont.regular, fontSize: scaleFont(13), color: AppColors.onSurfaceMuted },
});

export default IncomingChatRequestModal;
