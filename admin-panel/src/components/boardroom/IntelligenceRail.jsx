import React from 'react';
import DecisionTimeline from './DecisionTimeline';
import FunnelStateTimeline from './FunnelStateTimeline';
import AbandonmentClusterCard from './AbandonmentClusterCard';
import QuoteLatencyHeatline from './QuoteLatencyHeatline';
import DegradedImpactTiles from './DegradedImpactTiles';

export default function IntelligenceRail({ intelligence }) {
  if (!intelligence) return null;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <DecisionTimeline events={intelligence.recentDecisionTimeline} />
      <FunnelStateTimeline events={intelligence.recentFunnelTimeline} />
      <QuoteLatencyHeatline avgQuoteLatencyMs={intelligence.avgQuoteLatencyMs} />
      <DegradedImpactTiles
        degradedRate={intelligence.degradedRate}
        latestDecisionMode={intelligence.latestDecisionMode}
        latestFunnelMode={intelligence.latestFunnelMode}
      />
      <AbandonmentClusterCard clusters={intelligence.abandonmentClusters} />
    </div>
  );
}
