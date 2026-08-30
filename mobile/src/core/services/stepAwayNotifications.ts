import notifee, { AndroidImportance, TriggerType, type TimestampTrigger } from '@notifee/react-native';

import { logger } from '../utils/logger';

const CHANNEL_ID = 'chat-activity';
const IMMEDIATE_ID = 'step-away-now';
const WARNING_ID = 'step-away-warning';
const ENDED_ID = 'step-away-ended';

/** Must match PEER_AWAY_GRACE_SECONDS in the chat screens. */
export const STEP_AWAY_GRACE_SECONDS = 30;
/** Last-chance warning — fires with ~10s left. */
const WARNING_AT_SECONDS = STEP_AWAY_GRACE_SECONDS - 10;

let channelReady = false;

async function ensureChannel(): Promise<void> {
  if (channelReady) {
    return;
  }
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Chat activity',
    description: 'Reminders to return to an active chat before it ends.',
    importance: AndroidImportance.HIGH,
  });
  channelReady = true;
}

const androidBase = {
  channelId: CHANNEL_ID,
  smallIcon: 'ic_launcher',
  pressAction: { id: 'default' },
} as const;

/**
 * Called when the user backgrounds an ACTIVE chat. Fires an immediate "you
 * stepped away" reminder and schedules a last-15s warning + an "ended" notice,
 * so a backgrounded/force-closed peer knows the 90s clock is running. notifee
 * schedules the two triggers via the OS alarm, so they fire even if the app is
 * killed. All three are cleared by cancelStepAwayNotifications() the moment the
 * user returns or leaves the chat.
 */
export async function scheduleStepAwayNotifications(partnerName: string): Promise<void> {
  const name = partnerName.trim() || 'your chat partner';
  try {
    await ensureChannel();
    await cancelStepAwayNotifications();
    const now = Date.now();

    await notifee.displayNotification({
      id: IMMEDIATE_ID,
      title: 'You stepped away',
      body: `Return to your chat with ${name} within ${STEP_AWAY_GRACE_SECONDS} seconds or it will end.`,
      android: androidBase,
    });

    const warnTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: now + WARNING_AT_SECONDS * 1000,
    };
    await notifee.createTriggerNotification(
      {
        id: WARNING_ID,
        title: 'Chat ending soon',
        body: `Your chat with ${name} ends in 10 seconds — tap to return.`,
        android: androidBase,
      },
      warnTrigger,
    );

    const endTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: now + STEP_AWAY_GRACE_SECONDS * 1000,
    };
    await notifee.createTriggerNotification(
      {
        id: ENDED_ID,
        title: 'Chat ended',
        body: `Your chat with ${name} ended — you were away too long.`,
        android: androidBase,
      },
      endTrigger,
    );
  } catch (e) {
    logger.warn('scheduleStepAwayNotifications failed', e);
  }
}

/**
 * Clears every step-away notification — the immediate reminder plus the two
 * scheduled triggers (cancelNotification covers both displayed and pending).
 * Call on foreground/return, on chat end, and on chat-screen unmount.
 */
export async function cancelStepAwayNotifications(): Promise<void> {
  try {
    await Promise.all([
      notifee.cancelNotification(IMMEDIATE_ID),
      notifee.cancelNotification(WARNING_ID),
      notifee.cancelNotification(ENDED_ID),
    ]);
  } catch (e) {
    logger.warn('cancelStepAwayNotifications failed', e);
  }
}
