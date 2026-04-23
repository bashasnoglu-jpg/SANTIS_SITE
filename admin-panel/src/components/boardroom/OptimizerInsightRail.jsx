import React from 'react';

export default function OptimizerInsightRail({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-2xs uppercase tracking-[0.24em] text-neutral-500">
        Optimizer Insights
      </div>

      <div className="space-y-2">
        {recommendations.map((item) => (
          <div
            key={item.thresholdKey}
            className="rounded-xl border border-white/5 bg-black/10 px-3 py-2 text-sm text-neutral-200"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{item.thresholdKey}</span>
              <span className={`text-2xs font-bold tracking-widest ${item.direction === 'hold' ? 'text-neutral-500' : 'text-amber-400'}`}>{item.direction.toUpperCase()}</span>
            </div>

            <div className="mt-1 text-[11px] text-neutral-500">
              {(item.reasonCodes ?? []).join(', ') || '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
