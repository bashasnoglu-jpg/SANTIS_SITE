import { useMemo } from 'react';

export function useRevenueGovernance(scoreboard: any) {
  return useMemo(() => {
    return {
      topAction: scoreboard?.impactByActionType?.[0] ?? null,
      totalAttributedRevenue: scoreboard?.totalAttributedRevenue ?? 0,
      confirmedIntentRate: scoreboard?.confirmedIntentRate ?? 0,
      abandonmentRate: scoreboard?.abandonmentRate ?? 0,
    };
  }, [scoreboard]);
}
