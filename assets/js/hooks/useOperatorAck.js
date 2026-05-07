// hooks/useOperatorAck.js — v3.0
// [SEC-02] Hardcoded WS token kaldırıldı.
// WS bağlantısı kurulmadan hemen önce /api/v1/auth/ws-token'dan short-lived token alınır.
// Operator triage state + gerçek identity + incident lifecycle

import { useCallback, useRef, useState } from 'react';
import { getIdentityBundle }              from '../lib/operatorIdentity';
import { applyAction }                    from '../lib/incidentLifecycle';

// ─── WS Host Resolver ─────────────────────────────────────────────────────────
// window.__WS_BASE__ set edilmişse onu kullan, yoksa same-origin WS.
function _resolveWsBase() {
  if (typeof window !== 'undefined' && window.__WS_BASE__) {
    return window.__WS_BASE__.replace(/\/$/, '');
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}

// ─── Short-lived token fetcher ────────────────────────────────────────────────
// Mevcut oturum token'ını (localStorage veya window.__SESSION_TOKEN__) sunucuya
// göndererek 5 dk TTL'li bir WS token alır.
// [SEC-02] SANTIS-CORE-TX99 static token'ının yerine geçer.
async function fetchWsToken() {
  const sessionToken =
    (typeof window !== 'undefined' && window.__SESSION_TOKEN__) ||
    localStorage.getItem('santis_session_token');

  if (!sessionToken) {
    throw new Error('[useOperatorAck] Session token bulunamadı. Lütfen tekrar giriş yapın.');
  }

  const apiBase = (typeof window !== 'undefined' && window.__API_BASE__)
    ? window.__API_BASE__.replace(/\/$/, '')
    : '/api/v1';

  const res = await fetch(`${apiBase}/auth/ws-token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sessionToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`[useOperatorAck] WS token alınamadı: ${res.status}`);
  }

  const { token } = await res.json();
  return token;
}

// ─── Başlangıç incident durumu ────────────────────────────────────────────────
const defaultEntry = () => ({
  incidentState:  'OPEN',
  acknowledged:   false,
  muted:          false,
  escalated:      false,
  resolved:       false,
  operatorAction: null,
  operatorId:     null,
  actionTs:       null,
});

export function useOperatorAck(wsRef = null) {
  const [triage, setTriage] = useState({});

  // ── Gateway'e OPERATOR_ACTION gönder ────────────────────────────────────
  const sendAction = useCallback((action, targetEventId) => {
    const socket = wsRef?.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const identity = getIdentityBundle();

    socket.send(JSON.stringify({
      type:          'OPERATOR_ACTION',
      action,
      targetEventId,
      operatorId:    identity.operatorId,
      operatorName:  identity.operatorName,
      operatorRole:  identity.role,
      sessionId:     identity.sessionId,
      source:        'gods-eye-ui',
      timestamp:     Date.now(),
    }));
  }, [wsRef]);

  // ── State güncelle + lifecycle geçişi + gateway'e bildir ────────────────
  const apply = useCallback((eventId, uiPatch, action) => {
    setTriage(prev => {
      const current  = prev[eventId] || defaultEntry();
      const { newState, allowed } = applyAction(current.incidentState, action);

      if (!allowed) {
        console.warn(`[ACK] Geçersiz geçiş: ${current.incidentState} + ${action}`);
        return prev;
      }

      const identity = getIdentityBundle();

      return {
        ...prev,
        [eventId]: {
          ...current,
          ...uiPatch,
          incidentState:  newState,
          operatorAction: action,
          operatorId:     identity.operatorId,
          actionTs:       Date.now(),
        },
      };
    });

    sendAction(action, eventId);
  }, [sendAction]);

  // ── WS bağlantısı kur (short-lived token ile) ────────────────────────────
  // Bu fonksiyonu dışarıdan çağırarak yeni bir WS bağlantısı başlatabilirsin.
  // wsRef.current'ı güncelleme sorumluluğu çağırana aittir.
  const connectWithFreshToken = useCallback(async (onMessage, onError) => {
    let token;
    try {
      token = await fetchWsToken();
    } catch (err) {
      console.error('[useOperatorAck] Token alınamadı:', err);
      onError?.(err);
      return null;
    }

    const wsBase = _resolveWsBase();
    const url    = `${wsBase}/?role=watcher&token=${encodeURIComponent(token)}`;
    const ws     = new WebSocket(url);

    ws.onmessage = (event) => onMessage?.(event);
    ws.onerror   = (err)   => {
      console.error('[useOperatorAck] WS hatası:', err);
      onError?.(err);
    };

    return ws;
  }, []);

  // ── Public API ────────────────────────────────────────────────────────────
  const ack      = useCallback((id) => apply(id, { acknowledged: true, muted: false },  'ACK'),      [apply]);
  const mute     = useCallback((id) => apply(id, { muted: true, acknowledged: false }, 'MUTE'),     [apply]);
  const escalate = useCallback((id) => apply(id, { escalated: true },                  'ESCALATE'), [apply]);
  const resolve  = useCallback((id) => apply(id, { resolved: true, muted: false, escalated: false }, 'RESOLVE'), [apply]);

  const reset = useCallback((eventId) =>
    setTriage(prev => { const n = { ...prev }; delete n[eventId]; return n; }), []);

  const getState = useCallback((eventId) =>
    triage[eventId] || defaultEntry(), [triage]);

  return { getState, ack, mute, escalate, resolve, reset, connectWithFreshToken };
}

