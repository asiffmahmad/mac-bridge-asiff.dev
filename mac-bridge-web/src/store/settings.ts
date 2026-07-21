import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  bridgeUrl: string;
  tunnelUrl: string;
  localIp: string;
  theme: 'dark' | 'light';
  autoReconnect: boolean;
  notifications: boolean;
  
  setBridgeUrl: (url: string) => void;
  setTunnelUrl: (url: string) => void;
  setLocalIp: (ip: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setAutoReconnect: (autoReconnect: boolean) => void;
  setNotifications: (notifications: boolean) => void;
  
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      bridgeUrl: import.meta.env.VITE_BRIDGE_URL || 'http://localhost:8080',
      tunnelUrl: '',
      localIp: '',
      theme: 'dark',
      autoReconnect: true,
      notifications: true,
      
      setBridgeUrl: (url) => set({ bridgeUrl: url }),
      setTunnelUrl: (url) => set({ tunnelUrl: url }),
      setLocalIp: (ip) => set({ localIp: ip }),
      setTheme: (theme) => set({ theme }),
      setAutoReconnect: (autoReconnect) => set({ autoReconnect }),
      setNotifications: (notifications) => set({ notifications }),
      
      exportSettings: () => {
        const state = get();
        return JSON.stringify({
          bridgeUrl: state.bridgeUrl,
          tunnelUrl: state.tunnelUrl,
          localIp: state.localIp,
          theme: state.theme,
          autoReconnect: state.autoReconnect,
          notifications: state.notifications
        });
      },
      
      importSettings: (settingsJson) => {
        try {
          const parsed = JSON.parse(settingsJson);
          set({
            bridgeUrl: parsed.bridgeUrl ?? get().bridgeUrl,
            tunnelUrl: parsed.tunnelUrl ?? get().tunnelUrl,
            localIp: parsed.localIp ?? get().localIp,
            theme: parsed.theme ?? get().theme,
            autoReconnect: parsed.autoReconnect ?? get().autoReconnect,
            notifications: parsed.notifications ?? get().notifications,
          });
          return true;
        } catch (e) {
          return false;
        }
      }
    }),
    {
      name: 'mac-bridge-settings',
    }
  )
);
