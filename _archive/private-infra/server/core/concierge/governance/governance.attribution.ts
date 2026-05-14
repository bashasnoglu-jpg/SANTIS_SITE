type Exposure = {
  actionId: string;
  actionType: string;
  requestId?: string;
  quoteId?: string;
  intentId?: string;
  ts: string;
};

type Outcome = {
  outcomeId: string;
  requestId?: string;
  quoteId?: string;
  intentId?: string;
  ts: string;
  event: string;
  revenueAmount?: number;
};

function withinWindow(exposureTs: string, outcomeTs: string, maxMs = 30 * 60 * 1000) {
  const a = new Date(exposureTs).getTime();
  const b = new Date(outcomeTs).getTime();
  return b >= a && b - a <= maxMs;
}

export function attributeOutcomesToActions(
  exposures: Exposure[],
  outcomes: Outcome[]
) {
  const records: Array<{
    actionId: string;
    actionType: string;
    outcomeId: string;
    outcomeEvent: string;
    attributedRevenue?: number;
    ts: string;
  }> = [];

  for (const outcome of outcomes) {
    const matched = [...exposures]
      .filter((exposure) => withinWindow(exposure.ts, outcome.ts))
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .find((exposure) => {
        if (outcome.intentId && exposure.intentId && outcome.intentId === exposure.intentId) {
          return true;
        }
        if (outcome.quoteId && exposure.quoteId && outcome.quoteId === exposure.quoteId) {
          return true;
        }
        if (outcome.requestId && exposure.requestId && outcome.requestId === exposure.requestId) {
          return true;
        }
        return false;
      });

    if (!matched) continue;

    records.push({
      actionId: matched.actionId,
      actionType: matched.actionType,
      outcomeId: outcome.outcomeId,
      outcomeEvent: outcome.event,
      attributedRevenue: outcome.revenueAmount,
      ts: outcome.ts,
    });
  }

  return records;
}
