import React, { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useRealtimeChannel } from '@core/hooks/useRealtimeChannel';
import { logger } from '@core/utils/logger';

import { useSessionStore } from '@store/sessionStore';

import { UserRole } from '@app-types/domain';

import { fetchPendingIncomingRequest } from '../api/chatRequestApi';
import { useChatRequestStore } from '../store/chatRequestStore';

/** How often the female polls for a pending incoming request. Realtime is the
 *  fast path when it works; this guarantees the card still appears if it
 *  doesn't (local stacks frequently don't deliver postgres_changes). */
const POLL_MS = 3500;

type ChatRequestRow = { id: string; male_id: string; status: string };

/**
 * Female-side incoming-request driver. Two paths feed the single-slot store:
 *   * Realtime INSERT on `chat_requests` → instant card (best-effort).
 *   * Polling `fetchPendingIncomingRequest` every few seconds → reliable card.
 * Both are idempotent (same request id → same slot). A `lastHandledId` guard
 * stops a just-dismissed request from re-appearing in the window before its
 * status flips on the backend. Polling pauses while a card is already showing
 * and while the app is backgrounded.
 */
function FemaleIncomingSubscriber({ femaleId }: { femaleId: string }): null {
  const lastHandledId = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Reliable path: polling ──────────────────────────────────────────────
  useEffect(() => {
    const poll = async (): Promise<void> => {
      // A card is already up — don't fetch or override it.
      if (useChatRequestStore.getState().incoming) {
        return;
      }
      try {
        const req = await fetchPendingIncomingRequest();
        if (!req) {
          return;
        }
        if (req.id === lastHandledId.current) {
          return; // just dismissed; its status hasn't flipped yet
        }
        if (!useChatRequestStore.getState().incoming) {
          lastHandledId.current = req.id;
          logger.info('Incoming chat request (poll)', { id: req.id });
          useChatRequestStore.getState().setIncoming(req);
        }
      } catch (e) {
        logger.debug('incoming poll skipped', e);
      }
    };

    const start = (): void => {
      if (timer.current) {
        return;
      }
      void poll();
      timer.current = setInterval(() => {
        void poll();
      }, POLL_MS);
    };
    const stop = (): void => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };

    if (AppState.currentState === 'active') {
      start();
    }
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        start();
      } else {
        stop();
      }
    });
    return () => {
      stop();
      sub.remove();
    };
  }, [femaleId]);

  // ── Fast path: realtime (instant when the stack delivers postgres_changes) ─
  useRealtimeChannel(
    `incoming_chat_requests_${femaleId}`,
    channel =>
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_requests',
            filter: `female_id=eq.${femaleId}`,
          },
          payload => {
            const row = payload.new as ChatRequestRow;
            if (row.status === 'pending' && !useChatRequestStore.getState().incoming) {
              logger.info('Incoming chat request (realtime INSERT)', { id: row.id });
              void fetchPendingIncomingRequest().then(req => {
                if (req && req.id === row.id && !useChatRequestStore.getState().incoming) {
                  lastHandledId.current = req.id;
                  useChatRequestStore.getState().setIncoming(req);
                }
              });
            }
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_requests',
            filter: `female_id=eq.${femaleId}`,
          },
          payload => {
            const row = payload.new as ChatRequestRow;
            if (row.status !== 'pending') {
              const current = useChatRequestStore.getState().incoming;
              if (current && current.id === row.id) {
                useChatRequestStore.getState().clear();
              }
            }
          },
        ),
    [femaleId],
  );

  return null;
}

/**
 * Global mount point (App.tsx). Runs the female incoming-request driver only
 * for an authenticated female; renders nothing otherwise. Hooks live in the
 * inner component so they're never called conditionally.
 */
function IncomingChatRequestListener(): React.ReactElement | null {
  const role = useSessionStore(s => s.role);
  const femaleId = useSessionStore(s => s.session?.user.id);

  if (role !== UserRole.Female || !femaleId) {
    return null;
  }
  return <FemaleIncomingSubscriber femaleId={femaleId} />;
}

export default IncomingChatRequestListener;
