import React from 'react';

export default function ExperimentVariantTable({ experiments }) {
  return (
    <div className="rounded-2xl border border-sovereign-panel bg-sovereign-obsidian/50 p-4">
      <div className="mb-3 text-2xs uppercase tracking-widest text-sovereign-bronze">
        Experiment Variants
      </div>

      <div className="space-y-2">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className="rounded-xl border border-sovereign-panel/50 bg-sovereign-coal/50 px-3 py-3 text-sm text-sovereign-ink"
          >
            <div className="flex items-center justify-between">
              <span>{exp.key}</span>
              <span>{exp.status}</span>
            </div>

            <div className="mt-2 text-micro text-sovereign-bronze">
              control={exp.trafficAllocation.control} · variant_a={exp.trafficAllocation.variant_a}
            </div>

            <div className="mt-2 text-micro text-sovereign-sand">
              targetMetric: {exp.targetMetric}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
