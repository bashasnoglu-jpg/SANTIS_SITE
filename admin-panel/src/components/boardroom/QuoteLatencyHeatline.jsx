import React from 'react';

export default function QuoteLatencyHeatline({ avgQuoteLatencyMs }) {
  const isHighLatency = avgQuoteLatencyMs != null && avgQuoteLatencyMs > 1200;
  
  return (
    <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4">
      <div className="mb-3 text-2xs uppercase tracking-widest text-sovereign-bronze">
        Quote Latency Heatline
      </div>

      <div className={`text-2xl font-semibold ${isHighLatency ? 'text-sovereign-danger' : 'text-sovereign-success'}`}>
        {avgQuoteLatencyMs != null ? `${avgQuoteLatencyMs} ms` : '—'}
      </div>

      <div className="mt-2 text-sm text-sovereign-bronze">
        Average quote response time across recent events.
      </div>
    </div>
  );
}
