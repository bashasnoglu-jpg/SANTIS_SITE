import { runWithPrivateServerBoundary } from './scripts/helpers/smoke-server-boundary.mjs';

runWithPrivateServerBoundary({
  context: 'Bandit Optimizer Smoke Test',
  requiredPaths: [
    'server/core/experiments/optimizer/optimizer.bandit.adapter.ts'
  ],
  run: async () => {
    const { OptimizerBanditAdapter } = await import('./server/core/experiments/optimizer/optimizer.bandit.adapter.ts');

    function assert(condition: unknown, message: string): void {
      if (!condition) {
        throw new Error(message);
      }
    }

    console.log('=== V2.7 BANDIT SMOKE TEST ===');

    const adapter = new OptimizerBanditAdapter({
      strategy: 'thompson_sampling',
      thompsonPriorAlpha: 1,
      thompsonPriorBeta: 1,
      ucbExplorationConstant: 1.4,
      maxExplorationBonus: 0.2,
      minLearnedWeightForExploration: 0.55,
    });

    const ranked = adapter.adaptRecommendations({
      requestSeed: 'smoke-test-seed',
      candidates: [
        {
          recommendationId: 'r1',
          experimentId: 'exp_1',
          variantId: 'variant_a',
          title: 'Mature winner',
          summary: 'Strong historical performer.',
          recommendationFamily: 'conversion_copy',
          baseScore: 80,
          adjustedScore: 88,
          memory: {
            learnedWeight: 0.82,
            memoryScoreCount: 120,
          },
        },
        {
          recommendationId: 'r2',
          experimentId: 'exp_1',
          variantId: 'variant_b',
          title: 'Promising challenger',
          summary: 'Fewer samples but strong potential.',
          recommendationFamily: 'conversion_copy',
          baseScore: 79,
          adjustedScore: 84,
          memory: {
            learnedWeight: 0.79,
            memoryScoreCount: 8,
          },
        },
        {
          recommendationId: 'r3',
          experimentId: 'exp_1',
          variantId: 'variant_c',
          title: 'Weak arm',
          summary: 'Low quality arm.',
          recommendationFamily: 'conversion_copy',
          baseScore: 78,
          adjustedScore: 75,
          memory: {
            learnedWeight: 0.41,
            memoryScoreCount: 3,
          },
        },
      ],
    } as any);

    const promising = ranked.find((x: any) => x.variantId === 'variant_b');
    const weak = ranked.find((x: any) => x.variantId === 'variant_c');

    assert(ranked.length === 3, 'Expected 3 ranked candidates.');
    assert(!!promising, 'Expected promising challenger to exist.');
    assert(!!weak, 'Expected weak arm to exist.');
    assert(
      (promising?.bandit.explorationScore ?? 0) > 0,
      'Expected promising challenger to receive exploration bonus.'
    );
    assert(
      (weak?.bandit.explorationScore ?? 0) === 0,
      'Expected weak arm to receive no exploration bonus.'
    );

    console.log(
      ranked.map((item: any, index: number) => ({
        rank: index + 1,
        variantId: item.variantId,
        finalBanditScore: Number(item.finalBanditScore.toFixed(2)),
        exploitation: Number(item.bandit.exploitationScore.toFixed(2)),
        exploration: Number(item.bandit.explorationScore.toFixed(2)),
        posterior: Number(item.bandit.posteriorScore.toFixed(2)),
      }))
    );

    console.log('🏆 V2.7 BANDIT SMOKE TEST PASSED');
  }
});

