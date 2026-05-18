import React from 'react';

export default function DegradedImpactTiles({
  degradedRate,
  latestDecisionMode,
  latestFunnelMode,
}) {
  return (
    <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4">
      <div className="mb-3 text-2xs uppercase tracking-widest text-sovereign-bronze">
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
    <div className="rounded-xl border border-sovereign-panel/50 bg-sovereign-coal/50 px-3 py-3">
      <div className="mb-1 text-2xs uppercase tracking-widest text-sovereign-bronze">
        {label}
      </div>
      <div className="text-xs font-medium text-sovereign-ink">{value}</div>
    </div>
  );
}
