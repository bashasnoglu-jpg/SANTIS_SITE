/**
 * boardroom/components/BoardroomTelemetry.tsx
 * Boardroom Telemetry MVP — Sprint 4
 * 4 panel: Command Strip · Incident Feed · Integrity Rail · Quota Pressure
 *
 * Tasarım: dark operational, amber/gold, monospace data, Palantir-seviyesi yerleşim.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  useBoardroomSummary, useBoardroomIncidents,
  useBoardroomLiveFeed, useBoardroomQuota,
} from '../boardroom.telemetry.hooks.js';
import type { AuditEvent, Incident, QuotaPressureRow } from '../boardroom.telemetry.adapter.js';
import { IncidentDrawer }    from './IncidentDrawer.js';
import { IncidentFilters, applyFilters, type FilterState } from './IncidentFilters.js';
import { TimeseriesCharts }  from './TimeseriesCharts.js';
import { DenialHeatmap }     from './DenialHeatmap.js';
import { LatencyPanel }      from './LatencyPanel.js';
import { AnomalyBanner }     from './AnomalyBanner.js';

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
function fmtBytes(b: number): string {
  if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(2)} GB`;
  if (b >= 1_048_576)     return `${(b / 1_048_576).toFixed(1)} MB`;
  if (b >= 1_024)         return `${(b / 1_024).toFixed(0)} KB`;
  return `${b} B`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)       return `${Math.floor(diff / 1_000)}s ago`;
  if (diff < 3_600_000)    return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)   return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

const SEV_COLOR: Record<string, string> = {
  INFO:     '#4ade80',
  WARN:     '#f59e0b',
  ERROR:    '#f87171',
  CRITICAL: '#e11d48',
};

const EVT_LABEL: Record<string, string> = {
  UPLOAD_DENIED:            'DENIED',
  UPLOAD_FINALIZE_REJECTED: 'FIN·REJECT',
  UPLOAD_FINALIZED:         'FINALIZED',
  UPLOAD_ORPHAN_REAPED:     'ORPHAN·REAPED',
  REAPER_ERROR:             'REAPER·ERR',
  UPLOAD_GOVERNOR_ERROR:    'GOVERNOR·ERR',
};

// ─── Panel 1: Command Strip (4 kart) ─────────────────────────────────────────
function CommandStrip() {
  const { data, loading } = useBoardroomSummary();

  const cards = [
    {
      label: 'DENIED / 1H',
      value: loading ? '—' : String(data.deniedLastHour),
      color: data.deniedLastHour > 10 ? '#f87171' : '#f59e0b',
      icon:  '🚫',
    },
    {
      label: 'ACTIVE INCIDENTS',
      value: loading ? '—' : String(data.activeIncidents),
      color: data.activeIncidents > 0 ? '#f59e0b' : '#4ade80',
      icon:  '⚠️',
    },
    {
      label: 'FINALIZED / DAY',
      value: loading ? '—' : fmtBytes(data.finalizedBytesToday),
      color: '#c6a96b',
      icon:  '✅',
    },
    {
      label: 'REAPER / 24H',
      value: loading ? '—' : String(data.reaperCleanupsDay),
      color: data.reaperCleanupsDay > 5 ? '#f59e0b' : '#9ca3af',
      icon:  '☠️',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {cards.map(card => (
        <div key={card.label} style={{
          background: '#1a1a1e', border: '1px solid #2a2a30',
          borderRadius: 6, padding: '16px 20px',
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#6b7280', marginBottom: 8 }}>
            {card.icon} {card.label}
          </div>
          <div style={{ fontSize: 28, fontFamily: 'monospace', color: card.color, fontWeight: 700 }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Panel 2: Incident Feed ───────────────────────────────────────────────────
function IncidentFeed() {
  const { events } = useBoardroomLiveFeed(80);

  return (
    <div style={{ background: '#1a1a1e', border: '1px solid #2a2a30', borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2a30',
                    fontSize: 11, letterSpacing: 2, color: '#6b7280' }}>
        LIVE EVENT FEED
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {events.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#4b5563', fontSize: 13 }}>
            Olay bekleniyor…
          </div>
        )}
        {events.map((ev: AuditEvent) => (
          <div key={ev.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 16px', borderBottom: '1px solid #111116',
            fontSize: 12, fontFamily: 'monospace',
          }}>
            <span style={{ color: SEV_COLOR[ev.severity] ?? '#9ca3af', minWidth: 8,
                           fontSize: 8, lineHeight: 1 }}>●</span>
            <span style={{ color: '#c6a96b', minWidth: 120 }}>
              {EVT_LABEL[ev.event_type] ?? ev.event_type}
            </span>
            <span style={{ color: '#9ca3af', flex: 1, overflow: 'hidden',
                           textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ev.subject ?? '—'}
            </span>
            <span style={{ color: '#4b5563', minWidth: 60, textAlign: 'right' }}>
              {timeAgo(ev.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Panel 3: Active Incidents (filtre + drawer) ──────────────────────────────
function ActiveIncidents() {
  const [filters, setFilters] = useState<FilterState>({
    tenant: '', severity: '', status: 'OPEN', search: '',
  });
  const [selected, setSelected]   = useState<Incident | null>(null);
  const [refreshKey, setRefresh]   = useState(0);

  const incidents = useBoardroomIncidents(filters.status === 'ALL' ? 'OPEN' : filters.status);

  const tenants = useMemo(() =>
    [...new Set(incidents.data.map(i => i.tenant_id).filter(Boolean))] as string[],
    [incidents.data]
  );

  const filtered = useMemo(() =>
    applyFilters(incidents.data, filters),
    [incidents.data, filters]
  );

  const handleTransition = useCallback(async (incidentKey: string, action: string) => {
    await fetch(`/api/v1/boardroom/incidents/${encodeURIComponent(incidentKey)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, operatorId: 'boardroom-op' }),
    }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); });
    setRefresh(k => k + 1);   // hook yeniden çalışır
    setSelected(null);
  }, []);

  return (
    <>
      <div style={{ background: '#1a1a1e', border: '1px solid #2a2a30', borderRadius: 6 }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2a30',
                      fontSize: 11, letterSpacing: 2, color: '#6b7280' }}>
          INCIDENTS ({filtered.length})
        </div>

        <IncidentFilters filters={filters} tenants={tenants} onChange={setFilters} />

        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#4ade80', fontSize: 13 }}>
              ✓ Eşleşen incident yok
            </div>
          )}
          {filtered.map((inc: Incident) => (
            <div
              key={inc.incident_key}
              onClick={() => setSelected(inc)}
              style={{
                padding: '10px 16px', borderBottom: '1px solid #111116',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1e1e26')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <div style={{ fontSize: 12, color: '#f59e0b', fontFamily: 'monospace' }}>
                  {inc.incident_type}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {inc.subject ?? inc.tenant_id ?? '—'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, color: '#f87171', fontFamily: 'monospace', fontWeight: 700 }}>
                  ×{inc.occurrence_count}
                </div>
                <div style={{ fontSize: 10, color: '#4b5563' }}>
                  {inc.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <IncidentDrawer
        incident={selected}
        operatorId="boardroom-op"
        onClose={() => setSelected(null)}
        onTransition={handleTransition}
      />
    </>
  );
}

// ─── Panel 4: Quota Pressure ──────────────────────────────────────────────────
function QuotaPressure() {
  const { data } = useBoardroomQuota();

  function Section({ title, rows, valueKey, valueLabel }: {
    title: string;
    rows: QuotaPressureRow[];
    valueKey: keyof QuotaPressureRow;
    valueLabel: (v: number) => string;
  }) {
    return (
      <div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: '#4b5563', marginBottom: 8 }}>
          {title}
        </div>
        {rows.slice(0, 5).map((row, i) => {
          const val = row[valueKey] as number ?? 0;
          return (
            <div key={row.subject ?? i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '4px 0', borderBottom: '1px solid #111116',
              fontSize: 11, fontFamily: 'monospace',
            }}>
              <span style={{ color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis',
                             whiteSpace: 'nowrap', maxWidth: 160 }}>
                {row.subject ?? '—'}
              </span>
              <span style={{ color: '#c6a96b' }}>{valueLabel(val)}</span>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div style={{ fontSize: 11, color: '#374151', padding: '4px 0' }}>Veri yok</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: '#1a1a1e', border: '1px solid #2a2a30', borderRadius: 6, padding: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: '#6b7280', marginBottom: 16 }}>
        QUOTA PRESSURE / 24H
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <Section title="TOP DENIED" rows={data.topDenied}
                 valueKey="deny_count"  valueLabel={v => `${v}×`} />
        <Section title="TOP BYTES"  rows={data.topBytes}
                 valueKey="total_bytes" valueLabel={v => fmtBytes(v)} />
        <Section title="TOP ORPHAN" rows={data.topOrphans}
                 valueKey="orphan_count" valueLabel={v => `${v}×`} />
      </div>
    </div>
  );
}

// ─── Ana Panel: BoardroomTelemetry ───────────────────────────────────────────
export default function BoardroomTelemetry() {
  return (
    <div style={{
      background: '#0d0d10', minHeight: '100vh', color: '#e5e7eb',
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      padding: 24, boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#4b5563' }}>SOVEREIGN OS</div>
          <div style={{ fontSize: 18, color: '#c6a96b', letterSpacing: 1 }}>BOARDROOM TELEMETRY</div>
        </div>
        <div style={{ fontSize: 11, color: '#374151', fontFamily: 'monospace' }}>
          {new Date().toLocaleTimeString('tr-TR')} UTC
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <AnomalyBanner />
        <CommandStrip />
        <LatencyPanel />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <IncidentFeed />
          <ActiveIncidents />
        </div>
        <TimeseriesCharts />
        <DenialHeatmap />
        <QuotaPressure />
      </div>
    </div>
  );
}
