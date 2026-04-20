import React from 'react';
import RevenueOutcomeTiles from './RevenueOutcomeTiles';
import ActionImpactTable from './ActionImpactTable';
import GovernanceTimeline from './GovernanceTimeline';

export default function GovernanceScoreboard({ scoreboard }) {
  if (!scoreboard) return null;

  return (
    <div className="space-y-4">
      <RevenueOutcomeTiles
        totalAttributedRevenue={scoreboard.totalAttributedRevenue}
        confirmedIntentRate={scoreboard.confirmedIntentRate}
        abandonmentRate={scoreboard.abandonmentRate}
      />

      <ActionImpactTable rows={scoreboard.impactByActionType} />
      <GovernanceTimeline attribution={scoreboard.attribution} />
    </div>
  );
}
