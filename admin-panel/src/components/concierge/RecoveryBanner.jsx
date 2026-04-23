import React from 'react';

export default function RecoveryBanner({ quoteLatencyMs, visible }) {
  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-neutral-200">
      <div className="mb-1 text-2xs uppercase tracking-[0.24em] text-rose-300/80">
        Recovery Path
      </div>
      <div>
        Quote flow slowed down. A simplified recovery path is available.
      </div>
      {quoteLatencyMs != null && (
        <div className="mt-2 text-[11px] text-neutral-400">
          Last observed quote latency: {quoteLatencyMs} ms
        </div>
      )}
    </div>
  );
}
