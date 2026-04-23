import React, { useState } from 'react';

export default function ActionDecisionDrawer({ item, onDecision }) {
  const [reason, setReason] = useState('');

  if (!item) return null;

  function submit(decision) {
    onDecision?.({
      actionId: item.id,
      operatorId: 'operator_primary',
      decision,
      reason: reason || undefined,
      ts: new Date().toISOString(),
    });
    setReason(''); // reset after submit
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 text-2xs uppercase tracking-[0.24em] text-neutral-500">
        Action Decision
      </div>

      <div className="mb-2 text-sm font-semibold text-neutral-100">{item.type}</div>
      <div className="mb-3 text-micro font-mono text-neutral-500">
        {(item.explanationCodes ?? []).join(', ') || '—'}
      </div>

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Operator note..."
        className="mb-3 layout-minh-90 w-full rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-white/20"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submit('APPROVE')}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 transition hover:bg-emerald-500/20"
        >
          Approve
        </button>

        <button
          type="button"
          onClick={() => submit('REJECT')}
          className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20"
        >
          Reject
        </button>

        <button
          type="button"
          onClick={() => submit('OVERRIDE')}
          className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 transition hover:bg-amber-500/20"
        >
          Override
        </button>

        <button
          type="button"
          onClick={() => submit('DISMISS')}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-300 transition hover:bg-white/10"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
