import React from 'react';

export default function ExperimentTimeline({ experiments }) {
  return (
    <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4">
      <div className="mb-3 text-2xs uppercase tracking-queue text-sovereign-bronze">
        Experiment Timeline
      </div>

      <div className="space-y-2">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className="rounded-xl border border-sovereign-panel/50 bg-sovereign-coal/50 px-3 py-2 text-sm text-sovereign-ink"
          >
            <div className="flex items-center justify-between">
              <span>{exp.key}</span>
              <span>{exp.status}</span>
            </div>
            <div className="mt-1 text-micro text-sovereign-bronze">
              {exp.startAt} {exp.endAt ? `→ ${exp.endAt}` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
