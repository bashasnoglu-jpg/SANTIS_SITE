import React from 'react';

export default function ThresholdRecommendationTable({ rows }) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4">
      <div className="mb-3 text-2xs uppercase tracking-widest text-sovereign-bronze">
        Threshold Recommendations
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.thresholdKey}
            className="grid grid-cols-5 gap-3 rounded-xl border border-sovereign-panel/50 bg-sovereign-coal/50 px-3 py-2 text-sm text-sovereign-ink"
          >
            <div className="col-span-2 font-semibold">{row.thresholdKey}</div>
            <div className="font-mono text-sovereign-sand">{row.currentValue} → {row.recommendedValue}</div>
            <div className={`font-bold tracking-wider text-2xs uppercase ${row.direction === 'increase' ? 'text-sovereign-accent' : row.direction === 'decrease' ? 'text-sovereign-danger' : 'text-sovereign-bronze'}`}>{row.direction}</div>
            <div className="text-right text-sovereign-success">{row.confidence * 100}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
