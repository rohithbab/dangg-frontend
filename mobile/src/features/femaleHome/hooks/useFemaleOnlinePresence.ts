import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { getSupabaseClient } from '@core/network/supabaseClient';
import { logger } from '@core/utils/logger';

/** Shared Realtime presence channel for live female online status. Must match
 *  the male reader in `useOnlineFemalePresence`. */
export const ONLINE_FEMALES_CHANNEL = 'online-females';

/**
 * While she is online, holds a Realtime presence entry on the shared
 * `online-females` channel, keyed by her id. Males read this channel and merge
 * it over the DB online flag, so the moment she force-closes (the OS tears down
 * the socket) the server fires a presence "leave" and her card flips offline on
 * the male side within a couple of seconds — no heartbeat/poll delay.
 *
 * Leaves when she toggles offline or the screen unmounts. The DB heartbeat +
 * sweep remain the durable record and the fallback if presence is unavailable.
 */
export function useFemaleOnlinePresence(enabled: boolean, femaleId: string | null): void {
  useEffect(() => {
    if (!enabled || !femaleId) {
      return undefined;
    }
    const client = getSupabaseClient();
    const channel = client.channel(ONLINE_FEMALES_CHANNEL, {
      config: { presence: { key: femaleId } },
    });
    const track = (): void => {
      void channel
        .track({ female_id: femaleId, at: Date.now() })
        .catch(e => logger.debug('online presence track failed', e));
    };
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        track();
      }
    });
    // Re-assert presence when returning to the foreground — the socket may have
    // been torn down and re-established while backgrounded.
    const appSub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        track();
      }
    });
    return () => {
      appSub.remove();
      void channel.untrack();
      void client.removeChannel(channel);
    };
  }, [enabled, femaleId]);
}
