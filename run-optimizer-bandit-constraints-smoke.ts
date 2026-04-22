import { ConstraintAwareBanditAdapter } from './server/core/experiments/optimizer/optimizer.bandit.constraint-aware.adapter.ts';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function run(): void {
  console.log('=== V2.8 CONSTRAINT-AWARE BANDIT SMOKE TEST ===');

  const adapter = new ConstraintAwareBanditAdapter({
    maxRiskScoreAllowed: 30,
    maxTrafficSharePerVariant: 0.25,
    maxWinnersPerFamily: 1,
    minGuardrailScoreRequired: 0.8,
  });

  const result = adapter.adaptRecommendations([
    {
      recommendationId: 'r1',
      experimentId: 'exp_1',
      variantId: 'variant_a',
      title: 'Safe primary winner',
      summary: 'Good score and safe.',
      recommendationFamily: 'conversion_copy',
      baseScore: 80,
      adjustedScore: 90,
      finalBanditScore: 96,
      bandit: {
        strategy: 'thompson_sampling',
        sampleCount: 120,
        exploitationScore: 0.84,
        explorationScore: 0.08,
        posteriorScore: 0.85,
      },
      constraintSignals: {
        riskScore: 12,
        projectedTrafficShare: 0.24,
        liveGuardrailScore: 0.92,
      },
    },
    {
      recommendationId: 'r2',
      experimentId: 'exp_1',
      variantId: 'variant_b',
      title: 'Same family contender',
      summary: 'Should be blocked by family fairness.',
      recommendationFamily: 'conversion_copy',
      baseScore: 79,
      adjustedScore: 89,
      finalBanditScore: 95,
      bandit: {
        strategy: 'thompson_sampling',
        sampleCount: 50,
        exploitationScore: 0.82,
        explorationScore: 0.12,
        posteriorScore: 0.83,
      },
      constraintSignals: {
        riskScore: 14,
        projectedTrafficShare: 0.2,
        liveGuardrailScore: 0.9,
      },
    },
    {
      recommendationId: 'r3',
      experimentId: 'exp_1',
      variantId: 'variant_c',
      title: 'Risky candidate',
      summary: 'Too risky.',
      recommendationFamily: 'layout_density',
      baseScore: 78,
      adjustedScore: 88,
      finalBanditScore: 94,
      bandit: {
        strategy: 'thompson_sampling',
        sampleCount: 30,
        exploitationScore: 0.81,
        explorationScore: 0.1,
        posteriorScore: 0.82,
      },
      constraintSignals: {
        riskScore: 45,
        projectedTrafficShare: 0.1,
        liveGuardrailScore: 0.94,
      },
    },
    {
      recommendationId: 'r4',
      experimentId: 'exp_1',
      variantId: 'variant_d',
      title: 'Traffic cap violator',
      summary: 'Would take too much traffic.',
      recommendationFamily: 'hero_layout',
      baseScore: 77,
      adjustedScore: 87,
      finalBanditScore: 93,
      bandit: {
        strategy: 'thompson_sampling',
        sampleCount: 40,
        exploitationScore: 0.8,
        explorationScore: 0.11,
        posteriorScore: 0.81,
      },
      constraintSignals: {
        riskScore: 10,
        projectedTrafficShare: 0.31,
        liveGuardrailScore: 0.89,
      },
    },
    {
      recommendationId: 'r5',
      experimentId: 'exp_1',
      variantId: 'variant_e',
      title: 'Guardrail failure',
      summary: 'Live KPI too weak.',
      recommendationFamily: 'checkout_flow',
      baseScore: 76,
      adjustedScore: 86,
      finalBanditScore: 92,
      bandit: {
        strategy: 'thompson_sampling',
        sampleCount: 60,
        exploitationScore: 0.79,
        explorationScore: 0.09,
        posteriorScore: 0.8,
      },
      constraintSignals: {
        riskScore: 8,
        projectedTrafficShare: 0.15,
        liveGuardrailScore: 0.62,
      },
    },
  ]);

  const safeWinner = result.ranked.find((item) => item.variantId === 'variant_a');
  const sameFamily = result.ranked.find((item) => item.variantId === 'variant_b');
  const risky = result.ranked.find((item) => item.variantId === 'variant_c');
  const traffic = result.ranked.find((item) => item.variantId === 'variant_d');
  const guardrail = result.ranked.find((item) => item.variantId === 'variant_e');

  assert(safeWinner?.constraints.allowed === true, 'Expected variant_a to be allowed.');

  assert(
    sameFamily?.constraints.blockedReasons.includes('family_fairness_exceeded'),
    'Expected variant_b to be blocked by family fairness.'
  );

  assert(
    risky?.constraints.blockedReasons.includes('risk_ceiling_exceeded'),
    'Expected variant_c to be blocked by risk ceiling.'
  );

  assert(
    traffic?.constraints.blockedReasons.includes('traffic_cap_exceeded'),
    'Expected variant_d to be blocked by traffic cap.'
  );

  assert(
    guardrail?.constraints.blockedReasons.includes('guardrail_score_too_low'),
    'Expected variant_e to be blocked by guardrail score.'
  );

  console.log(
    result.ranked.map((item, index) => ({
      rank: index + 1,
      variantId: item.variantId,
      finalBanditScore: Number(item.finalBanditScore.toFixed(2)),
      allowed: item.constraints.allowed,
      blockedReasons: item.constraints.blockedReasons,
    }))
  );

  console.log(result.telemetry.summary);

  console.log('🏆 V2.8 CONSTRAINT-AWARE BANDIT SMOKE TEST PASSED');
}

run();
