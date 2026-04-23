import React from 'react';

export default function DegradedImpactTiles({
  degradedRate,
  latestDecisionMode,
  latestFunnelMode,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-2xs uppercase tracking-[0.24em] text-neutral-500">
        Degraded Impact
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Tile label="Degraded Rate" value={degradedRate != null ? `${degradedRate * 100}%` : '—'} />
        <Tile label="Decision Mode" value={latestDecisionMode} />
        <Tile label="Funnel Mode" value={latestFunnelMode} />
      </div>
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/10 px-3 py-3">
      <div className="mb-1 text-2xs uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </div>
      <div className="text-xs font-medium text-neutral-200">{value}</div>
    </div>
  );
}
