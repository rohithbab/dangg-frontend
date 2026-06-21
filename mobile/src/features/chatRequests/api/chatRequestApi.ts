/**
 * Chat-request lifecycle for both sides of the flow.
 *
 * Receiver side (female): `acceptRequest`, `declineRequest`. The global
 * `IncomingChatRequestModal` reads from `chatRequestStore`, populated by a
 * Realtime subscription when available and by `fetchPendingIncomingRequest`
 * polling as a reliable fallback (see IncomingChatRequestListener).
 *
 * Sender side (male): `sendChatRequest`, `getSentRequestStatus`,
 * `cancelSentRequest`. The Sent screen polls `getSentRequestStatus` every
 * few seconds until the row's status flips to accepted/declined/expired.
 */
import { USE_MOCK_DATA } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

import { type IncomingChatRequest } from '../store/chatRequestStore';

export type ChatSession = {
  id: string;
  requestId: string;
  maleId: string;
  femaleId: string;
  status: 'active' | 'ended';
  startedAt: string;
  endedAt: string | null;
  /** Display name of the OTHER participant (resolved relative to the caller). */
  partnerName: string;
  partnerAvatarUrl: string | null;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  senderId: string;
  body: string;
  sentAt: string;
};

/** A row in the Chat Inbox — one conversation with its counterparty + snippet. */
export type ChatHistoryItem = {
  sessionId: string;
  /** chat_request_id — what ChatSession/FemaleChatSession routes expect. */
  requestId: string;
  counterpartId: string;
  counterpartName: string;
  counterpartAvatarUrl: string | null;
  /** Last message body, or null when no messages have been sent yet. */
  lastMessage: string | null;
  lastMessageAt: Date | null;
  status: 'active' | 'ended';
};

function unwrapFunctionData<T>(response: unknown): T {
  if (
    response &&
    typeof response === 'object' &&
    'ok' in response &&
    (response as { ok?: boolean }).ok === true &&
    'data' in response
  ) {
    return (response as { data: T }).data;
  }

  return response as T;
}

/** Female accepts an incoming request — opens chat (Phase 2). */
export async function acceptRequest(requestId: string): Promise<{ chatSessionId?: string }> {
  if (USE_MOCK_DATA) {
    return { chatSessionId: `local-session-${requestId}` };
  }
  const { data, error } = await getSupabaseClient().functions.invoke('chat-requests-respond', {
    body: { chatRequestId: requestId, action: 'accept' },
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  const body = unwrapFunctionData<{ chatSessionId?: string }>(data);
  return { chatSessionId: body.chatSessionId };
}

/** Female declines an incoming request (or it auto-declines on timeout). */
export async function declineRequest(
  requestId: string,
  _reason: 'manual' | 'timeout' = 'manual',
): Promise<void> {
  if (USE_MOCK_DATA) {
    return;
  }
  const { error } = await getSupabaseClient().functions.invoke('chat-requests-respond', {
    body: { chatRequestId: requestId, action: 'decline' },
  });
  if (error) {
    throw mapSupabaseError(error);
  }
}

// ---------------------------------------------------------------------------
// Sender-side flow (male initiates).
// ---------------------------------------------------------------------------

export type SentRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired';

/**
 * Male initiates a chat request to a female. Returns the new request id and
 * the authoritative coin balance after the escrow debit, so the wallet UI can
 * reconcile its optimistic estimate — important in dev, where the backend
 * auto-grants a mock top-up when the balance is short.
 */
export async function sendChatRequest(payload: {
  femaleId: string;
  coinCost: number;
}): Promise<{ requestId: string; newCoinBalance: number | null }> {
  if (USE_MOCK_DATA) {
    return { requestId: `local-${Date.now()}`, newCoinBalance: null };
  }
  const { data, error } = await getSupabaseClient().functions.invoke('chat-requests-send', {
    body: { femaleId: payload.femaleId },
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  const body = unwrapFunctionData<{ chatRequestId: string; newCoinBalance?: number }>(data);
  return {
    requestId: body.chatRequestId,
    newCoinBalance: typeof body.newCoinBalance === 'number' ? body.newCoinBalance : null,
  };
}

/**
 * Female-side: fetch the most recent still-pending incoming request (with the
 * requester's public name/avatar hydrated). Used as a reliable polling
 * fallback for the incoming-request card — Realtime delivers instantly when it
 * works, but polling guarantees the card appears even when it doesn't.
 * Returns null when there's nothing pending.
 */
export async function fetchPendingIncomingRequest(): Promise<IncomingChatRequest | null> {
  if (USE_MOCK_DATA) {
    return null;
  }
  const client = getSupabaseClient();
  const { data: sessionData } = await client.auth.getSession();
  const femaleId = sessionData.session?.user.id;
  if (!femaleId) {
    return null;
  }

  const { data: req, error } = await client
    .from('chat_requests')
    .select('id, male_id, chat_cost_coins, sent_at, status')
    .eq('female_id', femaleId)
    .eq('status', 'pending')
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !req) {
    return null;
  }

  let requesterName = 'Someone';
  let requesterAvatarUrl: string | null = null;
  const { data: male } = await client
    .from('users')
    .select('name, profile_picture_url')
    .eq('id', req.male_id)
    .maybeSingle();
  if (male) {
    requesterName = (male as { name?: string }).name ?? requesterName;
    requesterAvatarUrl =
      (male as { profile_picture_url?: string | null }).profile_picture_url ?? null;
  }

  return {
    id: req.id as string,
    requesterName,
    requesterAvatarUrl,
    coinAmount: req.chat_cost_coins as number,
    receivedAt: new Date((req.sent_at as string) ?? Date.now()),
  };
}

/** Resolves the active chat session created for an accepted request. */
export async function getChatSessionForRequest(requestId: string): Promise<ChatSession | null> {
  if (USE_MOCK_DATA) {
    return {
      id: `local-session-${requestId}`,
      requestId,
      maleId: 'local-male',
      femaleId: 'local-female',
      status: 'active',
      startedAt: new Date().toISOString(),
      endedAt: null,
      partnerName: '',
      partnerAvatarUrl: null,
    };
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from('chat_sessions')
    .select('id, chat_request_id, male_id, female_id, status, started_at, ended_at')
    .eq('chat_request_id', requestId)
    .maybeSingle();

  if (error) {
    throw mapSupabaseError(error);
  }
  if (!data) {
    return null;
  }

  // Resolve the OTHER participant's display name relative to the caller. RLS
  // (`users_select_related`) lets each participant read the other's profile
  // because a chat_request links them.
  const { data: userData } = await client.auth.getUser();
  const selfId = userData.user?.id ?? null;
  const counterpartId = selfId === data.male_id ? data.female_id : data.male_id;
  let partnerName = '';
  let partnerAvatarUrl: string | null = null;
  if (counterpartId) {
    const { data: partner } = await client
      .from('users')
      .select('name, profile_picture_url')
      .eq('id', counterpartId)
      .maybeSingle();
    if (partner) {
      partnerName = partner.name ?? '';
      partnerAvatarUrl = partner.profile_picture_url ?? null;
    }
  }

  return {
    id: data.id,
    requestId: data.chat_request_id,
    maleId: data.male_id,
    femaleId: data.female_id,
    status: data.status,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    partnerName,
    partnerAvatarUrl,
  } as ChatSession;
}

/** Loads ordered message history for a chat session. */
export async function listChatMessages(sessionId: string): Promise<ChatMessage[]> {
  if (USE_MOCK_DATA) {
    return [];
  }

  const { data, error } = await getSupabaseClient()
    .from('chat_messages')
    .select('id, chat_session_id, sender_id, body, sent_at')
    .eq('chat_session_id', sessionId)
    .order('sent_at', { ascending: true });

  if (error) {
    throw mapSupabaseError(error);
  }

  return (data ?? []).map(row => ({
    id: row.id,
    sessionId: row.chat_session_id,
    senderId: row.sender_id,
    body: row.body,
    sentAt: row.sent_at,
  }));
}

/**
 * Chat Inbox feed for both roles. Lists the caller's chat sessions newest-first
 * (by last_message_at, falling back to started_at), with the counterparty's
 * name/avatar and a snippet of the most recent message.
 *
 * Security: relies entirely on RLS — `chat_sessions` is participant-scoped
 * (`auth.uid() IN (male_id, female_id)`), `chat_messages` likewise, and the
 * counterparty's `users` row is readable because a chat_request links them
 * (`users_select_related`). No other user's chats can surface.
 */
export async function listChatHistory(): Promise<ReadonlyArray<ChatHistoryItem>> {
  if (USE_MOCK_DATA) {
    return [];
  }
  const client = getSupabaseClient();
  const { data: sessionData } = await client.auth.getSession();
  const selfId = sessionData.session?.user.id;
  if (!selfId) {
    return [];
  }

  // 1. Sessions (RLS already restricts to the caller's). Sort newest activity
  //    first; rows with no messages yet (null last_message_at) sort to the end.
  const { data: sessions, error } = await client
    .from('chat_sessions')
    .select('id, chat_request_id, male_id, female_id, status, started_at, last_message_at')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('started_at', { ascending: false });
  if (error) {
    throw mapSupabaseError(error);
  }
  const rows = (sessions ?? []) as Array<{
    id: string;
    chat_request_id: string;
    male_id: string;
    female_id: string;
    status: 'active' | 'ended';
    started_at: string;
    last_message_at: string | null;
  }>;
  if (rows.length === 0) {
    return [];
  }

  // 2. Resolve counterparties and fetch their public profiles in one query.
  const counterpartIds = Array.from(
    new Set(rows.map(r => (r.male_id === selfId ? r.female_id : r.male_id))),
  );
  const { data: users } = await client
    .from('users')
    .select('id, name, profile_picture_url')
    .in('id', counterpartIds);
  const userById = new Map<string, { name: string; profile_picture_url: string | null }>();
  (users ?? []).forEach(u =>
    userById.set(u.id, { name: u.name, profile_picture_url: u.profile_picture_url }),
  );

  // 3. Latest message snippet per session — one query, newest first, keep the
  //    first body seen for each session id.
  const sessionIds = rows.map(r => r.id);
  const { data: messages } = await client
    .from('chat_messages')
    .select('chat_session_id, body, sent_at')
    .in('chat_session_id', sessionIds)
    .order('sent_at', { ascending: false });
  const snippetBySession = new Map<string, { body: string; sentAt: string }>();
  (messages ?? []).forEach(m => {
    if (!snippetBySession.has(m.chat_session_id)) {
      snippetBySession.set(m.chat_session_id, { body: m.body, sentAt: m.sent_at });
    }
  });

  return rows.map(r => {
    const counterpartId = r.male_id === selfId ? r.female_id : r.male_id;
    const profile = userById.get(counterpartId);
    const snippet = snippetBySession.get(r.id);
    const lastMessageAtIso = snippet?.sentAt ?? r.last_message_at;
    return {
      sessionId: r.id,
      requestId: r.chat_request_id,
      counterpartId,
      counterpartName: profile?.name ?? 'Unknown',
      counterpartAvatarUrl: profile?.profile_picture_url ?? null,
      lastMessage: snippet?.body ?? null,
      lastMessageAt: lastMessageAtIso ? new Date(lastMessageAtIso) : null,
      status: r.status,
    };
  });
}

/**
 * Current status of a chat session ('active' | 'ended'), or null if it can't
 * be read. Used by the chat screens to detect when the OTHER participant ended
 * the chat (the local stack's realtime doesn't deliver, so the screens poll).
 */
export async function getChatSessionStatus(sessionId: string): Promise<'active' | 'ended' | null> {
  if (USE_MOCK_DATA) {
    return 'active';
  }
  const { data, error } = await getSupabaseClient()
    .from('chat_sessions')
    .select('status')
    .eq('id', sessionId)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return (data as { status?: 'active' | 'ended' }).status ?? null;
}

/**
 * Ends a chat session for BOTH participants. Either side may call it; the
 * `chat_sessions_end_participant` RLS policy restricts the update to ending.
 * Idempotent — a no-op if the session is already ended (the `.eq('status',
 * 'active')` guard means a second call simply matches no rows).
 */
export async function endChatSession(sessionId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    return;
  }
  const client = getSupabaseClient();
  const { data: userData } = await client.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) {
    return;
  }
  const { error } = await client
    .from('chat_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString(), ended_by: uid })
    .eq('id', sessionId)
    .eq('status', 'active');
  if (error) {
    throw mapSupabaseError(error);
  }
}

/** Inserts a text message. Realtime delivers it to the other participant. */
export async function sendChatMessage(sessionId: string, body: string): Promise<ChatMessage> {
  if (USE_MOCK_DATA) {
    return {
      id: String(Date.now()),
      sessionId,
      senderId: 'local-self',
      body,
      sentAt: new Date().toISOString(),
    };
  }

  const client = getSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) {
    throw mapSupabaseError(userError);
  }
  if (!userData.user) {
    throw new Error('You must be signed in to send a message.');
  }

  const { data, error } = await client
    .from('chat_messages')
    .insert({
      chat_session_id: sessionId,
      sender_id: userData.user.id,
      body,
    })
    .select('id, chat_session_id, sender_id, body, sent_at')
    .single();

  if (error) {
    throw mapSupabaseError(error);
  }

  return {
    id: data.id,
    sessionId: data.chat_session_id,
    senderId: data.sender_id,
    body: data.body,
    sentAt: data.sent_at,
  };
}

/** Polled by the Sent (waiting) screen. */
export async function getSentRequestStatus(requestId: string): Promise<SentRequestStatus> {
  if (USE_MOCK_DATA) {
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
  if (USE_MOCK_DATA) {
    return;
  }
  const { error } = await getSupabaseClient().functions.invoke('chat-requests-cancel', {
    body: { chatRequestId: requestId },
  });
  if (error) {
    throw mapSupabaseError(error);
  }
}
