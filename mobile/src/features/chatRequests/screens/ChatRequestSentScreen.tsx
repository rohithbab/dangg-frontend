import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@theme/colors';
import { AppSpacing } from '@theme/spacing';
import { InterFont } from '@theme/typography';

import ConfirmationDialog from '@core/components/ConfirmationDialog';
import GradientAvatar from '@core/components/GradientAvatar';
import { USE_MOCK_DATA } from '@core/config/env';
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

/**
 * B8 · Waiting (Neue). Ripple-ring avatar of the requested female + "Waiting
 * for {name} to accept…". Polls status every 3s and routes to the matching
 * outcome; hardware/close both go through the Cancel confirmation (refund).
 */
function ChatRequestSentScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { requestId, femaleName } = route.params;

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
    fontSize: 22,
    color: AppColors.onSurface,
    textAlign: 'center',
    marginTop: AppSpacing.xl,
  },
  subtitle: {
    fontFamily: InterFont.regular,
    fontSize: 14.5,
    color: AppColors.onSurfaceMuted,
    marginTop: AppSpacing.sm,
    textAlign: 'center',
  },
  expires: {
    fontFamily: InterFont.medium,
    fontSize: 13,
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
  cancelLabel: { fontFamily: InterFont.medium, fontSize: 16, color: AppColors.primary },
});

export default ChatRequestSentScreen;
