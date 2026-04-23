import React from 'react';

export default function OperatorAuditRail({ decisions }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-2xs uppercase tracking-[0.24em] text-neutral-500">
        Operator Audit Rail
      </div>

      <div className="space-y-2">
        {(!decisions || decisions.length === 0) ? (
          <div className="text-sm text-neutral-500">No operator decisions yet.</div>
        ) : (
          [...decisions].reverse().map((decision, index) => (
            <div
              key={`${decision.actionId}-${index}`}
              className="rounded-xl border border-white/5 bg-black/10 px-3 py-2 text-sm text-neutral-200"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold tracking-wider text-2xs uppercase text-sky-300">{decision.decision}</span>
                <span className="text-2xs text-neutral-400">{decision.operatorId}</span>
              </div>
              <div className="mt-1 text-micro text-neutral-500">
                {decision.reason || '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
