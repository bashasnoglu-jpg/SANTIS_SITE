// hooks/useOperatorAck.js — v2.0
// Operator triage state + gerçek identity + incident lifecycle

import { useCallback, useRef, useState } from 'react';
import { getIdentityBundle }              from '../lib/operatorIdentity';
import { applyAction }                    from '../lib/incidentLifecycle';

const WS_URL = 'ws://localhost:8080/?role=watcher&token=SANTIS-CORE-TX99';

// ─── Başlangıç incident durumu ────────────────────────────────────────────────
const defaultEntry = () => ({
  incidentState:  'OPEN',   // Lifecycle durumu
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

    const identity = getIdentityBundle(); // Gerçek kimlik paketi

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
        return prev; // State değişmez
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

  // ── Public API ────────────────────────────────────────────────────────────
  const ack      = useCallback((id) => apply(id, { acknowledged: true, muted: false },  'ACK'),      [apply]);
  const mute     = useCallback((id) => apply(id, { muted: true, acknowledged: false }, 'MUTE'),     [apply]);
  const escalate = useCallback((id) => apply(id, { escalated: true },                  'ESCALATE'), [apply]);
  const resolve  = useCallback((id) => apply(id, { resolved: true, muted: false, escalated: false }, 'RESOLVE'), [apply]);

  const reset = useCallback((eventId) =>
    setTriage(prev => { const n = { ...prev }; delete n[eventId]; return n; }), []);

  const getState = useCallback((eventId) =>
    triage[eventId] || defaultEntry(), [triage]);

  return { getState, ack, mute, escalate, resolve, reset };
}
