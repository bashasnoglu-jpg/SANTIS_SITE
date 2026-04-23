import React from 'react';

export default function RevenueDailyFallback({ title = 'Revenue feed unavailable', detail }) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-neutral-200">
      <div className="mb-1 text-2xs uppercase tracking-[0.24em] text-amber-300/80">
        Graceful Degradation
      </div>
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-neutral-400">
        {detail || 'Daily revenue analytics could not be loaded. The dashboard remains operational.'}
      </div>
    </div>
  );
}
