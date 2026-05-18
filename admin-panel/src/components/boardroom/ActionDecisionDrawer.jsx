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
    <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4">
      <div className="mb-2 text-2xs uppercase tracking-widest text-sovereign-bronze">
        Action Decision
      </div>

      <div className="mb-2 text-sm font-semibold text-sovereign-ink">{item.type}</div>
      <div className="mb-3 text-micro font-mono text-sovereign-bronze">
        {(item.explanationCodes ?? []).join(', ') || '—'}
      </div>

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Operator note..."
        className="mb-3 layout-minh-90 w-full rounded-xl border border-sovereign-panel bg-sovereign-coal/50 px-3 py-2 text-sm text-sovereign-ink outline-none focus:border-sovereign-earth"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submit('APPROVE')}
          className="rounded-xl border border-sovereign-success/30 bg-sovereign-success/10 px-3 py-2 text-xs text-sovereign-success transition hover:bg-sovereign-success/20"
        >
          Approve
        </button>

        <button
          type="button"
          onClick={() => submit('REJECT')}
          className="rounded-xl border border-sovereign-danger/30 bg-sovereign-danger/10 px-3 py-2 text-xs text-sovereign-danger transition hover:bg-sovereign-danger/20"
        >
          Reject
        </button>

        <button
          type="button"
          onClick={() => submit('OVERRIDE')}
          className="rounded-xl border border-sovereign-warning/30 bg-sovereign-warning/10 px-3 py-2 text-xs text-sovereign-warning transition hover:bg-sovereign-warning/20"
        >
          Override
        </button>

        <button
          type="button"
          onClick={() => submit('DISMISS')}
          className="rounded-xl border border-sovereign-panel bg-sovereign-coal/50 px-3 py-2 text-xs text-sovereign-sand transition hover:bg-sovereign-panel"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
