import { useEffect, useRef, useState } from 'react';

type SovereignWebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSED' | 'ERROR';

// Singleton WebSocket Instance
let globalWs: WebSocket | null = null;
let reconnectTimer: number | null = null;
let activeListeners: Set<(data: any) => void> = new Set();
let statusListeners: Set<(status: SovereignWebSocketState) => void> = new Set();
let isConnecting = false;

function emitStatus(status: SovereignWebSocketState) {
  statusListeners.forEach(listener => listener(status));
}

async function resolveAuthenticatedUrl(url: string) {
  const wsUrl = new URL(url, window.location.href);
  const requiresSessionToken =
    wsUrl.pathname === '/ws' &&
    (wsUrl.port === '8080' || wsUrl.host === window.location.host);

  if (!requiresSessionToken || wsUrl.searchParams.has('token')) {
    return wsUrl.toString();
  }

  const response = await fetch('/api/v1/auth/session', {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Session token request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data?.token) {
    throw new Error('Session token response did not include token');
  }

  wsUrl.searchParams.set('client_type', wsUrl.searchParams.get('client_type') || 'admin-panel');
  const token = data.token || window.SANTIS_WS_TOKEN || localStorage.getItem("SANTIS_WS_TOKEN") || "santis-dev-token";
  wsUrl.searchParams.set('token', token);
  return wsUrl.toString();
}

async function connect(url: string) {
  if (globalWs || isConnecting) return;
  isConnecting = true;
  emitStatus('CONNECTING');

  let authenticatedUrl: string;
  try {
    authenticatedUrl = await resolveAuthenticatedUrl(url);
  } catch (error) {
    console.warn('Failed to prepare Sovereign WS connection:', error);
    isConnecting = false;
    emitStatus('ERROR');
    reconnectTimer = window.setTimeout(() => {
      connect(url);
    }, 5000);
    return;
  }

  globalWs = new WebSocket(authenticatedUrl);
  
  globalWs.onopen = () => {
    isConnecting = false;
    emitStatus('OPEN');
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  globalWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      activeListeners.forEach(listener => listener(data));
    } catch (e) {
      console.warn("Failed to parse Sovereign WS message:", e);
    }
  };

  globalWs.onclose = () => {
    globalWs = null;
    isConnecting = false;
    emitStatus('CLOSED');
    // Exponential backoff reconnect
    reconnectTimer = window.setTimeout(() => {
      connect(url);
    }, 5000); // 5s sabiti veya backoff eklenebilir
  };

  globalWs.onerror = () => {
    emitStatus('ERROR');
    if (globalWs) {
      globalWs.close();
    }
  };
}

export function useSovereignWebSocket(url: string = 'ws://localhost:8080/ws') {
  const [status, setStatus] = useState<SovereignWebSocketState>('CLOSED');
  const [latestMessage, setLatestMessage] = useState<any>(null);

  useEffect(() => {
    // Component mount olduğunda global bağlantıyı tetikle (zaten varsa bir şey yapmaz)
    connect(url);

    // Kendi listener'ımızı set'e ekle
    const messageListener = (data: any) => {
      setLatestMessage(data);
    };
    activeListeners.add(messageListener);
    statusListeners.add(setStatus);

    // Unmount anında listener'ı temizle (WS bağlantısını kapatma, singleton kalmalı)
    return () => {
      activeListeners.delete(messageListener);
      statusListeners.delete(setStatus);
    };
  }, [url]);

  return { status, latestMessage };
}
