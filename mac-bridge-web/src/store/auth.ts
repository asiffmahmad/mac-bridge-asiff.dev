import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  deviceId: string | null;
  hostname: string | null;
  version: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, hostname: string, version: string) => void;
  pair: (token: string, refreshToken: string, deviceId: string) => void;
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
      login: (token, refreshToken, hostname, version) => 
        set({ token, refreshToken, hostname, version, isAuthenticated: true }),
      pair: (token, refreshToken, deviceId) => 
        set({ token, refreshToken, deviceId, isAuthenticated: true }),
      updateTokens: (token, refreshToken) => 
        set({ token, refreshToken }),
      logout: () => set({ 
        token: null, 
        refreshToken: null, 
        hostname: null, 
        version: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'mac-bridge-auth',
    }
  )
);
