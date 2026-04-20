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
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
      <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </div>
      <div className="text-sm font-medium text-neutral-200">{value}</div>
    </div>
  );
}
