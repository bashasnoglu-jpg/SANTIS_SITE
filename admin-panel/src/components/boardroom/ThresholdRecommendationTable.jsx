import React from 'react';

export default function ThresholdRecommendationTable({ rows }) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-2xs uppercase tracking-[0.24em] text-neutral-500">
        Threshold Recommendations
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.thresholdKey}
            className="grid grid-cols-5 gap-3 rounded-xl border border-white/5 bg-black/10 px-3 py-2 text-sm text-neutral-200"
          >
            <div className="col-span-2 font-semibold">{row.thresholdKey}</div>
            <div className="font-mono text-neutral-400">{row.currentValue} → {row.recommendedValue}</div>
            <div className={`font-bold tracking-wider text-2xs uppercase ${row.direction === 'increase' ? 'text-sky-400' : row.direction === 'decrease' ? 'text-rose-400' : 'text-neutral-500'}`}>{row.direction}</div>
            <div className="text-right text-emerald-400">{row.confidence * 100}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
