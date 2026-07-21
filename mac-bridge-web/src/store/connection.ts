import { create } from 'zustand';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

interface ConnectionStore {
  state: ConnectionState;
  latency: number | null;
  lastHeartbeat: number | null;
  reconnectAttempts: number;
  
  setState: (state: ConnectionState) => void;
  setLatency: (latency: number) => void;
  recordHeartbeat: () => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  state: 'disconnected',
  latency: null,
  lastHeartbeat: null,
  reconnectAttempts: 0,
  
  setState: (state) => set({ state }),
  setLatency: (latency) => set({ latency }),
  recordHeartbeat: () => set({ lastHeartbeat: Date.now() }),
  incrementReconnectAttempts: () => set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
}));
