import React from 'react';

export function ConciergeAssistBanner(props) {
  const message = props.degraded
    ? 'Live availability is unstable. A human concierge can complete this journey more reliably.'
    : 'Need a faster path? Our concierge can help finalize the best option for you.';

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-neutral-200 mb-4 animate-in fade-in duration-500">
      <div className="mb-1 text-2xs uppercase tracking-[0.24em] text-amber-300/80">
        Concierge Assist
      </div>
      <div>{message}</div>
      <div className="mt-2 text-[11px] text-neutral-400 font-mono">
        Signals: {props.explanationCodes?.join(', ') || 'NONE'}
      </div>
    </div>
  );
}
