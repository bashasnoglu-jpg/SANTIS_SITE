import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SovereignEventHandler,
  SovereignEventName,
  SovereignEventPayloads,
} from '../types/socketEvents';

type SovereignWebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSED' | 'ERROR';

type SovereignSocketEnvelope<TPayload = unknown> = {
  eventName?: string;
  type?: string;
  payload?: TPayload;
  data?: TPayload;
};

type SovereignSocketHandler<TPayload = unknown> = (payload: TPayload, rawMessage: unknown) => void;
type SovereignSocketEventMap = Map<string, Set<SovereignSocketHandler>>;

// Singleton WebSocket Instance
let globalWs: WebSocket | null = null;
let reconnectTimer: number | null = null;
let activeListeners: Set<(data: unknown) => void> = new Set();
let statusListeners: Set<(status: SovereignWebSocketState) => void> = new Set();
let eventListeners: SovereignSocketEventMap = new Map();
let isConnecting = false;

function emitStatus(status: SovereignWebSocketState) {
  statusListeners.forEach((listener) => listener(status));
}

function resolveEventName(message: SovereignSocketEnvelope) {
  return message.eventName || message.type;
}

function resolvePayload(message: SovereignSocketEnvelope) {
  return message.payload ?? message.data ?? message;
}

function dispatchSocketMessage(message: unknown) {
  activeListeners.forEach((listener) => listener(message));

  if (!message || typeof message !== 'object') return;

  const envelope = message as SovereignSocketEnvelope;
  const eventName = resolveEventName(envelope);

  if (!eventName) return;

  const listeners = eventListeners.get(eventName);

  if (!listeners) return;

  const payload = resolvePayload(envelope);

  listeners.forEach((handler) => {
    handler(payload, message);
  });
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
  wsUrl.searchParams.set('token', data.token);

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

  const activeSocket = new WebSocket(authenticatedUrl);
  globalWs = activeSocket;

  activeSocket.onopen = () => {
    isConnecting = false;
    emitStatus('OPEN');

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  activeSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      dispatchSocketMessage(data);
    } catch (error) {
      console.warn('Failed to parse Sovereign WS message:', error);
    }
  };

  activeSocket.onclose = () => {
    if (globalWs === activeSocket) {
      globalWs = null;
    }

    isConnecting = false;
    emitStatus('CLOSED');

    reconnectTimer = window.setTimeout(() => {
      connect(url);
    }, 5000);
  };

  activeSocket.onerror = () => {
    emitStatus('ERROR');
    activeSocket.close();
  };
}

function sendSocketEnvelope<K extends SovereignEventName>(
  eventName: K,
  payload?: SovereignEventPayloads[K],
) {
  if (!globalWs || globalWs.readyState !== WebSocket.OPEN) {
    console.warn(`[Sovereign WS] Cannot emit "${eventName}" because socket is not open.`);
    return false;
  }

  globalWs.send(JSON.stringify({
    eventName,
    payload,
  }));

  return true;
}

function subscribeSocketEvent<K extends SovereignEventName>(
  eventName: K,
  handler: SovereignEventHandler<K>,
) {
  const typedHandler = handler as SovereignSocketHandler;
  const listeners = eventListeners.get(eventName) ?? new Set<SovereignSocketHandler>();

  listeners.add(typedHandler);
  eventListeners.set(eventName, listeners);

  return () => {
    const activeListenersForEvent = eventListeners.get(eventName);

    if (!activeListenersForEvent) return;

    activeListenersForEvent.delete(typedHandler);

    if (activeListenersForEvent.size === 0) {
      eventListeners.delete(eventName);
    }
  };
}

export function useSovereignWebSocket(url: string = 'ws://localhost:8080/ws') {
  const [status, setStatus] = useState<SovereignWebSocketState>('CLOSED');
  const [latestMessage, setLatestMessage] = useState<unknown>(null);

  useEffect(() => {
    connect(url);

    const messageListener = (data: unknown) => {
      setLatestMessage(data);
    };

    activeListeners.add(messageListener);
    statusListeners.add(setStatus);

    return () => {
      activeListeners.delete(messageListener);
      statusListeners.delete(setStatus);
    };
  }, [url]);

  const emitSocketEvent = useCallback(<K extends SovereignEventName>(
    eventName: K,
    payload?: SovereignEventPayloads[K],
  ) => {
    return sendSocketEnvelope(eventName, payload);
  }, []);

  const onSocketEvent = useCallback(<K extends SovereignEventName>(
    eventName: K,
    handler: SovereignEventHandler<K>,
  ) => {
    return subscribeSocketEvent(eventName, handler);
  }, []);

  return useMemo(() => ({
    status,
    latestMessage,
    emitSocketEvent,
    onSocketEvent,
  }), [status, latestMessage, emitSocketEvent, onSocketEvent]);
}
