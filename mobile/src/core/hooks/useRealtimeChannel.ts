/* eslint-disable react-hooks/exhaustive-deps -- `setup` and `name` are
   intentionally NOT in deps. Callers drive re-subscription via the `deps`
   array — inlining `setup` per render would re-subscribe every paint. */
import { type RealtimeChannel } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { getSupabaseClient } from '../network/supabaseClient';
import { logger } from '../utils/logger';

export type ChannelSetup = (channel: RealtimeChannel) => RealtimeChannel;

/**
 * Subscribes to a Supabase Realtime channel for the lifetime of the
 * consuming component. Always pair channels with a hook like this so a
 * leaked subscription is impossible — the cleanup function removes the
 * channel on unmount.
 *
 * Example:
 * ```ts
 * useRealtimeChannel(
 *   `chat_requests:female_id=eq.${femaleId}`,
 *   channel =>
 *     channel.on(
 *       'postgres_changes',
 *       { event: 'INSERT', schema: 'public', table: 'chat_requests',
 *         filter: `female_id=eq.${femaleId}` },
 *       payload => handleIncoming(payload.new),
 *     ),
 *   [femaleId],
 * );
 * ```
 */
export function useRealtimeChannel(
  name: string,
  setup: ChannelSetup,
  deps: ReadonlyArray<unknown>,
): void {
  useEffect(() => {
    const client = getSupabaseClient();
    const channel = setup(client.channel(name));
    channel.subscribe(status => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        logger.warn(`realtime channel "${name}" status=${status}`);
      }
    });
    return () => {
      void client.removeChannel(channel);
    };
  }, deps);
}
