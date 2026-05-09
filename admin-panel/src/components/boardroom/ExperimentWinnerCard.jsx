import React from 'react';

export default function ExperimentWinnerCard({ evaluation }) {
  if (!evaluation) return null;

  return (
    <div className="rounded-2xl border border-sovereign-success/30 bg-sovereign-success/10 px-4 py-4 text-sovereign-ink">
      <div className="mb-1 text-2xs uppercase tracking-widest text-sovereign-success">
        Experiment Winner
      </div>

      <div className="text-base font-medium">
        {evaluation.winner}
      </div>

      <div className="mt-1 text-sm text-sovereign-sand">
        Confidence: {evaluation.confidence}
      </div>
    </div>
  );
}
