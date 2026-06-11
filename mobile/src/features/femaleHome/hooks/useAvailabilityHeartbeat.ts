import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { logger } from '@core/utils/logger';

import { sendAvailabilityHeartbeat } from '../api/femaleHomeApi';

/** How often an online female proves liveness. Must stay well under the backend
 *  grace window (`sweep_stale_online_females` = 90s) — at 30s that tolerates two
 *  missed beats, so a force-close drops her card within ~90s. */
const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Keeps an online female from being swept offline by the backend liveness
 * cron. Fires one heartbeat immediately, then every 60s, but ONLY while:
 *   * she is online (`enabled`), and
 *   * the app is foregrounded.
 *
 * Backgrounding pauses heartbeats; if the OS suspends the app long enough the
 * sweep takes her offline (correct — she isn't reachable), and re-foregrounding
 * resumes heartbeats. Going offline (`enabled = false`) stops them at once.
 */
export function useAvailabilityHeartbeat(enabled: boolean): void {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const beat = (): void => {
      sendAvailabilityHeartbeat().catch(e => logger.debug('heartbeat skipped', e));
    };

    const start = (): void => {
      if (timer.current) {
        return;
      }
      beat();
      timer.current = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    };

    const stop = (): void => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };

    if (!enabled) {
      stop();
      return;
    }

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
  }, [enabled]);
}
