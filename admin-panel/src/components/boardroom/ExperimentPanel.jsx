import React from 'react';
import ExperimentSummaryTiles from './ExperimentSummaryTiles';
import ExperimentVariantTable from './ExperimentVariantTable';
import ExperimentWinnerCard from './ExperimentWinnerCard';
import ExperimentTimeline from './ExperimentTimeline';

export default function ExperimentPanel({
  summary,
  experiments,
  latestEvaluation,
}) {
  return (
    <div className="space-y-4">
      <ExperimentSummaryTiles
        total={summary.total}
        runningCount={summary.runningCount}
        completedCount={summary.completedCount}
        pausedCount={summary.pausedCount}
      />

      <ExperimentWinnerCard evaluation={latestEvaluation} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ExperimentVariantTable experiments={experiments} />
        <ExperimentTimeline experiments={experiments} />
      </div>
    </div>
  );
}
