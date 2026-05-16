import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

import { logger } from '../utils/logger';

export type ConnectivityListener = (isOnline: boolean) => void;

function isOnline(state: NetInfoState): boolean {
  if (state.isConnected === false) {
    return false;
  }
  // `isInternetReachable` can be null on first read; treat as online to
  // avoid a false-offline flash at app start.
  return state.isInternetReachable !== false;
}

/**
 * Thin NetInfo wrapper. Use `subscribe` to keep state in sync (typically
 * invoked once from `App.tsx` to feed `connectivityStore`).
 */
export const connectivityService = {
  async currentStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return isOnline(state);
  },

  /** Returns an unsubscribe function. */
  subscribe(listener: ConnectivityListener): () => void {
    return NetInfo.addEventListener(state => {
      try {
        listener(isOnline(state));
      } catch (e) {
        logger.warn('connectivity listener threw', e);
      }
    });
  },
};
