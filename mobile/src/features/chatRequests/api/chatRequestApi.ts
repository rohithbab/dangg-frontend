/**
 * Chat-request lifecycle for both sides of the flow.
 *
 * Receiver side (female): `acceptRequest`, `declineRequest`. The global
 * `IncomingChatRequestModal` reads from `chatRequestStore`, which is only
 * ever populated by a Supabase Realtime subscription in production.
 *
 * Sender side (male): `sendChatRequest`, `getSentRequestStatus`,
 * `cancelSentRequest`. The Sent screen polls `getSentRequestStatus` every
 * few seconds until the row's status flips to accepted/declined/expired.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

/** Female accepts an incoming request — opens chat (Phase 2). */
export async function acceptRequest(requestId: string): Promise<void> {
  if (Env.devMode) {
    return;
  }
  const { error } = await getSupabaseClient()
    .from('chat_requests')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Female declines an incoming request (or it auto-declines on timeout). */
export async function declineRequest(
  requestId: string,
  reason: 'manual' | 'timeout' = 'manual',
): Promise<void> {
  if (Env.devMode) {
    return;
  }
  const { error } = await getSupabaseClient()
    .from('chat_requests')
    .update({ status: 'declined', decline_reason: reason, responded_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) {
    throw mapSupabaseError(error);
  }
}

// ---------------------------------------------------------------------------
// Sender-side flow (male initiates).
// ---------------------------------------------------------------------------

export type SentRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired';

/** Male initiates a chat request to a female. Returns the new request id. */
export async function sendChatRequest(payload: {
  femaleId: string;
  coinCost: number;
}): Promise<{ requestId: string }> {
  if (Env.devMode) {
    return { requestId: `local-${Date.now()}` };
  }
  const { data, error } = await getSupabaseClient()
    .from('chat_requests')
    .insert({
      female_id: payload.femaleId,
      coin_cost: payload.coinCost,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error) {
    throw mapSupabaseError(error);
  }
  return { requestId: (data as { id: string }).id };
}

/** Polled by the Sent (waiting) screen. */
export async function getSentRequestStatus(requestId: string): Promise<SentRequestStatus> {
  if (Env.devMode) {
    const timestampStr = requestId.replace('local-', '');
    const timestamp = parseInt(timestampStr, 10);
    if (!isNaN(timestamp)) {
      const elapsed = Date.now() - timestamp;
      // After 6 seconds, cycle outcomes based on timestamp
      if (elapsed > 6000) {
        const choice = timestamp % 3;
        if (choice === 0) {
          return 'accepted';
        }
        if (choice === 1) {
          return 'declined';
        }
        return 'expired';
      }
    }
    return 'pending';
  }
  const { data, error } = await getSupabaseClient()
    .from('chat_requests')
    .select('status')
    .eq('id', requestId)
    .maybeSingle();
  if (error) {
    throw mapSupabaseError(error);
  }
  const status = (data as { status?: string } | null)?.status;
  if (status === 'accepted' || status === 'declined' || status === 'expired') {
    return status;
  }
  return 'pending';
}

/** Male cancels a pending request (refunds coins). */
export async function cancelSentRequest(requestId: string): Promise<void> {
  if (Env.devMode) {
    return;
  }
  const { error } = await getSupabaseClient()
    .from('chat_requests')
    .update({ status: 'expired', decline_reason: 'cancelled_by_sender' })
    .eq('id', requestId);
  if (error) {
    throw mapSupabaseError(error);
  }
}
