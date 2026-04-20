// lib/groupAuditEntries.js
// Audit kayıtlarını targetEventId bazında gruplar.
// Saf fonksiyon — React bağımlılığı yok, test edilebilir.

// Durum önceliği: ESCALATE > MUTE > ACK
const PRIORITY = { ESCALATE: 3, MUTE: 2, ACK: 1 };

/**
 * @param {Array} entries - Düz audit kayıtları (timestamp sıralı)
 * @returns {Array} - Aggregate incident grupları (lastSeenAt'a göre azalan)
 */
export function groupAuditEntries(entries) {
  const map = new Map(); // targetEventId → group

  for (const entry of entries) {
    const id = entry.targetEventId ?? 'UNKNOWN';

    if (!map.has(id)) {
      map.set(id, {
        targetEventId: id,
        totalActions:  0,
        primaryState:  null,
        firstSeenAt:   entry.timestamp,
        lastSeenAt:    entry.timestamp,
        operators:     [],
        actions:       [],
      });
    }

    const group = map.get(id);

    group.totalActions += 1;
    group.lastSeenAt    = Math.max(group.lastSeenAt, entry.timestamp ?? 0);
    group.firstSeenAt   = Math.min(group.firstSeenAt, entry.timestamp ?? Infinity);
    group.actions.push({
      action:     entry.action,
      operatorId: entry.operatorId ?? 'unknown',
      timestamp:  entry.timestamp,
      processedAt: entry.processedAt,
    });

    // Operatör listesini unique tut
    if (entry.operatorId && !group.operators.includes(entry.operatorId)) {
      group.operators.push(entry.operatorId);
    }

    // Baskın durum: ESCALATE > MUTE > ACK
    const currentPriority = PRIORITY[group.primaryState] ?? 0;
    const newPriority     = PRIORITY[entry.action]       ?? 0;
    if (newPriority > currentPriority) {
      group.primaryState = entry.action;
    }
  }

  // Aksiyon listelerini kronolojik sırala
  for (const group of map.values()) {
    group.actions.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Grupları son aktiviteye göre azalan sırala (en güncel üstte)
  return [...map.values()].sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

/** Aksiyonları özetle: { ACK: 2, MUTE: 1, ESCALATE: 1 } */
export function summarizeActions(actions) {
  return actions.reduce((acc, a) => {
    acc[a.action] = (acc[a.action] ?? 0) + 1;
    return acc;
  }, {});
}
