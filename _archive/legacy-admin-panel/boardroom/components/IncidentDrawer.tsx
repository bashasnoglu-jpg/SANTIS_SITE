/**
 * boardroom/components/IncidentDrawer.tsx
 * Incident detail drawer — V1.1
 *
 * Tasarım: sağ panelde slide-in, tam detay + lifecycle aksiyonları
 * State machine: incidentLifecycle.js applyAction → izin verilen butonlar otomatik hesaplanır
 */

import React, { useState, useCallback } from 'react';
import type { Incident } from '../boardroom.telemetry.adapter.js';

// ─── Tip ──────────────────────────────────────────────────────────────────────
interface DrawerProps {
  incident: Incident | null;
  operatorId: string;
  onClose: () => void;
  onTransition: (incidentKey: string, action: string) => Promise<void>;
}

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const STATE_COLOR: Record<string, string> = {
  OPEN:      '#f59e0b',
  ACKED:     '#10b981',
  MUTED:     '#6b7280',
  ESCALATED: '#f87171',
  RESOLVED:  '#2d5a3d',
};

// mevcut durumdan izin verilen aksiyonlar (TRANSITIONS tablosunu yansıtır)
const ALLOWED_ACTIONS: Record<string, string[]> = {
  OPEN:      ['ACK', 'MUTE', 'ESCALATE'],
  ACKED:     ['MUTE', 'ESCALATE', 'RESOLVE'],
  MUTED:     ['ACK', 'ESCALATE', 'RESOLVE'],
  ESCALATED: ['ACK', 'MUTE', 'RESOLVE'],
  RESOLVED:  ['ESCALATE'],  // sadece ESCALATE re-open edebilir
};

const ACTION_LABEL: Record<string, string> = {
  ACK:      '✓ Acknowledge',
  MUTE:     '🔇 Mute',
  ESCALATE: '🔺 Escalate',
  RESOLVE:  '✅ Resolve',
};

const ACTION_COLOR: Record<string, string> = {
  ACK:      '#10b981',
  MUTE:     '#6b7280',
  ESCALATE: '#f87171',
  RESOLVE:  '#2d5a3d',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function tryParsePayload(raw: string | null): string {
  if (!raw) return '—';
  try { return JSON.stringify(JSON.parse(raw), null, 2); }
  catch { return raw; }
}

// ─── Drawer Bileşeni ──────────────────────────────────────────────────────────
export function IncidentDrawer({ incident, operatorId, onClose, onTransition }: DrawerProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAction = useCallback(async (action: string) => {
    if (!incident || loading) return;
    setLoading(true);
    setFeedback(null);
    try {
      await onTransition(incident.incident_key, action);
      setFeedback(`✓ ${action} uygulandı`);
    } catch (e: any) {
      setFeedback(`✗ Hata: ${e?.message ?? 'bilinmiyor'}`);
    } finally {
      setLoading(false);
    }
  }, [incident, loading, onTransition]);

  if (!incident) return null;

  const allowedActions = ALLOWED_ACTIONS[incident.status] ?? [];
  const stateColor     = STATE_COLOR[incident.status] ?? '#9ca3af';

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 100, cursor: 'pointer',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
        background: '#121216', borderLeft: '1px solid #2a2a30',
        zIndex: 101, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1e1e24',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#4b5563', marginBottom: 4 }}>
              INCIDENT DETAIL
            </div>
            <div style={{ fontSize: 14, color: '#c6a96b', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {incident.incident_type}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6b7280',
                     fontSize: 20, cursor: 'pointer', padding: '0 4px' }}
          >
            ×
          </button>
        </div>

        {/* Status badge */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e1e24' }}>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 4,
            background: stateColor + '22', color: stateColor,
            fontSize: 11, fontFamily: 'monospace', letterSpacing: 1,
          }}>
            {incident.status}
          </span>
          <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 12 }}>
            ×{incident.occurrence_count} · Last: {fmtDate(incident.last_seen_at)}
          </span>
        </div>

        {/* Meta */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e24' }}>
          {[
            ['Subject',    incident.subject    ?? '—'],
            ['Tenant',     incident.tenant_id  ?? '—'],
            ['First Seen', fmtDate(incident.first_seen_at)],
            ['Last Seen',  fmtDate(incident.last_seen_at)],
            ['Count',      String(incident.occurrence_count)],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: '#4b5563', minWidth: 90 }}>{label}</span>
              <span style={{ color: '#e5e7eb', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Last payload */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e24', flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#4b5563', marginBottom: 8 }}>
            LAST PAYLOAD
          </div>
          <pre style={{
            background: '#0d0d10', border: '1px solid #1e1e24', borderRadius: 4,
            padding: 12, fontSize: 11, color: '#9ca3af', overflowX: 'auto',
            margin: 0, maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {tryParsePayload(incident.last_payload_json)}
          </pre>
        </div>

        {/* Lifecycle aksiyonları */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e1e24' }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#4b5563', marginBottom: 12 }}>
            OPERATOR ACTIONS · {operatorId}
          </div>

          {feedback && (
            <div style={{
              fontSize: 12, color: feedback.startsWith('✓') ? '#10b981' : '#f87171',
              marginBottom: 10, fontFamily: 'monospace',
            }}>
              {feedback}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {allowedActions.map(action => (
              <button
                key={action}
                disabled={loading}
                onClick={() => handleAction(action)}
                style={{
                  background: ACTION_COLOR[action] + '18',
                  border: `1px solid ${ACTION_COLOR[action]}44`,
                  color: ACTION_COLOR[action],
                  padding: '7px 14px', borderRadius: 4,
                  fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace', letterSpacing: 0.5, opacity: loading ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {ACTION_LABEL[action]}
              </button>
            ))}
            {allowedActions.length === 0 && (
              <span style={{ fontSize: 12, color: '#374151' }}>Bu durumda aksiyon yok</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
