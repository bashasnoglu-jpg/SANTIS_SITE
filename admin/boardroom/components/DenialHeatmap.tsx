/**
 * boardroom/components/DenialHeatmap.tsx
 * Boardroom V2.1 — Denial Heatmap (Zero-dep CSS Grid)
 *
 * X: saat / gün bucket
 * Y: tenant
 * Hücre rengi: 5 yoğunluk seviyesi (0 → boş, 4 → tam kırmızı)
 * Tooltip: count + topReason + bytes
 * "unknown" tenant satırı sarı aksan ile ayrı vurgulanır
 */

import React, { useState, useEffect, useCallback } from 'react';

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface HeatCell {
  tenantId:       string;
  bucket:         string;
  denyCount:      number;
  requestedBytes: number;
  topReason:      string | null;
}

interface HeatmapData {
  range:   '24h' | '7d';
  buckets: string[];
  tenants: string[];
  cells:   HeatCell[];
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
function fmtBucketLabel(iso: string, range: '24h' | '7d'): string {
  const d = new Date(iso);
  if (range === '24h') return `${String(d.getUTCHours()).padStart(2,'0')}h`;
  return `${d.getUTCDate()}/${d.getUTCMonth()+1}`;
}

function fmtBytes(b: number): string {
  if (b >= 1_048_576) return `${(b/1_048_576).toFixed(1)}MB`;
  if (b >= 1_024)     return `${(b/1_024).toFixed(0)}KB`;
  return `${b}B`;
}

// 5 yoğunluk seviyesi — 0 baskı → tam baskı
const INTENSITY_LEVELS = [
  { threshold: 0,  bg: '#1e1e26',  border: '#1e1e26' },  // boş
  { threshold: 1,  bg: '#7f1d1d22', border: '#7f1d1d44' }, // çok hafif
  { threshold: 3,  bg: '#f8717140', border: '#f8717166' }, // hafif
  { threshold: 6,  bg: '#f87171aa', border: '#f87171cc' }, // orta
  { threshold: 11, bg: '#f87171',   border: '#ff4444'   }, // yüksek
];

function intensityFor(count: number) {
  let level = INTENSITY_LEVELS[0];
  for (const l of INTENSITY_LEVELS) {
    if (count >= l.threshold) level = l;
  }
  return level;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
function useDenialHeatmap(range: '24h' | '7d') {
  const [data,    setData]    = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/v1/boardroom/denial-heatmap?range=${range}`);
      if (r.ok) setData(await r.json());
    } catch (_) {}
    finally   { setLoading(false); }
  }, [range]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  return { data, loading };
}

// ─── Tooltip state ────────────────────────────────────────────────────────────
interface TooltipState {
  cell: HeatCell;
  x:    number;
  y:    number;
}

// ─── Heatmap Bileşeni ─────────────────────────────────────────────────────────
export function DenialHeatmap() {
  const [range, setRange]     = useState<'24h' | '7d'>('24h');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const { data, loading }     = useDenialHeatmap(range);

  if (!data || (data.buckets.length === 0 && !loading)) {
    return (
      <div style={{ background: '#121216', border: '1px solid #1e1e24',
                    borderRadius: 6, padding: '20px 16px' }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#4b5563', marginBottom: 12 }}>
          DENIAL HEATMAP
        </div>
        <div style={{ color: '#374151', fontSize: 13, textAlign: 'center', padding: 24 }}>
          {loading ? 'Yükleniyor…' : 'Veri yok — henüz ret olayı kaydedilmemiş.'}
        </div>
      </div>
    );
  }

  const { buckets, tenants, cells } = data;

  // Cell lookup map
  const cellMap = new Map<string, HeatCell>();
  for (const c of cells) cellMap.set(`${c.tenantId}:${c.bucket}`, c);

  // Max count (renk normalizasyonu için)
  const maxCount = Math.max(...cells.map(c => c.denyCount), 1);

  // Grid boyutları
  const CELL_W    = Math.max(24, Math.min(48, Math.floor(900 / Math.max(buckets.length, 1))));
  const CELL_H    = 28;
  const LABEL_W   = 120;
  const HEADER_H  = 32;

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#f8717122' : 'transparent',
    border:     `1px solid ${active ? '#f87171' : '#2a2a30'}`,
    color:      active ? '#f87171' : '#6b7280',
    padding: '3px 10px', borderRadius: 4, fontSize: 10,
    cursor: 'pointer', fontFamily: 'monospace', letterSpacing: 1,
  });

  return (
    <div style={{ background: '#121216', border: '1px solid #1e1e24',
                  borderRadius: 6, padding: '12px 16px', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#4b5563' }}>
          DENIAL HEATMAP — {cells.reduce((s,c)=>s+c.denyCount,0)} total ret
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['24h','7d'] as const).map(r => (
            <button key={r} style={toggleStyle(range===r)} onClick={()=>setRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      {/* Grid wrapper */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: LABEL_W + buckets.length * CELL_W }}>

          {/* X-axis header */}
          <div style={{ display: 'flex', marginLeft: LABEL_W, marginBottom: 2 }}>
            {buckets.map(b => (
              <div key={b} style={{
                width: CELL_W, flexShrink: 0,
                fontSize: 8, color: '#374151', textAlign: 'center',
                fontFamily: 'monospace', letterSpacing: 0,
              }}>
                {fmtBucketLabel(b, range)}
              </div>
            ))}
          </div>

          {/* Tenant rows */}
          {tenants.map(tenant => {
            const isUnknown = tenant === 'unknown';
            return (
              <div key={tenant} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                {/* Y-label */}
                <div style={{
                  width: LABEL_W, flexShrink: 0, flexGrow: 0,
                  fontSize: 10, fontFamily: 'monospace',
                  color: isUnknown ? '#f59e0b' : '#6b7280',
                  paddingRight: 8, textAlign: 'right',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {isUnknown ? '⚠ unknown' : tenant}
                </div>

                {/* Hücreler */}
                {buckets.map(bucket => {
                  const cell = cellMap.get(`${tenant}:${bucket}`);
                  const count = cell?.denyCount ?? 0;
                  const lvl   = intensityFor(count);

                  return (
                    <div
                      key={bucket}
                      style={{
                        width: CELL_W - 2, height: CELL_H,
                        margin: '0 1px', borderRadius: 2, flexShrink: 0,
                        background: lvl.bg, border: `1px solid ${lvl.border}`,
                        cursor: count > 0 ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: count > 5 ? '#fff' : '#9ca3af',
                        fontFamily: 'monospace', transition: 'opacity 0.1s',
                      }}
                      onMouseEnter={e => {
                        if (!cell) return;
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setTooltip({ cell, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Yoğunluk lejandı */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10 }}>
        <span style={{ fontSize: 9, color: '#374151', marginRight: 4 }}>Az</span>
        {INTENSITY_LEVELS.map((l, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: 2,
            background: l.bg, border: `1px solid ${l.border}`,
          }} />
        ))}
        <span style={{ fontSize: 9, color: '#374151', marginLeft: 4 }}>Çok</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 8, top: tooltip.y - 80,
          background: '#0d0d10', border: '1px solid #2a2a30', borderRadius: 4,
          padding: '8px 12px', zIndex: 200,
          fontSize: 11, fontFamily: 'monospace', color: '#e5e7eb',
          pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
          minWidth: 160,
        }}>
          <div style={{ color: '#f87171', marginBottom: 4, fontWeight: 600 }}>
            {tooltip.cell.denyCount} ret
          </div>
          <div style={{ color: '#9ca3af' }}>
            {tooltip.cell.tenantId}<br/>
            {fmtBucketLabel(tooltip.cell.bucket, range)}<br/>
            {tooltip.cell.topReason && (
              <span style={{ color: '#f59e0b' }}>{tooltip.cell.topReason}</span>
            )}<br/>
            {fmtBytes(tooltip.cell.requestedBytes)} talep edildi
          </div>
        </div>
      )}
    </div>
  );
}
