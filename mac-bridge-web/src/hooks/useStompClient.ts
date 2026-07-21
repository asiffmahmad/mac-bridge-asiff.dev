import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '@/store/auth';
import { useSettingsStore } from '@/store/settings';

export function useStompClient() {
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const token = useAuthStore(state => state.token);
  const bridgeUrl = useSettingsStore(state => state.bridgeUrl);

  useEffect(() => {
    if (!token) return;

    // Convert http(s):// to ws(s):// for native WebSocket
    const wsUrl = bridgeUrl.replace(/^http/, 'ws') + '/ws/websocket';

    const stompClient = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = function () {
      setConnected(true);
    };

    stompClient.onStompError = function (frame) {
      console.error('STOMP error:', frame.headers['message']);
    };

    stompClient.onWebSocketClose = () => {
      setConnected(false);
    };

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
    };
  }, [token, bridgeUrl]);

  return { client, connected };
}
