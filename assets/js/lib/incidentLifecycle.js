// lib/incidentLifecycle.js
// Incident yaşam döngüsü state machine.
// Aksiyon (verbe) ile durum (noun) birbirinden ayrı modellenir.
//
// ACTIONS (operatör ne yaptı): ACK | MUTE | ESCALATE | RESOLVE
// STATES  (incident nerede):   OPEN | ACKED | MUTED | ESCALATED | RESOLVED
//
// Kural: Aksiyon → yeni durum geçişi deterministik ve açık olmalı.

// ─── Durum tanımları ──────────────────────────────────────────────────────────
export const INCIDENT_STATES = {
  OPEN:      { label: 'OPEN',      color: '#888',    priority: 1 },
  ACKED:     { label: 'ACKED',     color: '#10b981', priority: 2 },
  MUTED:     { label: 'MUTED',     color: '#555',    priority: 3 },
  ESCALATED: { label: 'ESCALATED', color: '#ff2a2a', priority: 4 },
  RESOLVED:  { label: 'RESOLVED',  color: '#2d5a3d', priority: 5 },
};

// ─── Geçiş tablosu ───────────────────────────────────────────────────────────
// [mevcut durum] → aksiyon → [yeni durum]
// null = geçiş yok (kural ihlali)
const TRANSITIONS = {
  //                ACK        MUTE       ESCALATE   RESOLVE
  OPEN:      { ACK: 'ACKED', MUTE: 'MUTED', ESCALATE: 'ESCALATED', RESOLVE: null      },
  ACKED:     { ACK: 'ACKED', MUTE: 'MUTED', ESCALATE: 'ESCALATED', RESOLVE: 'RESOLVED' },
  MUTED:     { ACK: 'ACKED', MUTE: 'MUTED', ESCALATE: 'ESCALATED', RESOLVE: 'RESOLVED' },
  ESCALATED: { ACK: 'ACKED', MUTE: 'MUTED', ESCALATE: 'ESCALATED', RESOLVE: 'RESOLVED' },
  RESOLVED:  { ACK: null,    MUTE: null,    ESCALATE: 'ESCALATED',  RESOLVE: 'RESOLVED' },
};

// ─── State Machine ────────────────────────────────────────────────────────────

/**
 * Bir aksiyonu mevcut duruma uygular ve yeni durumu döndürür.
 * @param {string} currentState - Mevcut incident durumu (INCIDENT_STATES keylerinden biri)
 * @param {string} action       - Operatör aksiyonu (ACK | MUTE | ESCALATE | RESOLVE)
 * @returns {{ newState: string, allowed: boolean, reason?: string }}
 */
export function applyAction(currentState, action) {
  const validStates  = Object.keys(INCIDENT_STATES);
  const validActions = ['ACK', 'MUTE', 'ESCALATE', 'RESOLVE'];

  if (!validStates.includes(currentState)) {
    return { newState: currentState, allowed: false, reason: `Bilinmeyen durum: ${currentState}` };
  }
  if (!validActions.includes(action)) {
    return { newState: currentState, allowed: false, reason: `Bilinmeyen aksiyon: ${action}` };
  }

  const newState = TRANSITIONS[currentState][action];

  if (newState === null) {
    return {
      newState: currentState,
      allowed:  false,
      reason:   `${action} aksiyonu ${currentState} durumunda uygulanamaz`,
    };
  }

  return { newState, allowed: true };
}

/**
 * Aksiyon listesinden incident'in mevcut durumunu yeniden hesaplar.
 * Replay veya grouping sonrası kullanım için.
 * @param {Array<{ action: string }>} actions - Kronolojik aksiyon listesi
 * @returns {string} - Son geçerli durum
 */
export function deriveState(actions = []) {
  let state = 'OPEN';
  for (const a of actions) {
    const { newState, allowed } = applyAction(state, a.action);
    if (allowed) state = newState;
  }
  return state;
}

/**
 * Bir incident grubunun baskın görsel durumunu döndürür.
 * groupAuditEntries() ile birlikte kullanılır.
 * @param {string} primaryState - ESCALATE > MUTE > ACK mantığından gelen ham durum
 * @returns {{ label, color }}
 */
export function getStateStyle(primaryState) {
  // primaryState, aksiyon adı olabilir (ACK, MUTE, ESCALATE)
  // veya durum adı olabilir (ACKED, MUTED, ESCALATED)
  const actionToState = { ACK: 'ACKED', MUTE: 'MUTED', ESCALATE: 'ESCALATED', RESOLVE: 'RESOLVED' };
  const normalized    = actionToState[primaryState] ?? primaryState ?? 'OPEN';
  return INCIDENT_STATES[normalized] ?? INCIDENT_STATES.OPEN;
}
