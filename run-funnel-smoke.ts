import { deriveAdaptiveRevenueFunnel } from './admin-panel/src/lib/adaptive-funnel/funnel.adapter.ts';

const mockServices = [
  { id: 'svc_1', title: 'Signature Hamam', category: 'HAMAM', price: 150, compareAtPrice: 180, availabilityScore: 0.9, recommended: true },
  { id: 'svc_2', title: 'Deep Tissue', category: 'MASSAGE', price: 120, compareAtPrice: null, availabilityScore: 0.8 },
  { id: 'svc_3', title: 'Aromatherapy', category: 'MASSAGE', price: 110, compareAtPrice: 130, availabilityScore: 0.6 },
  { id: 'svc_4', title: 'Facial Ritual', category: 'SKINCARE', price: 90, compareAtPrice: null, availabilityScore: 0.5 },
];

const mockSlots = [
  { serviceId: 'svc_1', confidence: 0.9, rankScore: 0.95 },
  { serviceId: 'svc_1', confidence: 0.8, rankScore: 0.85 },
  { serviceId: 'svc_2', confidence: 0.7, rankScore: 0.75 },
];

const cases = [
  {
    name: 'CASE A — Healthy premium funnel',
    input: {
      snapshot: { degraded: false, warningCodes: [], services: mockServices, slots: mockSlots },
      telemetry: { quoteLatencyMs: 250 },
      behavioral: { serviceOpenCount: 0, slotSelectionCount: 0, quoteRequestCount: 0, quoteFailureCount: 0, abandonmentRisk: 0.1 },
      decision: { shouldReduceChoices: false, shouldEscalateToHuman: false, shouldOfferConciergeAssist: false, shouldSuppressAggressiveUpsell: false }
    },
    expected: {
      shouldShowRevenuePriorityBanner: true,
      shouldShowAnchorPrice: true,
      shouldEmphasizeConciergePath: false,
      shouldShowUrgencyBar: false,
      promotedServiceId: 'svc_1'
    }
  },
  {
    name: 'CASE B — Degraded fallback funnel',
    input: {
      snapshot: { degraded: true, warningCodes: ['PRICING_UNSTABLE'], services: mockServices, slots: mockSlots },
      telemetry: { quoteLatencyMs: 400 },
      behavioral: { serviceOpenCount: 0, slotSelectionCount: 0, quoteRequestCount: 0, quoteFailureCount: 0, abandonmentRisk: 0.2 },
      decision: { shouldReduceChoices: true, shouldEscalateToHuman: true, shouldOfferConciergeAssist: true, shouldSuppressAggressiveUpsell: true }
    },
    expected: {
      shouldShowRevenuePriorityBanner: false,
      shouldShowAnchorPrice: false,
      shouldEmphasizeConciergePath: true,
      shouldUseCompactLayout: true,
      explanationCodes: ['CONCIERGE_PATH_EMPHASIZED', 'CHOICE_COMPRESSION_ACTIVE', 'HIGH_VALUE_SERVICE_PROMOTED', 'UPSSELL_SUPPRESSED', 'DEGRADED_FUNNEL_FALLBACK']
    }
  },
  {
    name: 'CASE C — High abandonment',
    input: {
      snapshot: { degraded: false, warningCodes: [], services: mockServices, slots: mockSlots },
      telemetry: { quoteLatencyMs: 900 },
      behavioral: { serviceOpenCount: 4, slotSelectionCount: 1, quoteRequestCount: 1, quoteFailureCount: 0, abandonmentRisk: 0.85 },
      decision: { shouldReduceChoices: true, shouldEscalateToHuman: true, shouldOfferConciergeAssist: true, shouldSuppressAggressiveUpsell: false }
    },
    expected: {
      shouldEmphasizeConciergePath: true,
      shouldUseCompactLayout: true,
      hiddenServiceIdsLength: 1
    }
  },
  {
    name: 'CASE D — Low slot urgency',
    input: {
      snapshot: { degraded: false, warningCodes: [], services: mockServices, slots: [{ serviceId: 'svc_1' }] },
      telemetry: { quoteLatencyMs: 300 },
      behavioral: { serviceOpenCount: 1, slotSelectionCount: 1, quoteRequestCount: 0, quoteFailureCount: 0, abandonmentRisk: 0.15 },
      decision: { shouldReduceChoices: false, shouldEscalateToHuman: false, shouldOfferConciergeAssist: false, shouldSuppressAggressiveUpsell: false }
    },
    expected: {
      shouldShowUrgencyBar: true,
      shouldShowRevenuePriorityBanner: true,
      shouldEmphasizeConciergePath: false
    }
  }
];

console.log('=== ADAPTIVE REVENUE FUNNEL V1.3 SMOKE TEST ===\n');

let allPassed = true;

cases.forEach(c => {
  console.log(`--- ${c.name} ---`);
  
  const output = deriveAdaptiveRevenueFunnel(c.input);
  
  let pass = true;
  const failedKeys = [];
  
  for (const [key, expectedValue] of Object.entries(c.expected)) {
    if (key === 'explanationCodes') {
      const hasAll = expectedValue.every(code => output.explanationCodes.includes(code));
      if (!hasAll) {
        pass = false;
        failedKeys.push(`${key} (Expected included: ${expectedValue.join(',')}, Got: ${output.explanationCodes.join(',')})`);
      }
    } else if (key === 'hiddenServiceIdsLength') {
        if (output.hiddenServiceIds.length !== expectedValue) {
            pass = false;
            failedKeys.push(`${key} (Expected: ${expectedValue}, Got: ${output.hiddenServiceIds.length})`);
        }
    } else if (output[key] !== expectedValue) {
      pass = false;
      failedKeys.push(`${key} (Expected: ${expectedValue}, Got: ${output[key]})`);
    }
  }

  const outputSummary = Object.entries(output)
    .filter(([k, v]) => v === true || typeof v === 'number' || typeof v === 'string' || (Array.isArray(v) && v.length > 0))
    .map(([k, v]) => {
      if (k === 'orderedServiceIds' || k === 'hiddenServiceIds') return `${k}=[${v.length} items]`;
      return `${k}=${v}`;
    })
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
  console.log('🏆 ALL FUNNEL MATRIX CASES PASSED. ADAPTIVE FUNNEL IS DETERMINISTIC.');
} else {
  console.log('🚨 FUNNEL MATRIX FAILURE. SOME CASES DID NOT MEET CONSTITUTIONAL REQUIREMENTS.');
}
