import { useEffect, useRef, useState } from 'react';

type SovereignWebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSED' | 'ERROR';

// Singleton WebSocket Instance
let globalWs: WebSocket | null = null;
let reconnectTimer: number | null = null;
let activeListeners: Set<(data: any) => void> = new Set();
let isConnecting = false;

function connect(url: string) {
  if (globalWs || isConnecting) return;
  isConnecting = true;
  
  globalWs = new WebSocket(url);
  
  globalWs.onopen = () => {
    isConnecting = false;
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
    // Exponential backoff reconnect
    reconnectTimer = window.setTimeout(() => {
      connect(url);
    }, 5000); // 5s sabiti veya backoff eklenebilir
  };

  globalWs.onerror = () => {
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

    // Unmount anında listener'ı temizle (WS bağlantısını kapatma, singleton kalmalı)
    return () => {
      activeListeners.delete(messageListener);
    };
  }, [url]);

  return { status, latestMessage };
}
