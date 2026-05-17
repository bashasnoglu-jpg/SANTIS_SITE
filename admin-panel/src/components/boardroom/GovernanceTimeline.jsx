import React from 'react';

export default function GovernanceTimeline({ attribution }) {
  if (!attribution || attribution.length === 0) return null;

  return (
    <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4">
      <div className="mb-3 text-2xs uppercase tracking-queue text-sovereign-bronze">
        Governance Timeline
      </div>

      <div className="space-y-2">
        {attribution.map((item) => (
          <div
            key={`${item.actionId}-${item.outcomeId}`}
            className="rounded-xl border border-sovereign-panel/50 bg-sovereign-coal/50 px-3 py-2 text-sm text-sovereign-ink"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{item.actionType}</span>
              <span className="text-2xs font-bold tracking-widest text-sbr-sky">{item.outcomeEvent}</span>
            </div>
            <div className="mt-1 text-micro text-sovereign-bronze font-mono">
              Revenue: €{item.attributedRevenue ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
