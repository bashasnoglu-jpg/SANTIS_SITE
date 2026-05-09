import React from 'react';
import OverrideBadge from './OverrideBadge';

export default function ActionQueueTable({ items, onSelect }) {
  if (!items || items.length === 0) {
     return (
       <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4 text-center text-sm text-sovereign-bronze">
         No autonomous actions generated in the current flow.
       </div>
     );
  }

  return (
    <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4">
      <div className="mb-3 text-2xs uppercase tracking-widest text-sovereign-bronze">
        Action Queue
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item)}
            className="flex w-full items-center justify-between rounded-xl border border-sovereign-panel/50 bg-sovereign-coal/50 px-3 py-3 text-left transition hover:bg-sovereign-panel/70"
          >
            <div>
              <div className="text-sm font-semibold text-sovereign-ink">{item.type}</div>
              <div className="mt-1 text-micro font-mono text-sovereign-bronze">
                {(item.explanationCodes ?? []).join(', ') || '—'}
              </div>
            </div>

            <OverrideBadge
              status={item.status}
              severity={item.severity}
              autoExecutable={item.autoExecutable}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
