import { deriveAutonomousActions } from './admin-panel/src/lib/autonomous-actions/actions.adapter.ts';

const baseInput = {
  requestId: 'req_123',
  decision: {
    shouldReduceChoices: false,
    shouldEscalateToHuman: false,
    shouldHideLowConfidenceSlots: false,
    shouldOfferConciergeAssist: false,
    shouldSuppressAggressiveUpsell: false,
    maxVisibleServices: 6,
    minSlotConfidence: 0.55,
    explanationCodes: [],
  },
  funnel: {
    hiddenServiceIds: [],
    shouldShowUrgencyBar: false,
    shouldShowAnchorPrice: true,
    shouldEmphasizeConciergePath: false,
    shouldUseCompactLayout: false,
    explanationCodes: [],
  },
  telemetry: {
    quoteLatencyMs: 250,
    degraded: false,
  },
};

const cases = [
  {
    name: 'CASE A — high latency action',
    input: {
      ...baseInput,
      decision: { ...baseInput.decision, shouldSuppressAggressiveUpsell: true },
      telemetry: { quoteLatencyMs: 1800, degraded: false, lastEvent: 'QUOTE_RECEIVED' },
    },
    expected: {
      actionsIncludes: ['SHOW_QUOTE_RECOVERY_BANNER', 'SUPPRESS_UPSELLS'],
    }
  },
  {
    name: 'CASE B — degraded assist action',
    input: {
      ...baseInput,
      decision: { 
        ...baseInput.decision, 
        shouldEscalateToHuman: true, 
        shouldHideLowConfidenceSlots: true 
      },
      funnel: {
        ...baseInput.funnel,
        shouldEmphasizeConciergePath: true
      },
      telemetry: { quoteLatencyMs: 350, degraded: true, lastEvent: 'QUOTE_REQUESTED' },
    },
    expected: {
      actionsIncludes: ['SHOW_CONCIERGE_PRIORITY_CTA', 'SUGGEST_HUMAN_ESCALATION', 'HIDE_LOW_CONFIDENCE_SLOTS'],
    }
  },
  {
    name: 'CASE C — choice compression action',
    input: {
      ...baseInput,
      decision: { ...baseInput.decision, shouldReduceChoices: true },
      funnel: { ...baseInput.funnel, hiddenServiceIds: ['svc_4', 'svc_5'], shouldUseCompactLayout: true },
    },
    expected: {
      actionsIncludes: ['REORDER_SERVICES', 'ENABLE_COMPACT_LAYOUT'],
    }
  },
  {
    name: 'CASE D — healthy premium action',
    input: {
      ...baseInput,
    },
    expected: {
      actionsLength: 0,
    }
  }
];

console.log('=== AUTONOMOUS ACTIONS V1.4 SMOKE TEST ===\n');

let allPassed = true;

cases.forEach(c => {
  console.log(`--- ${c.name} ---`);
  
  const output = deriveAutonomousActions(c.input);
  
  let pass = true;
  const failedKeys = [];
  
  for (const [key, expectedValue] of Object.entries(c.expected)) {
    if (key === 'actionsIncludes') {
      const actualTypes = output.map(a => a.type);
      const hasAll = expectedValue.every(type => actualTypes.includes(type));
      if (!hasAll) {
        pass = false;
        failedKeys.push(`Expected actions to include [${expectedValue.join(', ')}], got [${actualTypes.join(', ')}]`);
      }
    } else if (key === 'actionsLength') {
      if (output.length !== expectedValue) {
        pass = false;
        failedKeys.push(`Expected ${expectedValue} actions, got ${output.length}`);
      }
    }
  }

  const outputSummary = output.length > 0 
    ? output.map(a => `${a.type}(${a.autoExecutable ? 'AUTO' : 'ADVISE'})`).join(', ')
    : 'NO_ACTIONS_GENERATED';

  console.log(`Output: ${outputSummary}`);
  
  if (pass) {
    console.log('✅ PASS\n');
  } else {
    console.log(`❌ FAIL: Mismatches -> ${failedKeys.join('; ')}\n`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('🏆 ALL ACTIONS MATRIX CASES PASSED. THE SYSTEM GOVERNS SAFELY.');
} else {
  console.log('🚨 ACTIONS MATRIX FAILURE. AUTONOMY HAS ESCAPED CONSTITUTIONAL BOUNDARIES.');
}
