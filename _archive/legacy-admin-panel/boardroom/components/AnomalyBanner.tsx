/**
 * boardroom/components/AnomalyBanner.tsx
 * V2.3 — Anomaly Detection Banner
 *
 * CommandStrip'in üstünde çalışır.
 * Aktif anomali yoksa tamamen gizlenir (zero height).
 * 1–3 anomali gösterir, severity sıralı, 30s polling.
 */

import React, { useState, useEffect, useCallback } from 'react';

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface Anomaly {
  key:        string;
  type:       string;
  severity:   'warning' | 'critical';
  title:      string;
  summary:    string;
  tenantId?:  string;
  detectedAt: string;
  metrics:    Record<string, number | null>;
}

// ─── Sabitler ─────────────────────────────────────────────────────────────────
const TYPE_ICON: Record<string, string> = {
  DENY_SPIKE:       '🚫',
  ORPHAN_SURGE:     '☠️',
  P95_REGRESSION:   '⏱',
  P99_REGRESSION:   '🔴',
};

const SEV_PALETTE = {
  critical: { bg: '#1a0505', border: '#f87171', accent: '#f87171', badge: '#f8717133' },
  warning:  { bg: '#1a1205', border: '#f59e0b', accent: '#f59e0b', badge: '#f59e0b33' },
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1_000);
  if (s < 60)    return `${s}s önce`;
  if (s < 3600)  return `${Math.floor(s/60)}dk önce`;
  return `${Math.floor(s/3600)}s önce`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
function useAnomalies() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [lastCheck, setLastCheck] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/v1/boardroom/anomalies');
      if (r.ok) {
        const d = await r.json();
        setAnomalies(d.anomalies ?? []);
        setLastCheck(new Date().toLocaleTimeString('tr-TR'));
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  return { anomalies, lastCheck };
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────────
export function AnomalyBanner() {
  const { anomalies, lastCheck } = useAnomalies();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Yeni anomali gelince dismiss sıfırla
  const visible = anomalies.filter(a => !dismissed.has(a.key)).slice(0, 3);

  // Aktif anomali yoksa zero-height gizle
  if (visible.length === 0) return null;

  const hasCritical = visible.some(a => a.severity === 'critical');

  return (
    <div style={{
      borderRadius: 6,
      border: `1px solid ${hasCritical ? '#f87171' : '#f59e0b'}`,
      background: hasCritical ? '#1a050588' : '#1a120588',
      overflow: 'hidden',
      animation: hasCritical ? 'anomaly-pulse 2s ease-in-out infinite' : 'none',
    }}>
      {/* Banner header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 14px',
        background: hasCritical ? '#f8717112' : '#f59e0b12',
        borderBottom: `1px solid ${hasCritical ? '#f8717122' : '#f59e0b22'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontFamily: 'monospace', letterSpacing: 2,
            color: hasCritical ? '#f87171' : '#f59e0b',
          }}>
            {hasCritical ? '⚠ CRITICAL ANOMALY DETECTED' : '⚠ ANOMALY DETECTED'}
          </span>
          <span style={{
            fontSize: 9, background: hasCritical ? '#f8717122' : '#f59e0b22',
            color: hasCritical ? '#f87171' : '#f59e0b',
            padding: '1px 6px', borderRadius: 10,
          }}>
            {visible.length} aktif
          </span>
        </div>
        <span style={{ fontSize: 9, color: '#374151' }}>son kontrol: {lastCheck}</span>
      </div>

      {/* Anomaly rows */}
      {visible.map((anomaly, i) => {
        const pal = SEV_PALETTE[anomaly.severity];
        return (
          <div
            key={anomaly.key}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 14px',
              borderBottom: i < visible.length - 1 ? '1px solid #1e1e24' : 'none',
            }}
          >
            {/* Icon + type badge */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 16 }}>{TYPE_ICON[anomaly.type] ?? '⚠'}</span>
              <span style={{
                fontSize: 8, padding: '1px 5px', borderRadius: 3,
                background: pal.badge, color: pal.accent,
                fontFamily: 'monospace', letterSpacing: 0.5,
              }}>
                {anomaly.severity.toUpperCase()}
              </span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'baseline', marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: pal.accent, fontWeight: 600 }}>
                  {anomaly.title}
                </span>
                <span style={{ fontSize: 9, color: '#374151', flexShrink: 0, marginLeft: 8 }}>
                  {timeAgo(anomaly.detectedAt)}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>
                {anomaly.summary}
              </div>

              {/* Metrics pills */}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {Object.entries(anomaly.metrics)
                  .filter(([, v]) => v !== null)
                  .map(([k, v]) => (
                    <span key={k} style={{
                      fontSize: 9, fontFamily: 'monospace',
                      background: '#1e1e24', border: '1px solid #2a2a30',
                      color: '#6b7280', padding: '1px 6px', borderRadius: 3,
                    }}>
                      {k}: {typeof v === 'number' && !Number.isInteger(v)
                        ? v.toFixed(1) : v}
                    </span>
                  ))}
              </div>
            </div>

            {/* Dismiss × */}
            <button
              onClick={() => setDismissed(prev => new Set([...prev, anomaly.key]))}
              style={{
                background: 'none', border: 'none', color: '#374151',
                cursor: 'pointer', fontSize: 16, padding: '0 2px',
                flexShrink: 0,
              }}
              title="Kapat (sadece bu oturum için)"
            >
              ×
            </button>
          </div>
        );
      })}

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes anomaly-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
          50%       { box-shadow: 0 0 8px 2px rgba(248,113,113,0.15); }
        }
      `}</style>
    </div>
  );
}
