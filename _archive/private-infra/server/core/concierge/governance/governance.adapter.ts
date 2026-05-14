import { attributeOutcomesToActions } from './governance.attribution.ts';
import { groupImpactByActionType, sumRevenue } from './governance.metrics.ts';

export function deriveGovernanceScoreboard(input: {
  exposures: any[];
  outcomes: any[];
}) {
  const attribution = attributeOutcomesToActions(input.exposures, input.outcomes);
  const totalAttributedRevenue = sumRevenue(attribution);
  const impactByActionType = groupImpactByActionType(attribution);

  const totalOutcomes = input.outcomes.length;
  const confirmedIntents = input.outcomes.filter((o) => o.event === 'INTENT_CONFIRMED').length;
  const abandonmentCount = input.outcomes.filter((o) => o.event === 'FLOW_ABANDONED').length;

  return {
    attribution,
    totalAttributedRevenue,
    impactByActionType,
    confirmedIntentRate: totalOutcomes > 0 ? Number((confirmedIntents / totalOutcomes).toFixed(2)) : 0,
    abandonmentRate: totalOutcomes > 0 ? Number((abandonmentCount / totalOutcomes).toFixed(2)) : 0,
  };
}
