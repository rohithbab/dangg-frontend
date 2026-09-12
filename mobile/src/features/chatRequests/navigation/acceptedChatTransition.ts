/**
 * Single authority for the "chat request accepted → open the room" transition.
 *
 * When a male's request is accepted, up to THREE independent triggers can fire
 * for the same acceptance, each of which used to drive its own navigation:
 *
 *   1. `ChatRequestSentScreen`'s status poll  → replace('ChatRequestAccepted')
 *   2. The FCM "accepted" push tap             → navigate('ChatRequestAccepted')
 *   3. `useResumeActiveChat` on cold start     → navigate('ChatSession')
 *
 * With no coordination, two (or three) of these run for one acceptance —
 * stacking duplicate ChatRequestAccepted/ChatSession screens, each of which
 * re-initialises the room and opens its own Realtime subscription. That is the
 * reported navigation/loading loop.
 *
 * This module makes the transition idempotent by requestId: whichever trigger
 * fires first claims it; every later trigger for the same requestId is a no-op.
 * The check is synchronous, so even triggers racing within the same tick resolve
 * to exactly one winner. A brand-new request has a new requestId and claims
 * freely; `resetAcceptedTransition` is called when a fresh waiting flow starts
 * so a repeated id (should never happen, but defensively) can transition again.
 */
let handledRequestId: string | null = null;

/**
 * Attempt to claim the accepted→room transition for `requestId`. Returns `true`
 * only for the FIRST caller for a given id — that caller performs the
 * navigation; all others must do nothing.
 */
export function claimAcceptedTransition(requestId: string): boolean {
  if (!requestId || handledRequestId === requestId) {
    return false;
  }
  handledRequestId = requestId;
  return true;
}

/**
 * Release the guard so the next acceptance can transition. Called when a new
 * outgoing-request waiting flow begins (a new request is being awaited).
 */
export function resetAcceptedTransition(): void {
  handledRequestId = null;
}
