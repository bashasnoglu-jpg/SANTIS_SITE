import React from 'react';

export default function ExperimentVariantTable({ experiments }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-[10px] uppercase tracking-[0.24em] text-neutral-500">
        Experiment Variants
      </div>

      <div className="space-y-2">
        {experiments.map((exp) => (
          <div
            key={exp.id}
            className="rounded-xl border border-white/5 bg-black/10 px-3 py-3 text-sm text-neutral-200"
          >
            <div className="flex items-center justify-between">
              <span>{exp.key}</span>
              <span>{exp.status}</span>
            </div>

            <div className="mt-2 text-[11px] text-neutral-500">
              control={exp.trafficAllocation.control} · variant_a={exp.trafficAllocation.variant_a}
            </div>

            <div className="mt-2 text-[11px] text-neutral-400">
              targetMetric: {exp.targetMetric}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
