import React from 'react';

export default function ExperimentTimeline({ experiments }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-2xs uppercase tracking-queue text-neutral-500">
        Experiment Timeline
      </div>

      <div className="space-y-2">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className="rounded-xl border border-white/5 bg-black/10 px-3 py-2 text-sm text-neutral-200"
          >
            <div className="flex items-center justify-between">
              <span>{exp.key}</span>
              <span>{exp.status}</span>
            </div>
            <div className="mt-1 text-micro text-neutral-500">
              {exp.startAt} {exp.endAt ? `→ ${exp.endAt}` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
