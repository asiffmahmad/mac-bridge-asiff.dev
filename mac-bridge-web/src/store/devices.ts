import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DeviceInfo {
  id: string;
  name: string;
  pairedAt: number;
  lastSeen: number;
}

interface DevicesState {
  devices: DeviceInfo[];
  activeDeviceId: string | null;
  
  addDevice: (device: DeviceInfo) => void;
  removeDevice: (id: string) => void;
  setActiveDevice: (id: string) => void;
  updateDeviceLastSeen: (id: string, timestamp: number) => void;
}

export const useDevicesStore = create<DevicesState>()(
  persist(
    (set) => ({
      devices: [],
      activeDeviceId: null,
      
      addDevice: (device) => set((state) => ({
        devices: [...state.devices.filter(d => d.id !== device.id), device],
        activeDeviceId: device.id // auto-activate newly paired device
      })),
      
      removeDevice: (id) => set((state) => ({
        devices: state.devices.filter(d => d.id !== id),
        activeDeviceId: state.activeDeviceId === id ? 
          (state.devices.length > 1 ? state.devices.find(d => d.id !== id)?.id || null : null) 
          : state.activeDeviceId
      })),
      
      setActiveDevice: (id) => set({ activeDeviceId: id }),
      
      updateDeviceLastSeen: (id, timestamp) => set((state) => ({
        devices: state.devices.map(d => d.id === id ? { ...d, lastSeen: timestamp } : d)
      }))
    }),
    {
      name: 'mac-bridge-devices',
    }
  )
);
