import { useEffect, useRef } from 'react';

import { logger } from '@core/utils/logger';

import { getMyActiveChatSession } from '../api/chatRequestApi';

/**
 * On first mount, checks whether the current user is still a live participant in
 * an active chat session — e.g. after a force-close, where the app would
 * otherwise land on home while the partner still shows "busy". If so, invokes
 * `onResume` with the session's requestId so the caller can route back into the
 * chat.
 *
 * Runs exactly once per mount. The home stack remounts on login, so this
 * re-checks for each session but never loops within one.
 */
export function useResumeActiveChat(onResume: (requestId: string) => void): void {
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
        const active = await getMyActiveChatSession();
        if (active) {
          cb.current(active.requestId);
        }
      } catch (e) {
        logger.warn('useResumeActiveChat check failed', e);
      }
    })();
  }, []);
}
