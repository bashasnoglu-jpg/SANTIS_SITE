import React from 'react';

export default function ActionImpactTable({ rows }) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4">
      <div className="mb-3 text-2xs uppercase tracking-widest text-sovereign-bronze">
        Action Impact
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.actionType}
            className="grid grid-cols-3 gap-3 rounded-xl border border-sovereign-panel/50 bg-sovereign-coal/50 px-3 py-2 text-sm text-sovereign-ink"
          >
            <div className="font-semibold text-sovereign-success">{row.actionType}</div>
            <div className="text-right">{row.outcomes} Outcomes</div>
            <div className="text-right font-mono font-bold text-sovereign-ink">€{row.revenue}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
