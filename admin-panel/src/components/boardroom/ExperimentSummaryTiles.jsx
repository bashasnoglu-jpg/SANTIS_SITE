import React from 'react';

export default function ExperimentSummaryTiles({
  total,
  runningCount,
  completedCount,
  pausedCount,
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <Tile label="Total Experiments" value={String(total)} />
      <Tile label="Running" value={String(runningCount)} />
      <Tile label="Completed" value={String(completedCount)} />
      <Tile label="Paused" value={String(pausedCount)} />
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div className="rounded-xl border border-sovereign-panel bg-sovereign-obsidian/50 px-3 py-3">
      <div className="mb-1 text-2xs uppercase tracking-widest text-sovereign-bronze">
        {label}
      </div>
      <div className="text-sm font-medium text-sovereign-ink">{value}</div>
    </div>
  );
}
