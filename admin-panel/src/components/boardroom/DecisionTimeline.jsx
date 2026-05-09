import React from 'react';

export default function DecisionTimeline({ events }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-2xs uppercase tracking-queue text-neutral-500">
        Decision Timeline
      </div>

      <div className="space-y-2">
        {events.map((event, index) => (
          <div
            key={`${event.ts}-${index}`}
            className="rounded-xl border border-white/5 bg-black/10 px-3 py-2 text-xs"
          >
            <div className="flex items-center justify-between text-neutral-300">
              <span className="font-medium text-sbr-amber-muted">{event.event}</span>
              <span className={`text-2xs uppercase font-bold tracking-wider ${event.decisionMode === 'ASSIST' ? 'text-sbr-amber' : 'text-sbr-emerald'}`}>
                {event.decisionMode ?? 'NORMAL'}
              </span>
            </div>

            <div className="mt-1 text-micro text-neutral-500 font-mono">
              {(event.explanationCodes ?? []).join(', ') || '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
