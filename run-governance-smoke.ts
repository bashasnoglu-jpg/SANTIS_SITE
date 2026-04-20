import { deriveGovernanceScoreboard } from './server/core/concierge/governance/governance.adapter.ts';

const cases = [
  {
    name: 'CASE A — recovery banner revenue save',
    exposures: [
      {
        actionId: 'act_1',
        actionType: 'SHOW_QUOTE_RECOVERY_BANNER',
        intentId: 'int_123',
        ts: '2026-04-20T10:00:00Z'
      }
    ],
    outcomes: [
      {
        outcomeId: 'out_1',
        intentId: 'int_123',
        event: 'INTENT_CONFIRMED',
        revenueAmount: 180,
        ts: '2026-04-20T10:05:00Z'
      }
    ],
    expected: {
      attributedAction: 'SHOW_QUOTE_RECOVERY_BANNER',
      attributedRevenue: 180
    }
  },
  {
    name: 'CASE B — concierge handoff save',
    exposures: [
      {
        actionId: 'act_2',
        actionType: 'SHOW_CONCIERGE_PRIORITY_CTA',
        quoteId: 'quo_456',
        ts: '2026-04-20T11:00:00Z'
      }
    ],
    outcomes: [
      {
        outcomeId: 'out_2',
        quoteId: 'quo_456',
        event: 'CONCIERGE_HANDOFF_ACCEPTED',
        revenueAmount: 0,
        ts: '2026-04-20T11:02:00Z'
      }
    ],
    expected: {
      attributedAction: 'SHOW_CONCIERGE_PRIORITY_CTA',
      attributedRevenue: 0
    }
  },
  {
    name: 'CASE C — abandonment despite action',
    exposures: [
      {
        actionId: 'act_3',
        actionType: 'ENABLE_COMPACT_LAYOUT',
        requestId: 'req_789',
        ts: '2026-04-20T12:00:00Z'
      }
    ],
    outcomes: [
      {
        outcomeId: 'out_3',
        requestId: 'req_789',
        event: 'FLOW_ABANDONED',
        revenueAmount: 0,
        ts: '2026-04-20T12:15:00Z'
      }
    ],
    expected: {
      attributedAction: 'ENABLE_COMPACT_LAYOUT',
      abandonmentRate: 1
    }
  },
  {
    name: 'CASE D — mixed action impact',
    exposures: [
      { actionId: 'act_4', actionType: 'REORDER_SERVICES', intentId: 'int_mix_1', ts: '2026-04-20T13:00:00Z' },
      { actionId: 'act_5', actionType: 'REORDER_SERVICES', intentId: 'int_mix_2', ts: '2026-04-20T13:10:00Z' },
      { actionId: 'act_6', actionType: 'SHOW_CONCIERGE_PRIORITY_CTA', intentId: 'int_mix_3', ts: '2026-04-20T13:20:00Z' },
    ],
    outcomes: [
      { outcomeId: 'out_4', intentId: 'int_mix_1', event: 'INTENT_CONFIRMED', revenueAmount: 200, ts: '2026-04-20T13:05:00Z' },
      { outcomeId: 'out_5', intentId: 'int_mix_2', event: 'INTENT_CONFIRMED', revenueAmount: 300, ts: '2026-04-20T13:15:00Z' },
      { outcomeId: 'out_6', intentId: 'int_mix_3', event: 'FLOW_ABANDONED', ts: '2026-04-20T13:25:00Z' },
    ],
    expected: {
      topAction: 'REORDER_SERVICES',
      totalAttributedRevenue: 500
    }
  }
];

console.log('=== REVENUE GOVERNANCE V1.6 SMOKE TEST ===\n');

let allPassed = true;

cases.forEach(c => {
  console.log(`--- ${c.name} ---`);
  
  const scoreboard = deriveGovernanceScoreboard({
    exposures: c.exposures,
    outcomes: c.outcomes,
  });
  
  let pass = true;
  const failedKeys = [];
  
  if (c.expected.attributedAction) {
    const hasAttr = scoreboard.attribution.some(a => a.actionType === c.expected.attributedAction);
    if (!hasAttr) {
      pass = false;
      failedKeys.push(`Expected attribution for action ${c.expected.attributedAction}`);
    }
  }

  if (c.expected.attributedRevenue !== undefined) {
    if (scoreboard.totalAttributedRevenue !== c.expected.attributedRevenue) {
      pass = false;
      failedKeys.push(`Expected revenue ${c.expected.attributedRevenue}, got ${scoreboard.totalAttributedRevenue}`);
    }
  }

  if (c.expected.abandonmentRate !== undefined) {
    if (scoreboard.abandonmentRate !== c.expected.abandonmentRate) {
      pass = false;
      failedKeys.push(`Expected abandonmentRate ${c.expected.abandonmentRate}, got ${scoreboard.abandonmentRate}`);
    }
  }

  if (c.expected.topAction) {
    const top = scoreboard.impactByActionType[0]?.actionType;
    if (top !== c.expected.topAction) {
      pass = false;
      failedKeys.push(`Expected topAction ${c.expected.topAction}, got ${top}`);
    }
  }

  if (c.expected.totalAttributedRevenue !== undefined) {
    if (scoreboard.totalAttributedRevenue !== c.expected.totalAttributedRevenue) {
       pass = false;
       failedKeys.push(`Expected total revenue ${c.expected.totalAttributedRevenue}, got ${scoreboard.totalAttributedRevenue}`);
    }
  }

  const outStr = `Scoreboard: Revenue=€${scoreboard.totalAttributedRevenue}, Intents=${scoreboard.confirmedIntentRate}, Abandons=${scoreboard.abandonmentRate}, TopAction=${scoreboard.impactByActionType[0]?.actionType || 'none'}`;
  
  console.log(`Output: ${outStr}`);

  if (pass) {
    console.log('✅ PASS\n');
  } else {
    console.log(`❌ FAIL: Mismatches -> ${failedKeys.join('; ')}\n`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('🏆 ALL GOVERNANCE MATRIX CASES PASSED. THE REVENUE LAYER IS MEASURING REAL IMPACT.');
} else {
  console.log('🚨 GOVERNANCE MATRIX FAILURE. ATTRIBUTION LOGIC HAS BLIND SPOTS.');
}
