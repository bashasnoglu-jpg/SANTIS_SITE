import React from 'react';

export default function OperatorAuditRail({ decisions }) {
  return (
    <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4">
      <div className="mb-3 text-2xs uppercase tracking-widest text-sovereign-bronze">
        Operator Audit Rail
      </div>

      <div className="space-y-2">
        {(!decisions || decisions.length === 0) ? (
          <div className="text-sm text-sovereign-bronze">No operator decisions yet.</div>
        ) : (
          [...decisions].reverse().map((decision, index) => (
            <div
              key={`${decision.actionId}-${index}`}
              className="rounded-xl border border-sovereign-panel/50 bg-sovereign-coal/50 px-3 py-2 text-sm text-sovereign-ink"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold tracking-wider text-2xs uppercase text-sovereign-accent">{decision.decision}</span>
                <span className="text-2xs text-sovereign-sand">{decision.operatorId}</span>
              </div>
              <div className="mt-1 text-micro text-sovereign-bronze">
                {decision.reason || '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
