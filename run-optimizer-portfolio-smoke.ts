import { runWithPrivateServerBoundary } from './scripts/helpers/smoke-server-boundary.mjs';

runWithPrivateServerBoundary({
  context: 'Portfolio Optimization Smoke Test',
  requiredPaths: [
    'server/core/experiments/optimizer/optimizer.portfolio.adapter.ts'
  ],
  run: async () => {
    const { OptimizerPortfolioAdapter } = await import('./server/core/experiments/optimizer/optimizer.portfolio.adapter.ts');

    function assert(condition: unknown, message: string): void {
      if (!condition) {
        throw new Error(message);
      }
    }

    console.log('=== V2.9 PORTFOLIO OPTIMIZATION SMOKE TEST ===');

    const adapter = new OptimizerPortfolioAdapter({
      maxPortfolioSize: 3,
      maxTotalRiskScore: 45,
      maxPerFamily: 1,
      diversityPenaltyPerExtraFamilyMember: 12,
      blockedCandidatePenalty: 1000,
    });

    const result = adapter.adaptRecommendations({
      candidates: [
        {
          recommendationId: 'r1',
          experimentId: 'exp_1',
          variantId: 'variant_a',
          title: 'Primary safe winner',
          summary: 'High value conversion copy winner.',
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
          constraints: {
            allowed: true,
            blockedReasons: [],
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
          title: 'Same family shadow candidate',
          summary: 'Would reduce diversity.',
          recommendationFamily: 'conversion_copy',
          baseScore: 79,
          adjustedScore: 89,
          finalBanditScore: 95,
          bandit: {
            strategy: 'thompson_sampling',
            sampleCount: 80,
            exploitationScore: 0.82,
            explorationScore: 0.1,
            posteriorScore: 0.83,
          },
          constraints: {
            allowed: true,
            blockedReasons: [],
          },
          constraintSignals: {
            riskScore: 10,
            projectedTrafficShare: 0.18,
            liveGuardrailScore: 0.9,
          },
        },
        {
          recommendationId: 'r3',
          experimentId: 'exp_1',
          variantId: 'variant_c',
          title: 'Layout winner',
          summary: 'Strong complementary layout play.',
          recommendationFamily: 'layout_density',
          baseScore: 78,
          adjustedScore: 88,
          finalBanditScore: 91,
          bandit: {
            strategy: 'thompson_sampling',
            sampleCount: 60,
            exploitationScore: 0.8,
            explorationScore: 0.09,
            posteriorScore: 0.81,
          },
          constraints: {
            allowed: true,
            blockedReasons: [],
          },
          constraintSignals: {
            riskScore: 14,
            projectedTrafficShare: 0.16,
            liveGuardrailScore: 0.91,
          },
        },
        {
          recommendationId: 'r4',
          experimentId: 'exp_1',
          variantId: 'variant_d',
          title: 'Checkout helper',
          summary: 'Adds a different family and acceptable risk.',
          recommendationFamily: 'checkout_flow',
          baseScore: 77,
          adjustedScore: 87,
          finalBanditScore: 89,
          bandit: {
            strategy: 'thompson_sampling',
            sampleCount: 55,
            exploitationScore: 0.79,
            explorationScore: 0.08,
            posteriorScore: 0.8,
          },
          constraints: {
            allowed: true,
            blockedReasons: [],
          },
          constraintSignals: {
            riskScore: 15,
            projectedTrafficShare: 0.14,
            liveGuardrailScore: 0.89,
          },
        },
        {
          recommendationId: 'r5',
          experimentId: 'exp_1',
          variantId: 'variant_e',
          title: 'Blocked risky option',
          summary: 'Should never enter the slate.',
          recommendationFamily: 'hero_layout',
          baseScore: 76,
          adjustedScore: 86,
          finalBanditScore: 93,
          bandit: {
            strategy: 'thompson_sampling',
            sampleCount: 70,
            exploitationScore: 0.81,
            explorationScore: 0.09,
            posteriorScore: 0.82,
          },
          constraints: {
            allowed: false,
            blockedReasons: ['risk_ceiling_exceeded'],
          },
          constraintSignals: {
            riskScore: 40,
            projectedTrafficShare: 0.1,
            liveGuardrailScore: 0.95,
          },
        },
      ],
    } as any);

    console.log(
      result.ranked.map((item: any, index: number) => ({
        rank: index + 1,
        variantId: item.variantId,
        family: item.recommendationFamily,
        selected: item.portfolio.selected,
        marginalGain: Number(item.portfolio.marginalGain.toFixed(2)),
        reason: item.portfolio.selectionReason.type,
      }))
    );

    console.log(result.summary);

    assert(result.selected.length === 3, 'Expected exactly 3 selected portfolio items.');

    const selectedIds = result.selected.map((item: any) => item.variantId);

    assert(selectedIds.includes('variant_a'), 'Expected variant_a to be selected.');
    assert(selectedIds.includes('variant_c'), 'Expected variant_c to be selected.');
    assert(selectedIds.includes('variant_d'), 'Expected variant_d to be selected.');

    assert(
      !selectedIds.includes('variant_b'),
      'Expected same-family variant_b to be excluded.'
    );

    assert(
      !selectedIds.includes('variant_e'),
      'Expected blocked variant_e to be excluded.'
    );

    assert(
      result.summary.totalRiskScore <= 45,
      `Expected total risk <= 45, got ${result.summary.totalRiskScore}`
    );

    console.log('🏆 V2.9 PORTFOLIO OPTIMIZATION SMOKE TEST PASSED');
  }
});

