import React from 'react';

export default function PolicyDeltaCard({ item }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
      <div className="mb-1 text-2xs uppercase tracking-[0.18em] text-neutral-500">
        {item.thresholdKey}
      </div>
      <div className="text-sm text-neutral-200">
        {item.currentValue} → {item.recommendedValue}
      </div>
      <div className="mt-1 text-[11px] text-neutral-500">
        {item.direction.toUpperCase()} · confidence {item.confidence}
      </div>
    </div>
  );
}
