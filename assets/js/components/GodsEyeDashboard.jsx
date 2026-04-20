// components/GodsEyeDashboard.jsx — v4.0
// Event filtering + Health strip + Operator Ack + LIVE | REPLAY toggle

import React, { useState, useMemo } from 'react';
import { useRadarStream }  from '../hooks/useRadarStream';
import { useOperatorAck }  from '../hooks/useOperatorAck';
import AuditTimeline       from './AuditTimeline';
import '../../css/GodsEye.css';

// ─── Sabitler ────────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  connecting:   { color: '#888',    label: '◌ CONNECTING'   },
  live:         { color: '#00ffcc', label: '● LIVE'         },
  reconnecting: { color: '#ffcc00', label: '↺ RECONNECTING' },
  mock:         { color: '#ffcc00', label: '● MOCK'         },
  error:        { color: '#ff2a2a', label: '● ERROR'        },
  closed:       { color: '#ff2a2a', label: '○ CLOSED'       },
};

const FILTERS = ['ALL', 'THREAT_PULSE', 'DEGRADATION_WARN', 'ORBITAL_STREAM'];

function fmt(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('tr-TR', { hour12: false });
}

// ─── Operator Ack Butonları ───────────────────────────────────────────────────
function AckBar({ eventId, state, ack, mute, escalate, resolve, reset }) {
  const { incidentState } = state;
  const isResolved = incidentState === 'RESOLVED';

  return (
    <div className="ack-bar">
      {/* Lifecycle badge */}
      <span className={`lifecycle-badge lc-${incidentState?.toLowerCase()}`}>
        {incidentState ?? 'OPEN'}
      </span>

      {!isResolved && <>
        <button className={`ack-btn ack      ${state.acknowledged ? 'active' : ''}`}
          onClick={() => state.acknowledged ? reset(eventId) : ack(eventId)}>✓ ACK</button>
        <button className={`ack-btn mute     ${state.muted      ? 'active' : ''}`}
          onClick={() => state.muted      ? reset(eventId) : mute(eventId)}>⊘ MUTE</button>
        <button className={`ack-btn escalate ${state.escalated  ? 'active' : ''}`}
          onClick={() => escalate(eventId)}>↑ ESCALATE</button>
        <button className="ack-btn resolve"
          onClick={() => resolve(eventId)}>■ RESOLVE</button>
      </>}

      {isResolved && (
        <button className="ack-btn" onClick={() => reset(eventId)}>↺ REOPEN</button>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function GodsEyeDashboard() {
  const { threats, degradations, streams, status, retryCount } = useRadarStream();
  const { getState, ack, mute, escalate, resolve, reset } = useOperatorAck();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [viewMode,     setViewMode]     = useState('live'); // 'live' | 'replay'

  const badge = STATUS_BADGE[status] || STATUS_BADGE.connecting;
  const totalEvents = threats.length + degradations.length + streams.length;

  const lastPacketTs = useMemo(() => {
    const all = [
      ...threats.map(e => e.timestamp),
      ...degradations.map(e => e.timestamp),
      ...streams.map(e => e.timestamp),
    ];
    return all.length ? Math.max(...all) : null;
  }, [threats, degradations, streams]);

  const show = (type) => activeFilter === 'ALL' || activeFilter === type;

  // ESCALATE → üstte pinle
  const sortedThreats = useMemo(() =>
    [...threats].sort((a, b) => {
      const aEsc = getState(a.id).escalated ? 1 : 0;
      const bEsc = getState(b.id).escalated ? 1 : 0;
      return bEsc - aEsc;
    }), [threats, getState]);

  return (
    <div className="gods-eye-wrapper">

      {/* ── HEALTH STRIP ────────────────────────────────────────────────── */}
      <div className="health-strip">
        <span style={{ color: badge.color, fontWeight: 'bold' }}>
          {badge.label}
          {status === 'reconnecting' && retryCount > 0 && ` [${retryCount}/8]`}
        </span>
        <span className="health-meta">ws://localhost:8080 | role: watcher</span>
        <span className="health-meta">Last packet: {fmt(lastPacketTs)}</span>
        <span className="health-meta">Events: {totalEvents}</span>

        {/* LIVE / REPLAY toggle */}
        <div className="mode-toggle" style={{ marginLeft: 'auto' }}>
          <button
            className={`mode-btn ${viewMode === 'live' ? 'active' : ''}`}
            onClick={() => setViewMode('live')}
          >● LIVE</button>
          <button
            className={`mode-btn ${viewMode === 'replay' ? 'active' : ''}`}
            onClick={() => setViewMode('replay')}
          >▶ REPLAY</button>
        </div>
      </div>

      {/* ── REPLAY MODU ─────────────────────────────────────────────────── */}
      {viewMode === 'replay' && (
        <div style={{ gridColumn: '1 / -1' }}>
          <AuditTimeline />
        </div>
      )}

      {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
      <div className="filter-bar">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f === 'ALL' ? 'ALL EVENTS' : f.replace('_', ' ')}
            {f === 'THREAT_PULSE'     && threats.length      > 0 && <span className="badge red">{threats.length}</span>}
            {f === 'DEGRADATION_WARN' && degradations.length > 0 && <span className="badge yellow">{degradations.length}</span>}
            {f === 'ORBITAL_STREAM'   && streams.length      > 0 && <span className="badge cyan">{streams.length}</span>}
          </button>
        ))}
      </div>

      {/* ── SOL: Zayıflama Feed ─────────────────────────────────────────── */}
      {show('DEGRADATION_WARN') && (
        <div className="panel deg-panel">
          <h2 className="panel-title">[WARN] DEGRADATION FEED</h2>
          {degradations.length === 0
            ? <span className="empty-state">Monitoring sub-optimal protocols...</span>
            : degradations.map(deg => {
              const s = getState(deg.id);
              return (
                <div key={deg.id} className={`deg-card triage-card ${s.muted ? 'is-muted' : ''} ${s.acknowledged ? 'is-acked' : ''}`}>
                  <div><strong>VISITOR:</strong> {deg.client?.visitorId}</div>
                  <div><strong>DEVICE:</strong> {deg.client?.userAgent || '—'}</div>
                  <div className="ts">{fmt(deg.timestamp)}</div>
                  <div style={{ marginTop: '5px' }}>{deg.payload?.engineState} engaged.</div>
                  <AckBar eventId={deg.id} state={s} ack={ack} mute={mute} escalate={escalate} resolve={resolve} reset={reset} />
                </div>
              );
            })
          }
        </div>
      )}

      {/* ── ORTA: Orbital ───────────────────────────────────────────────── */}
      {show('ORBITAL_STREAM') && (
        <div className="panel orbital-panel">
          <h2 className="panel-title">[SYS] ORBITAL STREAM UPLINK</h2>
          {streams.length === 0
            ? <span className="empty-state">Awaiting payload injection...</span>
            : streams.map(stream => (
              <div key={stream.fileId} className="stream-card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>ID: {stream.visitorId} | {stream.fileId}</span>
                  <span>{stream.speed}</span>
                </div>
                <div className="stream-bar-bg">
                  <div className="stream-bar-fill" style={{ width: `${stream.percent}%` }} />
                </div>
                <div style={{ textAlign: 'right', marginTop: '5px', fontSize: '1.2rem', color: '#00ffcc' }}>
                  {stream.percent}%
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ── SAĞ: Tehdit Radarı ──────────────────────────────────────────── */}
      {show('THREAT_PULSE') && (
        <div className="panel threat-panel">
          <h2 className="panel-title">[!] THREAT RADAR</h2>
          {sortedThreats.length === 0
            ? <span className="empty-state">Zero-Trust Gate secure.</span>
            : sortedThreats.map(threat => {
              const s = getState(threat.id);
              return (
                <div
                  key={threat.id}
                  className={[
                    'threat-card triage-card',
                    s.escalated    ? 'is-escalated' : '',
                    s.muted        ? 'is-muted'     : '',
                    s.acknowledged ? 'is-acked'     : '',
                  ].filter(Boolean).join(' ')}
                >
                  {s.escalated && <div className="escalate-pin">↑ ESCALATED</div>}
                  <div><strong className="ip">HOST:</strong> {threat.client?.ip || '—'} [{threat.client?.visitorId}]</div>
                  <div style={{ margin: '5px 0' }}><strong>SPOOF:</strong> {threat.payload?.spoofedName}</div>
                  <div><strong>HEX:</strong> {threat.payload?.detectedHex} — {threat.payload?.action}</div>
                  <div className="ts">{fmt(threat.timestamp)}</div>
                  <AckBar eventId={threat.id} state={s} ack={ack} mute={mute} escalate={escalate} resolve={resolve} reset={reset} />
                </div>
              );
            })
          }
        </div>
      )}

    </div>
  );
}
