import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type ConnectivityState = {
  isOnline: boolean;
  setOnline: (value: boolean) => void;
};

/**
 * Online/offline state, fed by `connectivityService.subscribe(...)` from
 * `App.tsx`. Default-initialised to `true` so the offline banner doesn't
 * flash during the brief window before NetInfo emits its first event.
 */
export const useConnectivityStore = create<ConnectivityState>()(
  subscribeWithSelector(set => ({
    isOnline: true,
    setOnline: (value): void => set({ isOnline: value }),
  })),
);

export const useIsOnline = (): boolean => useConnectivityStore(s => s.isOnline);
