import { Check, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@theme/colors';
import { InterFont } from '@theme/typography';

import GradientAvatar from '@core/components/GradientAvatar';
import { CHAT_REQUEST_AUTO_DECLINE_S } from '@core/config/constants';
import { logger } from '@core/utils/logger';

import { navigationRef } from '@navigation/navigationRef';

import { useSessionStore } from '@store/sessionStore';

import { UserRole } from '@app-types/domain';

import { acceptRequest, declineRequest } from '../api/chatRequestApi';
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
  const isAuthedFemale = useSessionStore(
    s => s.session !== null && s.role === UserRole.Female,
  );
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
    paddingHorizontal: 32,
  },
  eyebrow: {
    position: 'absolute',
    top: 72,
    fontFamily: InterFont.medium,
    fontSize: 12.5,
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
    fontSize: 26,
    color: AppColors.onSurface,
    marginTop: 8,
  },
  wants: {
    fontFamily: InterFont.regular,
    fontSize: 15,
    color: AppColors.onSurfaceMuted,
    marginTop: 4,
  },

  countdown: {
    fontFamily: InterFont.regular,
    fontSize: 13,
    color: AppColors.coinGold,
    marginTop: 12,
  },
  actions: { flexDirection: 'row', gap: 56, marginTop: 44 },
  actionCol: { alignItems: 'center', gap: 10 },
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
  actionLabel: { fontFamily: InterFont.regular, fontSize: 13, color: AppColors.onSurfaceMuted },
});

export default IncomingChatRequestModal;
