// components/AuditTimeline.jsx — v4.1
// Flat list + Session Grouping + date/search filter + Export (JSON, CSV, Report)
// Visual Truth Seal: raw hex → CSS class tokens

import React, { useState } from 'react';
import { useAuditReplay }    from '../hooks/useAuditReplay';
import { summarizeActions }  from '../lib/groupAuditEntries';
import { exportJSON, exportCSV, exportIncidentReport } from '../lib/exportAudit';
import '../../css/GodsEye.css';

// ─── Sabitler ────────────────────────────────────────────────────────────────
// color değerleri artık CSS class adına dönüştürüldü; raw hex kaldırıldı
const ACTION_STYLE = {
  ACK:      { cls: 'action-ack',      icon: '✓', label: 'ACK' },
  MUTE:     { cls: 'action-mute',     icon: '⊘', label: 'MUTE' },
  ESCALATE: { cls: 'action-escalate', icon: '↑', label: 'ESCALATE' },
};
const ACTION_FALLBACK_CLS = 'action-unknown';
const ACTION_FILTERS = ['ALL', 'ACK', 'MUTE', 'ESCALATE'];

function fmt(ts)     { return ts ? new Date(ts).toLocaleString('tr-TR',  { hour12: false }) : '—'; }
function fmtTime(ts) { return ts ? new Date(ts).toLocaleTimeString('tr-TR', { hour12: false }) : '—'; }

// ─── Düz liste satırı ────────────────────────────────────────────────────────
function FlatEntry({ entry }) {
  const s = ACTION_STYLE[entry.action] || { cls: ACTION_FALLBACK_CLS, icon: '?', label: '?' };
  const latency = entry.processedAt ? `+${entry.processedAt - entry.timestamp}ms` : null;
  return (
    <div className="audit-entry">
      <span className={`audit-icon ${s.cls}`}>{s.icon}</span>
      <div className="audit-body">
        <div>
          <span className={`${s.cls} font-bold`}>{entry.action}</span>
          <span className="audit-separator"> → </span>
          <span className="audit-evtid">#{(entry.targetEventId ?? '?').slice(-10)}</span>
        </div>
        <div className="audit-meta">
          {entry.operatorId ?? '—'} · {fmt(entry.timestamp)}
          {latency && <span className="audit-latency"> · {latency}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Gruplu incident kartı ───────────────────────────────────────────────────
function GroupCard({ group }) {
  const [open, setOpen] = useState(false);
  const primary = ACTION_STYLE[group.primaryState] || { cls: ACTION_FALLBACK_CLS, icon: '?', label: '?' };
  const summary = summarizeActions(group.actions);

  return (
    <div className={`incident-card incident-border-${primary.cls} ${open ? 'expanded' : ''}`}>

      {/* Kart başlığı — tıklanınca aç/kapat */}
      <button className="incident-header" onClick={() => setOpen(o => !o)}>
        <span className={`incident-state ${primary.cls}`}>
          {primary.icon} {primary.label}
        </span>
        <span className="incident-id">#{group.targetEventId.slice(-10)}</span>
        <span className="incident-badge">{group.totalActions} aksiyon</span>
        <div className="incident-summary">
          {Object.entries(summary).map(([action, count]) => {
            const st = ACTION_STYLE[action];
            return (
              <span key={action} className={st?.cls ?? ACTION_FALLBACK_CLS}>
                {action} ×{count}
              </span>
            );
          })}
        </div>
        <span className="incident-time">{fmtTime(group.lastSeenAt)}</span>
        <span className="incident-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {/* Zaman aralığı */}
      <div className="incident-range">
        {fmt(group.firstSeenAt)} → {fmt(group.lastSeenAt)}
        {' · '}op: {group.operators.join(', ')}
      </div>

      {/* Aksiyon geçmişi (açıksa) */}
      {open && (
        <div className="incident-actions">
          {group.actions.map((a, i) => {
            const as = ACTION_STYLE[a.action] || { cls: ACTION_FALLBACK_CLS, icon: '?' };
            return (
              <div key={i} className="incident-action-row">
                <span className={as.cls}>{as.icon} {a.action}</span>
                <span className="audit-meta">{a.operatorId} · {fmtTime(a.timestamp)}</span>
                {a.processedAt && (
                  <span className="audit-meta">+{a.processedAt - a.timestamp}ms</span>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

// ─── Ana component ───────────────────────────────────────────────────────────
export default function AuditTimeline() {
  const {
    totalCount, visibleCount, groupCount,
    loading, error, replaying,
    filter, setFilter,
    search, setSearch,
    dateFrom, setDateFrom,
    dateTo,   setDateTo,
    startReplay, stopReplay, resetReplay, refresh,
    visible, grouped,
    entries,
  } = useAuditReplay();

  const [viewMode, setViewMode] = useState('grouped'); // 'flat' | 'grouped'
  const hasFilter = filter !== 'ALL' || search || dateFrom || dateTo;

  return (
    <div className="audit-timeline">

      {/* ── Başlık + Kontroller ─────────────────────────────────────────── */}
      <div className="audit-header">
        <span className="audit-title">📋 OPERATOR AUDIT TIMELINE</span>
        <span className="audit-count">
          {hasFilter
            ? `${viewMode === 'grouped' ? groupCount + ' incident' : visibleCount + ' kayıt'} / ${totalCount} toplam`
            : `${totalCount} kayıt · ${groupCount} incident`}
        </span>
        <div className="audit-controls">
          {/* FLAT | GROUPED toggle */}
          <div className="mode-toggle">
            <button className={`mode-btn ${viewMode === 'flat'    ? 'active' : ''}`} onClick={() => setViewMode('flat')}>FLAT</button>
            <button className={`mode-btn ${viewMode === 'grouped' ? 'active' : ''}`} onClick={() => setViewMode('grouped')}>GROUPED</button>
          </div>

          {/* Export */}
          <div className="export-group">
            <button className="aud-btn export" onClick={() => exportJSON(entries)}           disabled={totalCount === 0} title="Ham JSON indir">⤓ JSON</button>
            <button className="aud-btn export" onClick={() => exportCSV(entries)}            disabled={totalCount === 0} title="CSV indir">⤓ CSV</button>
            <button className="aud-btn export primary" onClick={() => exportIncidentReport(grouped, entries)} disabled={groupCount === 0} title="Incident raporu indir">⤓ REPORT</button>
          </div>

          <button className="aud-btn" onClick={refresh}      disabled={replaying}>↺ REFRESH</button>
          <button className="aud-btn" onClick={resetReplay}                      >■ RESET</button>
          {replaying
            ? <button className="aud-btn danger"  onClick={stopReplay}>⏹ STOP</button>
            : <button className="aud-btn primary" onClick={startReplay} disabled={totalCount === 0}>▶ REPLAY</button>
          }
        </div>
      </div>

      {/* ── Search + Date ───────────────────────────────────────────────── */}
      <div className="audit-search-row">
        <input
          className="audit-search"
          type="text"
          placeholder="EventID, operatorId veya aksiyon ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input className="audit-date" type="datetime-local" title="Başlangıç"
          value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <span className="audit-date-sep">→</span>
        <input className="audit-date" type="datetime-local" title="Bitiş"
          value={dateTo} onChange={e => setDateTo(e.target.value)} />
        {hasFilter && (
          <button className="aud-btn" onClick={() => {
            setSearch(''); setFilter('ALL'); setDateFrom(''); setDateTo('');
          }}>✕ CLEAR</button>
        )}
      </div>

      {/* ── Aksiyon Filtresi ────────────────────────────────────────────── */}
      <div className="audit-filters">
        {ACTION_FILTERS.map(a => (
          <button key={a} className={`filter-btn ${filter === a ? 'active' : ''}`} onClick={() => setFilter(a)}>
            {a}
          </button>
        ))}
      </div>

      {/* ── İçerik ──────────────────────────────────────────────────────── */}
      {loading && <div className="audit-state">Yükleniyor...</div>}
      {error   && <div className="audit-state error">{error}</div>}
      {!loading && !error && visible.length === 0 && (
        <div className="audit-state">
          {totalCount === 0
            ? 'Henüz kayıt yok. Bir ACK/MUTE/ESCALATE işlemi gerçekleştir.'
            : hasFilter
            ? 'Filtreyle eşleşen kayıt bulunamadı.'
            : '▶ REPLAY butonuna bas, aksiyonlar kronolojik olarak akar.'}
        </div>
      )}

      <div className="audit-entries">
        {viewMode === 'flat'
          ? visible.map((e, i) => <FlatEntry key={`${e.targetEventId}-${i}`} entry={e} />)
          : grouped.map(g => <GroupCard key={g.targetEventId} group={g} />)
        }
      </div>

    </div>
  );
}
