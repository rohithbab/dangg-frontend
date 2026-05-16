import { useConnectivityStore } from '@store/connectivityStore';

/** Subscribes only to the `isOnline` slice — no rebuild on unrelated changes. */
export function useConnectivity(): boolean {
  return useConnectivityStore(state => state.isOnline);
}
