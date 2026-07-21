import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useDiscoveryStore } from './discovery';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  deviceId: string | null;
  hostname: string | null;
  version: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, hostname: string, version: string, bridgeId?: string) => void;
  pair: (token: string, refreshToken: string, deviceId: string, bridgeId?: string) => void;
  updateTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      deviceId: null,
      hostname: null,
      version: null,
      isAuthenticated: false,

      login: (token, refreshToken, hostname, version, bridgeId) => {
        // Persist bridgeId for zero-config discovery
        if (bridgeId) {
          useDiscoveryStore.getState().setBridgeId(bridgeId);
        }
        set({ token, refreshToken, hostname, version, isAuthenticated: true });
      },

      pair: (token, refreshToken, deviceId, bridgeId) => {
        if (bridgeId) {
          useDiscoveryStore.getState().setBridgeId(bridgeId);
        }
        set({ token, refreshToken, deviceId, isAuthenticated: true });
      },

      updateTokens: (token, refreshToken) =>
        set({ token, refreshToken }),

      logout: () =>
        set({
          token: null,
          refreshToken: null,
          hostname: null,
          version: null,
          isAuthenticated: false,
        }),
    }),
    { name: 'mac-bridge-auth' }
  )
);
