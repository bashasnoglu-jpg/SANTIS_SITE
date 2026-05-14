import { deriveAutonomousConciergeDecision } from './admin-panel/src/lib/concierge-decision/decision.adapter.ts';

const cases = [
  {
    name: 'CASE 1 — Healthy baseline',
    input: {
      snapshot: { degraded: false, warningCodes: [], serviceCount: 6, slotCount: 5 },
      telemetry: { quoteLatencyMs: 220 },
      behavioral: { serviceOpenCount: 1, slotSelectionCount: 0, quoteRequestCount: 0, quoteFailureCount: 0, abandonmentRisk: 0.10 }
    },
    expected: {
      shouldReduceChoices: false,
      shouldEscalateToHuman: false,
      shouldHideLowConfidenceSlots: false,
      shouldPromoteTopService: true,
      shouldOfferConciergeAssist: false,
      shouldSuppressAggressiveUpsell: false,
      maxVisibleServices: 6,
      explanationCodes: []
    }
  },
  {
    name: 'CASE 2 — Degraded mode',
    input: {
      snapshot: { degraded: true, warningCodes: ['PRICING_UNAVAILABLE'], serviceCount: 6, slotCount: 5 },
      telemetry: { quoteLatencyMs: 300 },
      behavioral: { serviceOpenCount: 1, slotSelectionCount: 0, quoteRequestCount: 0, quoteFailureCount: 0, abandonmentRisk: 0.20 }
    },
    expected: {
      shouldReduceChoices: true,
      shouldEscalateToHuman: true,
      shouldHideLowConfidenceSlots: true,
      shouldOfferConciergeAssist: true,
      shouldSuppressAggressiveUpsell: true,
      maxVisibleServices: 3,
      explanationCodes: ['DEGRADED_MODE']
    }
  },
  {
    name: 'CASE 3 — High quote latency',
    input: {
      snapshot: { degraded: false, warningCodes: [], serviceCount: 6, slotCount: 5 },
      telemetry: { quoteLatencyMs: 1850 },
      behavioral: { serviceOpenCount: 1, slotSelectionCount: 0, quoteRequestCount: 0, quoteFailureCount: 0, abandonmentRisk: 0.30 }
    },
    expected: {
      shouldHideLowConfidenceSlots: true,
      shouldOfferConciergeAssist: true,
      shouldSuppressAggressiveUpsell: true,
      explanationCodes: ['HIGH_QUOTE_LATENCY']
    }
  },
  {
    name: 'CASE 4 — Quote failure',
    input: {
      snapshot: { degraded: false, warningCodes: [], serviceCount: 6, slotCount: 5 },
      telemetry: { quoteLatencyMs: 400 },
      behavioral: { serviceOpenCount: 1, slotSelectionCount: 0, quoteRequestCount: 0, quoteFailureCount: 1, abandonmentRisk: 0.35 }
    },
    expected: {
      shouldEscalateToHuman: true,
      shouldOfferConciergeAssist: true,
      shouldSuppressAggressiveUpsell: true,
      explanationCodes: ['QUOTE_FAILURE_DETECTED']
    }
  },
  {
    name: 'CASE 5 — Choice overload',
    input: {
      snapshot: { degraded: false, warningCodes: [], serviceCount: 6, slotCount: 5 },
      telemetry: { quoteLatencyMs: 200 },
      behavioral: { serviceOpenCount: 4, slotSelectionCount: 0, quoteRequestCount: 0, quoteFailureCount: 0, abandonmentRisk: 0.40 }
    },
    expected: {
      shouldReduceChoices: true,
      maxVisibleServices: 3,
      explanationCodes: ['MULTIPLE_SERVICE_OPENS']
    }
  },
  {
    name: 'CASE 6 — Low slot supply + urgency',
    input: {
      snapshot: { degraded: false, warningCodes: [], serviceCount: 6, slotCount: 1 },
      telemetry: { quoteLatencyMs: 200 },
      behavioral: { serviceOpenCount: 1, slotSelectionCount: 1, quoteRequestCount: 0, quoteFailureCount: 0, abandonmentRisk: 0.20 }
    },
    expected: {
      shouldShowUrgency: true,
      shouldHideLowConfidenceSlots: true,
      explanationCodes: ['LOW_SLOT_SUPPLY']
    }
  },
  {
    name: 'CASE 7 — High abandonment risk',
    input: {
      snapshot: { degraded: false, warningCodes: [], serviceCount: 6, slotCount: 5 },
      telemetry: { quoteLatencyMs: 900 },
      behavioral: { serviceOpenCount: 3, slotSelectionCount: 0, quoteRequestCount: 0, quoteFailureCount: 0, abandonmentRisk: 0.82 }
    },
    expected: {
      shouldReduceChoices: true,
      shouldEscalateToHuman: true,
      shouldOfferConciergeAssist: true,
      explanationCodes: ['MULTIPLE_SERVICE_OPENS', 'ABANDONMENT_RISK_HIGH']
    }
  },
  {
    name: 'CASE 8 — Severe combined stress',
    input: {
      snapshot: { degraded: true, warningCodes: [], serviceCount: 6, slotCount: 1 },
      telemetry: { quoteLatencyMs: 2100 },
      behavioral: { serviceOpenCount: 5, slotSelectionCount: 1, quoteRequestCount: 1, quoteFailureCount: 1, abandonmentRisk: 0.88 }
    },
    expected: {
      maxVisibleServices: 3,
      minSlotConfidence: 0.75,
      explanationCodes: [
        'DEGRADED_MODE',
        'HIGH_QUOTE_LATENCY',
        'MULTIPLE_SERVICE_OPENS',
        'LOW_SLOT_SUPPLY',
        'QUOTE_FAILURE_DETECTED',
        'ABANDONMENT_RISK_HIGH'
      ]
    }
  }
];

console.log('=== DECISION ENGINE V1.2 SMOKE TEST MATRIX ===\n');

let allPassed = true;

cases.forEach(c => {
  console.log(`--- ${c.name} ---`);
  console.log(`Input: quoteLatencyMs=${c.input.telemetry.quoteLatencyMs || 0}, degraded=${c.input.snapshot.degraded}, failureCount=${c.input.behavioral.quoteFailureCount}`);
  
  const output = deriveAutonomousConciergeDecision(c.input);
  
  let pass = true;
  const failedKeys = [];
  
  for (const [key, expectedValue] of Object.entries(c.expected)) {
    if (key === 'explanationCodes') {
      const hasAll = expectedValue.every(code => output.explanationCodes.includes(code));
      if (!hasAll) {
        pass = false;
        failedKeys.push(`${key} (Expected included: ${expectedValue.join(',')}, Got: ${output.explanationCodes.join(',')})`);
      }
    } else if (output[key] !== expectedValue) {
      pass = false;
      failedKeys.push(`${key} (Expected: ${expectedValue}, Got: ${output[key]})`);
    }
  }

  const outputSummary = Object.entries(output)
    .filter(([k, v]) => v === true || typeof v === 'number' || (Array.isArray(v) && v.length > 0))
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  console.log(`Output: ${outputSummary}`);
  console.log(`Reasons: ${output.explanationCodes.join('|') || '—'}`);
  
  if (pass) {
    console.log('✅ PASS\n');
  } else {
    console.log(`❌ FAIL: Mismatches -> ${failedKeys.join('; ')}\n`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('🏆 ALL MATRIX CASES PASSED. DECISION ADAPTER IS DETERMINISTIC.');
} else {
  console.log('🚨 MATRIX FAILURE. SOME CASES DID NOT MEET CONSTITUTIONAL REQUIREMENTS.');
}
