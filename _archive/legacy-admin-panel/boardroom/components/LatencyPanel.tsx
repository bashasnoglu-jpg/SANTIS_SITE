/**
 * boardroom/components/LatencyPanel.tsx
 * Boardroom V2.2 — Finalize Latency Histogram + p50/p95/p99
 *
 * Üst satır: p50 · p95 · p99 · avg → 4 kart (renk giderek kızarır)
 * Alt kısım: SVG bar histogram (5 bucket) + phase breakdown table
 */

import React, { useState, useEffect, useCallback } from 'react';

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface HistBucket { label: string; count: number }
interface Breakdown  { storageHeadMs: number | null; hashComputeMs: number | null; dbCommitMs: number | null }
interface LatencyData {
  range:     string;
  count:     number;
  p50:       number | null;
  p95:       number | null;
  p99:       number | null;
  avg:       number | null;
  histogram: HistBucket[];
  breakdown: Breakdown | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
function useLatency(range: '24h' | '7d') {
  const [data,    setData]    = useState<LatencyData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/v1/boardroom/latency?range=${range}`);
      if (r.ok) setData(await r.json());
    } catch (_) {}
    finally   { setLoading(false); }
  }, [range]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  return { data, loading };
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
function fmtMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms >= 1_000) return `${(ms/1_000).toFixed(2)}s`;
  return `${ms}ms`;
}

// p99 > 2s → kırmızı, > 500ms → turuncu, normal → altın
function pctColor(ms: number | null, tier: 'p50'|'p95'|'p99'): string {
  if (ms === null) return '#4b5563';
  if (tier === 'p99' && ms > 2_000) return '#f87171';
  if (tier === 'p99' && ms > 500)   return '#f59e0b';
  if (tier === 'p95' && ms > 1_000) return '#f87171';
  if (tier === 'p95' && ms > 350)   return '#f59e0b';
  return '#c6a96b';
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export function LatencyPanel() {
  const [range, setRange] = useState<'24h' | '7d'>('24h');
  const { data, loading } = useLatency(range);

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#c6a96b22' : 'transparent',
    border:     `1px solid ${active ? '#c6a96b' : '#2a2a30'}`,
    color:      active ? '#c6a96b' : '#6b7280',
    padding: '3px 10px', borderRadius: 4, fontSize: 10,
    cursor: 'pointer', fontFamily: 'monospace', letterSpacing: 1,
  });

  return (
    <div style={{ background: '#121216', border: '1px solid #1e1e24',
                  borderRadius: 6, padding: '12px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: '#4b5563' }}>
            FINALIZE LATENCY
          </div>
          {data?.count != null && (
            <div style={{ fontSize: 10, color: '#374151', marginTop: 2 }}>
              {loading ? '…' : `${data.count} ölçüm`}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['24h','7d'] as const).map(r => (
            <button key={r} style={toggleStyle(range===r)} onClick={()=>setRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      {(!data || data.count === 0) ? (
        <div style={{ color: '#374151', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
          {loading ? 'Yükleniyor…' : 'Henüz finalize ölçümü yok.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Percentile kartları */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {([
              { key: 'p50' as const, label: 'P50 (median)' },
              { key: 'p95' as const, label: 'P95' },
              { key: 'p99' as const, label: 'P99 (tail)' },
              { key: 'avg' as const, label: 'AVG' },
            ]).map(({ key, label }) => {
              const val   = data[key];
              const color = key === 'avg' ? '#6b7280' : pctColor(val, key as any);
              return (
                <div key={key} style={{
                  background: '#1a1a1e', border: '1px solid #2a2a30',
                  borderRadius: 4, padding: '10px 12px',
                }}>
                  <div style={{ fontSize: 9, letterSpacing: 1, color: '#4b5563', marginBottom: 6 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 22, fontFamily: 'monospace', color, fontWeight: 700 }}>
                    {fmtMs(val)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Histogram bar chart */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#374151', marginBottom: 8 }}>
              DAĞILIM
            </div>
            <HistogramBars buckets={data.histogram} />
          </div>

          {/* Phase breakdown */}
          {data.breakdown && (
            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#374151', marginBottom: 8 }}>
                PHASE BREAKDOWN (ort.)
              </div>
              <div style={{ display: 'flex', gap: 0 }}>
                {[
                  { label: 'Storage HEAD', ms: data.breakdown.storageHeadMs, color: '#6b7280' },
                  { label: 'Hash SHA-256', ms: data.breakdown.hashComputeMs, color: '#c6a96b' },
                  { label: 'DB Commit',    ms: data.breakdown.dbCommitMs,    color: '#4ade80' },
                ].map((phase, i) => (
                  <div key={phase.label} style={{
                    flex: 1, padding: '8px 10px',
                    borderLeft: i > 0 ? '1px solid #1e1e24' : 'none',
                    fontSize: 11,
                  }}>
                    <div style={{ color: '#4b5563', fontSize: 9, marginBottom: 4 }}>{phase.label}</div>
                    <div style={{ color: phase.color, fontFamily: 'monospace', fontWeight: 600 }}>
                      {fmtMs(phase.ms)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Histogram bars (SVG) ─────────────────────────────────────────────────────
function HistogramBars({ buckets }: { buckets: HistBucket[] }) {
  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  const W = 500, H = 60;
  const barW   = Math.floor(W / buckets.length) - 4;
  const padL   = 28;

  // Renk gradient sola → sağa sertleşiyor
  const COLORS = ['#4ade8066', '#c6a96b88', '#f59e0b99', '#f87171aa', '#f87171'];

  return (
    <svg width="100%" viewBox={`0 0 ${W + padL} ${H + 20}`}
         style={{ display:'block', overflow:'visible' }}>

      {/* Y grid */}
      {[0, 0.5, 1].map(r => {
        const y = H - r * H;
        return (
          <g key={r}>
            <line x1={padL} x2={W + padL} y1={y} y2={y}
                  stroke="#1e1e24" strokeWidth={1} />
            <text x={padL-4} y={y} fill="#374151" fontSize={8}
                  textAnchor="end" dominantBaseline="middle">
              {Math.round(maxCount * r)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {buckets.map((b, i) => {
        const barH  = (b.count / maxCount) * H;
        const x     = padL + i * (barW + 4);
        const y     = H - barH;
        return (
          <g key={b.label}>
            <rect x={x} y={y} width={barW} height={barH}
                  fill={COLORS[i] ?? '#4b5563'} rx={2} />
            {b.count > 0 && (
              <text x={x + barW/2} y={y - 3} fill="#9ca3af"
                    fontSize={8} textAnchor="middle">
                {b.count}
              </text>
            )}
            <text x={x + barW/2} y={H + 12} fill="#374151"
                  fontSize={8} textAnchor="middle">
              {b.label.replace('–','‑')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
