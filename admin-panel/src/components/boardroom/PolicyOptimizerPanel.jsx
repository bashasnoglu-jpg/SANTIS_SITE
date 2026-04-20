import React from 'react';
import ThresholdRecommendationTable from './ThresholdRecommendationTable';
import OptimizerInsightRail from './OptimizerInsightRail';
import PolicyDeltaCard from './PolicyDeltaCard';

export default function PolicyOptimizerPanel({ output }) {
  const top = output?.recommendations?.[0] ?? null;

  return (
    <div className="space-y-4">
      {top && <PolicyDeltaCard item={top} />}
      <ThresholdRecommendationTable rows={output?.recommendations ?? []} />
      <OptimizerInsightRail recommendations={output?.recommendations ?? []} />
    </div>
  );
}
