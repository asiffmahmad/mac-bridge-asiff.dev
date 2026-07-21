import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  bridgeUrl: string;
  theme: 'dark' | 'light';
  setBridgeUrl: (url: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      bridgeUrl: import.meta.env.VITE_BRIDGE_URL || 'http://localhost:8080',
      theme: 'dark',
      setBridgeUrl: (url) => set({ bridgeUrl: url }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'mac-bridge-settings',
    }
  )
);
