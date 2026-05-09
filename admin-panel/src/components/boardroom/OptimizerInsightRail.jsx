import React from 'react';

export default function OptimizerInsightRail({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4">
      <div className="mb-3 text-2xs uppercase tracking-widest text-sovereign-bronze">
        Optimizer Insights
      </div>

      <div className="space-y-2">
        {recommendations.map((item) => (
          <div
            key={item.thresholdKey}
            className="rounded-xl border border-sovereign-panel/50 bg-sovereign-coal/50 px-3 py-2 text-sm text-sovereign-ink"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{item.thresholdKey}</span>
              <span className={`text-2xs font-bold tracking-widest ${item.direction === 'hold' ? 'text-sovereign-bronze' : 'text-sovereign-warning'}`}>{item.direction.toUpperCase()}</span>
            </div>

            <div className="mt-1 text-micro text-sovereign-bronze">
              {(item.reasonCodes ?? []).join(', ') || '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
