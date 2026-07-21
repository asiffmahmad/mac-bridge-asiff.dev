import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '@/store/auth';
import { useSettingsStore } from '@/store/settings';
import { useConnectionStore } from '@/store/connection';

export function useStompClient() {
  const [client, setClient] = useState<Client | null>(null);
  const token = useAuthStore(state => state.token);
  const bridgeUrl = useSettingsStore(state => state.bridgeUrl);
  const { setState, recordHeartbeat, incrementReconnectAttempts, resetReconnectAttempts } = useConnectionStore();

  useEffect(() => {
    if (!token) {
      setState('disconnected');
      return;
    }

    setState('connecting');

    // Convert http(s):// to ws(s):// for native WebSocket
    const wsUrl = bridgeUrl.replace(/^http/, 'ws') + '/ws/websocket';

    const stompClient = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onChangeState: (state) => {
        // We can hook into internal state changes if needed
      }
    });

    stompClient.onConnect = function () {
      setState('connected');
      resetReconnectAttempts();
      recordHeartbeat();
    };

    stompClient.onStompError = function (frame) {
      console.error('STOMP error:', frame.headers['message']);
      setState('failed');
    };

    stompClient.onWebSocketClose = () => {
      setState('reconnecting');
      incrementReconnectAttempts();
    };
    
    // Custom WebSocket factory to allow manual heartbeat observation if needed
    // The library handles standard ping/pong automatically via heartbeatIncoming/Outgoing

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
      setState('disconnected');
    };
  }, [token, bridgeUrl, setState, recordHeartbeat, incrementReconnectAttempts, resetReconnectAttempts]);

  return { client };
}
