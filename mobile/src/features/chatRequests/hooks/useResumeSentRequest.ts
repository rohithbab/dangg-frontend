import { useEffect, useRef } from 'react';

import { logger } from '@core/utils/logger';

import { getMyActiveChatSession, getMyPendingSentRequest } from '../api/chatRequestApi';

export type ResumedSentRequest = {
  requestId: string;
  femaleName: string | null;
  /** Absolute expiry in epoch ms (server clock) — drives the resumed timer. */
  expiresAt: number;
};

/**
 * On first mount, checks whether the male still has a pending OUTGOING chat
 * request — e.g. after a force-close, where the app would otherwise land on
 * home with the request still pending server-side (timer gone, and a new
 * request 409s "already pending"). If so, invokes `onResume` so the caller can
 * route back to the waiting screen with the real remaining time.
 *
 * An active (accepted) session takes priority and is handled separately by
 * `useResumeActiveChat`; we skip here when one exists so the two never fight.
 * Runs once per mount (the home stack remounts on login).
 */
export function useResumeSentRequest(onResume: (req: ResumedSentRequest) => void): void {
  const checked = useRef(false);
  const cb = useRef(onResume);
  cb.current = onResume;

  useEffect(() => {
    if (checked.current) {
      return;
    }
    checked.current = true;
    void (async () => {
      try {
        // An accepted request is already a live session — that path wins.
        const activeSession = await getMyActiveChatSession();
        if (activeSession) {
          return;
        }
        const pending = await getMyPendingSentRequest();
        if (pending) {
          cb.current(pending);
        }
      } catch (e) {
        logger.warn('useResumeSentRequest check failed', e);
      }
    })();
  }, []);
}
