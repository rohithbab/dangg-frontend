import { useEffect, useState } from 'react';

import { getSupabaseClient } from '@core/network/supabaseClient';

import { ONLINE_FEMALES_CHANNEL } from '@features/femaleHome/hooks/useFemaleOnlinePresence';

/**
 * Reads the shared `online-females` presence channel and returns the set of
 * female ids we've observed *actually leave* (socket dropped / force-close) and
 * not rejoin. The male home hides ONLY these — so a force-closed female drops
 * off near-instantly, while a genuinely-online female who simply isn't in the
 * presence set (tracking hiccup / self-hosted realtime flakiness) is never
 * wrongly hidden. Her DB online flag (with its freshness window) remains the
 * source of truth for everyone else.
 */
export function useOnlineFemalePresence(): ReadonlySet<string> {
  const [leftIds, setLeftIds] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    const client = getSupabaseClient();
    const channel = client.channel(ONLINE_FEMALES_CHANNEL, {
      config: { presence: { key: 'observer' } },
    });

    const markLeft = (key: string): void => {
      setLeftIds(prev => {
        if (prev.has(key)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    };
    const markPresent = (key: string): void => {
      setLeftIds(prev => {
        if (!prev.has(key)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    channel
      .on('presence', { event: 'leave' }, ({ key }: { key: string }) => markLeft(key))
      .on('presence', { event: 'join' }, ({ key }: { key: string }) => markPresent(key))
      .on('presence', { event: 'sync' }, () => {
        // Anyone currently present is definitely not "left" — clear them (covers
        // a missed join). Never ADD from sync: absence != a confirmed leave.
        const present = new Set(Object.keys(channel.presenceState()));
        setLeftIds(prev => {
          let changed = false;
          const next = new Set(prev);
          for (const id of prev) {
            if (present.has(id)) {
              next.delete(id);
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      })
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, []);

  return leftIds;
}
