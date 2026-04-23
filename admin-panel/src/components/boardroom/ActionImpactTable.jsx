import React from 'react';

export default function ActionImpactTable({ rows }) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-2xs uppercase tracking-[0.24em] text-neutral-500">
        Action Impact
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.actionType}
            className="grid grid-cols-3 gap-3 rounded-xl border border-white/5 bg-black/10 px-3 py-2 text-sm text-neutral-200"
          >
            <div className="font-semibold text-emerald-300">{row.actionType}</div>
            <div className="text-right">{row.outcomes} Outcomes</div>
            <div className="text-right font-mono font-bold text-neutral-100">€{row.revenue}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
