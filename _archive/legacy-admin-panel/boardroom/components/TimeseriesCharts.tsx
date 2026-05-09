/**
 * boardroom/components/TimeseriesCharts.tsx
 * Boardroom V2.0 — Time-Series Charts (Zero-dependency SVG)
 *
 * 3 ayrı sparkline:
 *   - Denied Events / hour|day
 *   - Finalized Bytes / hour|day
 *   - Reaper Cleanups / hour|day
 *
 * 24h / 7d toggle ile çalışır.
 * External chart library yok — saf SVG path.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface Bucket { bucket: string; value: number }

interface TimeseriesData {
  window:    '24h' | '7d';
  bucket:    'hour' | 'day';
  denied:    Bucket[];
  finalized: Bucket[];
  reaper:    Bucket[];
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
function fmtBytes(b: number): string {
  if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(1)}GB`;
  if (b >= 1_048_576)     return `${(b / 1_048_576).toFixed(1)}MB`;
  if (b >= 1_024)         return `${(b / 1_024).toFixed(0)}KB`;
  return `${b}B`;
}

function fmtLabel(iso: string, bucket: 'hour' | 'day'): string {
  const d = new Date(iso);
  if (bucket === 'hour') return `${String(d.getUTCHours()).padStart(2,'0')}:00`;
  return `${d.getUTCDate()}/${d.getUTCMonth()+1}`;
}

// ─── Sparkline SVG ────────────────────────────────────────────────────────────
interface SparkProps {
  data:        Bucket[];
  overlay?:    Bucket[];          // ikincil çizgi (dashed)
  overlayColor?: string;
  overlayLabel?: string;
  bucket:      'hour' | 'day';
  color:       string;
  label:       string;
  valueLabel:  (v: number) => string;
  width?:      number;
  height?:     number;
}

function Sparkline({ data, overlay, overlayColor = '#6b7280', overlayLabel,
                     bucket, color, label, valueLabel, width = 360, height = 80 }: SparkProps) {
  const PAD = { top: 12, right: 8, bottom: 24, left: 44 };
  const W   = width  - PAD.left - PAD.right;
  const H   = height - PAD.top  - PAD.bottom;

  const max  = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  const peak = useMemo(() => data.reduce((a, b) => b.value > a.value ? b : a, { bucket: '', value: 0 }), [data]);

  // X / Y dönüşümü
  const xOf = useCallback((i: number) => data.length < 2
    ? W / 2
    : (i / (data.length - 1)) * W,
    [data.length, W]
  );
  const yOf = useCallback((v: number) => H - (v / max) * H, [max, H]);

  // SVG polyline points
  const points = useMemo(() =>
    data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.value).toFixed(1)}`).join(' '),
    [data, xOf, yOf]
  );

  // Area path (close to bottom)
  const areaPath = useMemo(() => {
    if (!data.length) return '';
    const line = data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.value).toFixed(1)}`).join(' L ');
    const last  = xOf(data.length - 1).toFixed(1);
    return `M 0,${H} L ${line} L ${last},${H} Z`;
  }, [data, xOf, yOf, H]);

  // X-axis labels — sadece ~5 tane göster
  const xLabels = useMemo(() => {
    if (!data.length) return [];
    const step = Math.max(1, Math.floor(data.length / 5));
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }, [data]);

  // Y-axis grid lines (3 adet)
  const yGrid = [0, 0.5, 1].map(r => ({ y: yOf(max * r), v: max * r }));

  const gradId = `grad-${label.replace(/\s/g,'-')}`;

  return (
    <div style={{
      background: '#121216', border: '1px solid #1e1e24', borderRadius: 6,
      padding: '12px 16px',
    }}>
      {/* Başlık + peak */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: '#4b5563' }}>{label}</div>
        <div style={{ fontSize: 11, color, fontFamily: 'monospace' }}>
          PEAK {valueLabel(peak.value)}
          {peak.bucket && (
            <span style={{ color: '#4b5563', marginLeft: 4 }}>
              @ {fmtLabel(peak.bucket, bucket)}
            </span>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ height: height, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#374151', fontSize: 12 }}>
          Veri yok
        </div>
      ) : (
        <svg
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {/* Y grid */}
            {yGrid.map(({ y, v }) => (
              <g key={v}>
                <line x1={0} x2={W} y1={y} y2={y}
                      stroke="#1e1e24" strokeWidth={1} />
                <text x={-6} y={y} fill="#374151" fontSize={9}
                      textAnchor="end" dominantBaseline="middle">
                  {valueLabel(Math.round(v))}
                </text>
              </g>
            ))}

            {/* Area fill */}
            <path d={areaPath} fill={`url(#${gradId})`} />

            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Peak dot */}
            {data.length > 0 && (
              <circle
                cx={xOf(data.indexOf(peak))}
                cy={yOf(peak.value)}
                r={3}
                fill={color}
              />
            )}

            {/* Overlay dashed line (reaper trendline vs.) */}
            {overlay && overlay.length > 1 && (() => {
              const ovMax   = Math.max(...overlay.map(d => d.value), 1);
              const xOvOf   = (i: number) => overlay.length < 2 ? W/2 : (i/(overlay.length-1))*W;
              const yOvOf   = (v: number) => H - (v / ovMax) * H;
              const ovPts   = overlay.map((d,i)=>`${xOvOf(i).toFixed(1)},${yOvOf(d.value).toFixed(1)}`).join(' ');
              return (
                <polyline
                  points={ovPts}
                  fill="none"
                  stroke={overlayColor}
                  strokeWidth={1}
                  strokeDasharray="3 2"
                  strokeLinejoin="round"
                  opacity={0.7}
                />
              );
            })()}

            {/* X labels */}
            {xLabels.map((d, i) => (
              <text
                key={d.bucket}
                x={xOf(data.indexOf(d))}
                y={H + 14}
                fill="#374151"
                fontSize={9}
                textAnchor="middle"
              >
                {fmtLabel(d.bucket, bucket)}
              </text>
            ))}
          </g>
        </svg>
      )}

      {/* Mini overlay legend */}
      {overlay && overlayLabel && (
        <div style={{ display:'flex', gap:12, marginTop:4, fontSize:9, color:'#4b5563' }}>
          <span style={{ color }}>━ {label.split(' ')[0]}</span>
          <span style={{ color: overlayColor }}>╌ {overlayLabel}</span>
        </div>
      )}
    </div>
  );
}

// ─── Hook: time-series fetch ───────────────────────────────────────────────────
function useTimeseries(win: '24h' | '7d') {
  const [data,    setData]    = useState<TimeseriesData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/v1/boardroom/timeseries?window=${win}`);
      if (r.ok) setData(await r.json());
    } catch (_) {}
    finally { setLoading(false); }
  }, [win]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  return { data, loading };
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────────
export function TimeseriesCharts() {
  const [win, setWin] = useState<'24h' | '7d'>('24h');
  const { data, loading } = useTimeseries(win);

  const denied    = data?.denied    ?? [];
  const finalized = data?.finalized ?? [];
  const reaper    = data?.reaper    ?? [];
  const bucket    = data?.bucket    ?? 'hour';

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#c6a96b22' : 'transparent',
    border: `1px solid ${active ? '#c6a96b' : '#2a2a30'}`,
    color:  active ? '#c6a96b' : '#6b7280',
    padding: '3px 12px', borderRadius: 4, fontSize: 11,
    cursor: 'pointer', fontFamily: 'monospace', letterSpacing: 1,
  });

  return (
    <div>
      {/* Header + toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: '#4b5563' }}>
          TELEMETRY TREND {loading ? '…' : ''}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['24h', '7d'] as const).map(w => (
            <button key={w} style={toggleStyle(win === w)} onClick={() => setWin(w)}>
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* 3 grafik — yan yana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <Sparkline
          data={denied}    bucket={bucket}
          color="#f87171" label="DENIED EVENTS"
          valueLabel={v => String(v)}
        />
        <Sparkline
          data={finalized} bucket={bucket}
          color="#c6a96b" label="FINALIZED BYTES"
          valueLabel={fmtBytes}
        />
        <Sparkline
          data={reaper}    bucket={bucket}
          color="#6b7280" label="REAPER CLEANUPS"
          valueLabel={v => String(v)}
          overlay={denied}
          overlayColor="#f8717155"
          overlayLabel="Denied (ref)"
        />
      </div>
    </div>
  );
}
