import { deriveBoardroomIntelligence } from './admin-panel/src/lib/boardroom-intelligence/intelligence.adapter.ts';

const baseEvent = {
  ts: new Date().toISOString(),
  requestId: 'req_123',
  event: 'SERVICE_OPENED',
  degraded: false,
  explanationCodes: [],
  funnelExplanationCodes: [],
  quoteLatencyMs: 250,
  abandonmentRisk: 0.1,
  decisionMode: 'NORMAL',
  funnelMode: 'REVENUE_PRIORITY',
};

const cases = [
  {
    name: 'CASE A — Healthy flow',
    input: {
      events: [
        { ...baseEvent, event: 'SERVICE_OPENED', ts: '2026-04-20T10:00:00.000Z' },
        { ...baseEvent, event: 'SLOT_SELECTED', ts: '2026-04-20T10:00:05.000Z' },
        { ...baseEvent, event: 'QUOTE_REQUESTED', ts: '2026-04-20T10:00:10.000Z' },
        { ...baseEvent, event: 'QUOTE_RECEIVED', quoteLatencyMs: 200, ts: '2026-04-20T10:00:11.000Z' },
      ]
    },
    expected: {
      latestDecisionMode: 'NORMAL',
      latestFunnelMode: 'REVENUE_PRIORITY',
      degradedRate: 0,
      avgQuoteLatencyMs: 238 // Math.round((250 + 250 + 250 + 200) / 4) = 238
    }
  },
  {
    name: 'CASE B — Degraded assist flow',
    input: {
      events: [
        { ...baseEvent, event: 'SERVICE_OPENED', degraded: true, explanationCodes: ['DEGRADED_MODE'], funnelExplanationCodes: ['DEGRADED_FUNNEL_FALLBACK'], decisionMode: 'ASSIST', funnelMode: 'ASSIST_PRIORITY', ts: '2026-04-20T10:01:00.000Z' },
      ]
    },
    expected: {
      latestDecisionMode: 'ASSIST',
      latestFunnelMode: 'ASSIST_PRIORITY',
      degradedRate: 1,
      topDecisionReasonsIncludes: 'DEGRADED_MODE',
      topFunnelReasonsIncludes: 'DEGRADED_FUNNEL_FALLBACK'
    }
  },
  {
    name: 'CASE C — Abandonment cluster',
    input: {
      events: [
        { ...baseEvent, event: 'FLOW_ABANDONED', ts: '2026-04-20T10:02:00.000Z' },
        { ...baseEvent, event: 'FLOW_ABANDONED', ts: '2026-04-20T10:03:00.000Z' },
      ]
    },
    expected: {
      abandonmentClustersCount: 1,
      abandonmentEventCount: 2
    }
  },
  {
    name: 'CASE D — High latency stress',
    input: {
      events: [
        { ...baseEvent, event: 'QUOTE_RECEIVED', quoteLatencyMs: 1800, explanationCodes: ['HIGH_QUOTE_LATENCY'], decisionMode: 'ASSIST', funnelMode: 'ASSIST_PRIORITY', ts: '2026-04-20T10:04:00.000Z' },
      ]
    },
    expected: {
      avgQuoteLatencyMs: 1800,
      topDecisionReasonsIncludes: 'HIGH_QUOTE_LATENCY'
    }
  }
];

console.log('=== BOARDROOM INTELLIGENCE V1.4 SMOKE TEST ===\n');

let allPassed = true;

cases.forEach(c => {
  console.log(`--- ${c.name} ---`);
  
  const output = deriveBoardroomIntelligence(c.input);
  
  let pass = true;
  const failedKeys = [];
  
  for (const [key, expectedValue] of Object.entries(c.expected)) {
    if (key === 'topDecisionReasonsIncludes') {
        const hasIt = output.topDecisionReasons.some(r => r.code === expectedValue);
        if (!hasIt) {
            pass = false;
            failedKeys.push(`${key} (Expected: ${expectedValue})`);
        }
    } else if (key === 'topFunnelReasonsIncludes') {
        const hasIt = output.topFunnelReasons.some(r => r.code === expectedValue);
        if (!hasIt) {
            pass = false;
            failedKeys.push(`${key} (Expected: ${expectedValue})`);
        }
    } else if (key === 'abandonmentClustersCount') {
        if (output.abandonmentClusters.length !== expectedValue) {
            pass = false;
            failedKeys.push(`${key} (Expected: ${expectedValue}, Got: ${output.abandonmentClusters.length})`);
        }
    } else if (key === 'abandonmentEventCount') {
        if (output.abandonmentClusters[0]?.count !== expectedValue) {
            pass = false;
            failedKeys.push(`${key} (Expected: ${expectedValue}, Got: ${output.abandonmentClusters[0]?.count})`);
        }
    } else if (output[key] !== expectedValue) {
      pass = false;
      failedKeys.push(`${key} (Expected: ${expectedValue}, Got: ${output[key]})`);
    }
  }

  const outputSummary = [
    `decisionMode=${output.latestDecisionMode}`,
    `funnelMode=${output.latestFunnelMode}`,
    `avgLatency=${output.avgQuoteLatencyMs}`,
    `degradedRate=${output.degradedRate}`,
    `abandonmentClusters=${JSON.stringify(output.abandonmentClusters)}`,
    `topDecisionReasons=${JSON.stringify(output.topDecisionReasons)}`,
  ].join(', ');

  console.log(`Output: ${outputSummary}`);
  
  if (pass) {
    console.log('✅ PASS\n');
  } else {
    console.log(`❌ FAIL: Mismatches -> ${failedKeys.join('; ')}\n`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('🏆 ALL INTELLIGENCE MATRIX CASES PASSED. THE BOARDROOM SEES EVERYTHING.');
} else {
  console.log('🚨 INTELLIGENCE MATRIX FAILURE. OBSERVATION LAYER HAS BLIND SPOTS.');
}
