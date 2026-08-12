import { useEffect, useState } from 'react';

import { getSupabaseClient } from '@core/network/supabaseClient';

import { ONLINE_FEMALES_CHANNEL } from '@features/femaleHome/hooks/useFemaleOnlinePresence';

export type OnlinePresence = {
  /** Female ids currently holding a live presence socket (online right now). */
  presentIds: ReadonlySet<string>;
  /** True once at least one presence sync landed; false if presence is
   *  unavailable (channel error/timeout), so callers fall back to the DB flag. */
  ready: boolean;
};

/**
 * Reads the shared `online-females` presence channel. Females hold a presence
 * entry (keyed by their id) while online; the moment one force-closes, the OS
 * drops her socket and the server fires a "leave" within a couple of seconds.
 * The male home merges `presentIds` over the DB online flag so her card flips
 * offline near-instantly, instead of lingering until the heartbeat sweep.
 */
export function useOnlineFemalePresence(): OnlinePresence {
  const [presentIds, setPresentIds] = useState<ReadonlySet<string>>(() => new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const client = getSupabaseClient();
    const channel = client.channel(ONLINE_FEMALES_CHANNEL, {
      config: { presence: { key: 'observer' } },
    });
    const sync = (): void => {
      // Presence keys are the tracking females' ids (see useFemaleOnlinePresence).
      setPresentIds(new Set(Object.keys(channel.presenceState())));
    };
    channel
      .on('presence', { event: 'sync' }, () => {
        setReady(true);
        sync();
      })
      .on('presence', { event: 'join' }, sync)
      .on('presence', { event: 'leave' }, sync)
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setReady(false);
        }
      });
    return () => {
      void client.removeChannel(channel);
    };
  }, []);

  return { presentIds, ready };
}
