import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '@/store/settings';
import { useDiscoveryStore } from '@/store/discovery';
import { useAuthStore } from '@/store/auth';

export type ConnectionStatus = 'online' | 'offline' | 'reconnecting' | 'discovering';

const NTFY_BASE = 'https://ntfy.sh';
const HEARTBEAT_INTERVAL = 15_000;   // 15s health check
const RECONNECT_DELAY   = 5_000;    // 5s between retries
const MAX_RECONNECT_TRIES = 20;

/**
 * Global connection manager hook.
 * - Pings the backend every 15s.
 * - On failure, tries to discover a new URL via ntfy.sh if a bridgeId is stored.
 * - Updates the bridgeUrl in settings transparently.
 * - Returns the current connection status.
 */
export function useConnectionManager(): ConnectionStatus {
  const { bridgeUrl, setBridgeUrl } = useSettingsStore();
  const { bridgeId, setDiscoveryStatus, setLastDiscoveredUrl } = useDiscoveryStore();
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<ConnectionStatus>('online');

  const failCountRef = useRef(0);
  const discoveredUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ping = useCallback(async (): Promise<boolean> => {
    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const res = await fetch(`${bridgeUrl}/api/health`, {
        signal: ctrl.signal,
        cache: 'no-store',
      });
      return res.ok;
    } catch {
      return false;
    }
  }, [bridgeUrl]);

  /** Query ntfy.sh for the latest published Cloudflare URL. */
  const discoverNewUrl = useCallback(async (): Promise<string | null> => {
    if (!bridgeId) return null;
    try {
      setDiscoveryStatus('discovering');
      const res = await fetch(`${NTFY_BASE}/${bridgeId}/json?poll=1&since=1h`, {
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const text = await res.text();
      const lines = text.trim().split('\n').reverse(); // newest first
      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          const url: string = msg.message || '';
          if (url.startsWith('https://') && url.includes('trycloudflare.com')) {
            setDiscoveryStatus('found');
            setLastDiscoveredUrl(url);
            return url;
          }
        } catch { /* skip malformed lines */ }
      }
    } catch {
      setDiscoveryStatus('failed');
    }
    return null;
  }, [bridgeId, setDiscoveryStatus, setLastDiscoveredUrl]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let timer: ReturnType<typeof setTimeout>;

    const check = async () => {
      const ok = await ping();

      if (ok) {
        if (status !== 'online') setStatus('online');
        failCountRef.current = 0;
        discoveredUrlRef.current = null;
        setDiscoveryStatus('idle');
      } else {
        failCountRef.current += 1;

        if (failCountRef.current === 1) {
          setStatus('offline');
        }

        if (failCountRef.current <= MAX_RECONNECT_TRIES) {
          setStatus('reconnecting');
          // Try discovery every 3rd failure
          if (failCountRef.current % 3 === 0 && bridgeId) {
            setStatus('discovering');
            const newUrl = await discoverNewUrl();
            if (newUrl && newUrl !== bridgeUrl) {
              setBridgeUrl(newUrl);
              discoveredUrlRef.current = newUrl;
              // Reset fail count to give new URL a chance
              failCountRef.current = 0;
            }
          }
        }
      }

      timer = setTimeout(check, ok ? HEARTBEAT_INTERVAL : RECONNECT_DELAY);
    };

    // Start after 3s initial delay (let app render first)
    timer = setTimeout(check, 3000);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, bridgeUrl, bridgeId]);

  return status;
}
