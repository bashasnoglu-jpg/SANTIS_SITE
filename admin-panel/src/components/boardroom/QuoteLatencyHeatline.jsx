import React from 'react';

export default function QuoteLatencyHeatline({ avgQuoteLatencyMs }) {
  const isHighLatency = avgQuoteLatencyMs != null && avgQuoteLatencyMs > 1200;
  
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-2xs uppercase tracking-[0.24em] text-neutral-500">
        Quote Latency Heatline
      </div>

      <div className={`text-2xl font-semibold ${isHighLatency ? 'text-rose-400' : 'text-emerald-400'}`}>
        {avgQuoteLatencyMs != null ? `${avgQuoteLatencyMs} ms` : '—'}
      </div>

      <div className="mt-2 text-sm text-neutral-500">
        Average quote response time across recent events.
      </div>
    </div>
  );
}
