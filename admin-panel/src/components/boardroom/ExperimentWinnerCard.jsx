import React from 'react';

export default function ExperimentWinnerCard({ evaluation }) {
  if (!evaluation) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-neutral-200">
      <div className="mb-1 text-2xs uppercase tracking-[0.24em] text-emerald-300/80">
        Experiment Winner
      </div>

      <div className="text-base font-medium">
        {evaluation.winner}
      </div>

      <div className="mt-1 text-sm text-neutral-400">
        Confidence: {evaluation.confidence}
      </div>
    </div>
  );
}
