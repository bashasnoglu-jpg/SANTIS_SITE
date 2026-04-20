import React from 'react';
import OverrideBadge from './OverrideBadge';

export default function ActionQueueTable({ items, onSelect }) {
  if (!items || items.length === 0) {
     return (
       <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-neutral-500">
         No autonomous actions generated in the current flow.
       </div>
     );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-[10px] uppercase tracking-[0.24em] text-neutral-500">
        Action Queue
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item)}
            className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-black/10 px-3 py-3 text-left transition hover:bg-white/5"
          >
            <div>
              <div className="text-sm font-semibold text-neutral-200">{item.type}</div>
              <div className="mt-1 text-[11px] font-mono text-neutral-500">
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
