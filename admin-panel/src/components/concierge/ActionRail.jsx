import React from 'react';

export default function ActionRail({ actions }) {
  if (!actions?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-2xs uppercase tracking-[0.24em] text-neutral-500">
        Autonomous Actions
      </div>

      <div className="space-y-2">
        {actions.map((action) => (
          <div
            key={action.id}
            className="rounded-xl border border-white/5 bg-black/10 px-3 py-2 text-sm text-neutral-200"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{action.type}</span>
              <span className={`text-2xs font-bold tracking-widest uppercase ${action.autoExecutable ? 'text-amber-400' : 'text-neutral-400'}`}>
                {action.autoExecutable ? 'AUTO' : 'ADVISORY'}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-neutral-500 font-mono">
              {(action.explanationCodes ?? []).join(', ') || '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
