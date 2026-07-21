import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Stores the Bridge ID used for zero-config tunnel URL discovery via ntfy.sh.
 *
 * How it works:
 * 1. On login or pairing, the backend returns a `bridgeId`.
 * 2. We persist it here.
 * 3. When the connection fails, useConnectionManager polls:
 *    https://ntfy.sh/<bridgeId>/json?poll=1
 *    and extracts the latest Cloudflare tunnel URL.
 * 4. The settings store's bridgeUrl is updated transparently.
 */
interface DiscoveryState {
  bridgeId: string | null;
  lastDiscoveredUrl: string | null;
  discoveryStatus: 'idle' | 'discovering' | 'found' | 'failed';

  setBridgeId: (id: string) => void;
  setDiscoveryStatus: (status: 'idle' | 'discovering' | 'found' | 'failed') => void;
  setLastDiscoveredUrl: (url: string | null) => void;
}

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set) => ({
      bridgeId: null,
      lastDiscoveredUrl: null,
      discoveryStatus: 'idle',

      setBridgeId: (id) => set({ bridgeId: id }),
      setDiscoveryStatus: (status) => set({ discoveryStatus: status }),
      setLastDiscoveredUrl: (url) => set({ lastDiscoveredUrl: url }),
    }),
    { name: 'mac-bridge-discovery' }
  )
);
