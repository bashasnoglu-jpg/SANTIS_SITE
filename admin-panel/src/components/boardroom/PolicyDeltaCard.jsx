import React from 'react';

export default function PolicyDeltaCard({ item }) {
  return (
    <div className="rounded-xl border border-sovereign-panel bg-sovereign-obsidian/50 px-3 py-3">
      <div className="mb-1 text-2xs uppercase tracking-widest text-sovereign-bronze">
        {item.thresholdKey}
      </div>
      <div className="text-sm text-sovereign-ink">
        {item.currentValue} → {item.recommendedValue}
      </div>
      <div className="mt-1 text-micro text-sovereign-bronze">
        {item.direction.toUpperCase()} · confidence {item.confidence}
      </div>
    </div>
  );
}
