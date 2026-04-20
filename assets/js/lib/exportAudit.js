// lib/exportAudit.js
// Audit export fonksiyonları: JSON · CSV · Incident Report
// Saf fonksiyonlar — React bağımlılığı yok, test edilebilir.

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// ─── JSON Export ─────────────────────────────────────────────────────────────
/**
 * Ham audit kayıtlarını tek bir JSON dosyası olarak indirir.
 * @param {Array} entries - Düz audit kayıtları
 */
export function exportJSON(entries) {
  const payload = {
    exportedAt:  new Date().toISOString(),
    totalCount:  entries.length,
    entries,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `santis-audit-${timestamp()}.json`);
}

// ─── CSV Export ──────────────────────────────────────────────────────────────
/**
 * Audit kayıtlarını CSV dosyası olarak indirir.
 * @param {Array} entries - Düz audit kayıtları
 */
export function exportCSV(entries) {
  const HEADERS = ['action', 'targetEventId', 'operatorId', 'operatorRole', 'source', 'timestamp', 'processedAt', 'latencyMs'];

  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows = [
    HEADERS.join(','),
    ...entries.map(e => [
      escape(e.action),
      escape(e.targetEventId),
      escape(e.operatorId),
      escape(e.operatorRole),
      escape(e.source),
      escape(e.timestamp   ? new Date(e.timestamp).toISOString()    : ''),
      escape(e.processedAt ? new Date(e.processedAt).toISOString()  : ''),
      escape(e.processedAt && e.timestamp ? e.processedAt - e.timestamp : ''),
    ].join(',')),
  ];

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `santis-audit-${timestamp()}.csv`);
}

// ─── Incident Report Export ───────────────────────────────────────────────────
/**
 * Gruplu incident raporunu JSON olarak indirir.
 * Yönetici özeti: kim, ne zaman, kaç aksiyon, ne kadar sürdü.
 * @param {Array}  grouped - groupAuditEntries() çıktısı
 * @param {Array}  entries - Ham kayıtlar (meta için)
 */
export function exportIncidentReport(grouped, entries) {
  const incidents = grouped.map(g => ({
    targetEventId: g.targetEventId,
    primaryState:  g.primaryState,
    totalActions:  g.totalActions,
    operators:     g.operators,
    firstSeenAt:   g.firstSeenAt ? new Date(g.firstSeenAt).toISOString() : null,
    lastSeenAt:    g.lastSeenAt  ? new Date(g.lastSeenAt).toISOString()  : null,
    durationMs:    g.firstSeenAt && g.lastSeenAt
      ? g.lastSeenAt - g.firstSeenAt
      : 0,
    actionSummary: g.actions.reduce((acc, a) => {
      acc[a.action] = (acc[a.action] ?? 0) + 1;
      return acc;
    }, {}),
    timeline: g.actions.map(a => ({
      action:     a.action,
      operatorId: a.operatorId,
      at:         a.timestamp ? new Date(a.timestamp).toISOString() : null,
      latencyMs:  a.processedAt && a.timestamp ? a.processedAt - a.timestamp : null,
    })),
  }));

  const report = {
    reportTitle:      'Santis God\'s Eye — Incident Report',
    generatedAt:      new Date().toISOString(),
    totalAuditEvents: entries.length,
    totalIncidents:   grouped.length,
    escalatedCount:   grouped.filter(g => g.primaryState === 'ESCALATE').length,
    mutedCount:       grouped.filter(g => g.primaryState === 'MUTE').length,
    ackedCount:       grouped.filter(g => g.primaryState === 'ACK').length,
    incidents,
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `santis-incident-report-${timestamp()}.json`);
}
