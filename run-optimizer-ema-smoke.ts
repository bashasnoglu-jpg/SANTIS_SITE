import { existsSync, promises as fs } from 'node:fs';
import { runWithPrivateServerBoundary } from './scripts/helpers/smoke-server-boundary.mjs';

runWithPrivateServerBoundary({
  context: 'EMA Exponential Decay Smoke Test',
  requiredPaths: [
    'server/core/experiments/optimizer/optimizer.memory.aggregate.ema.file.ts',
    'server/core/experiments/optimizer/optimizer.temporal.ema.adapter.ts'
  ],
  run: async () => {
    const { FileBackedEMAOptimizerMemory } = await import('./server/core/experiments/optimizer/optimizer.memory.aggregate.ema.file.ts');
    const { TemporalEMAOptimizerAdapter } = await import('./server/core/experiments/optimizer/optimizer.temporal.ema.adapter.ts');

    function assert(condition: unknown, message: string): void {
      if (!condition) {
        throw new Error(message);
      }
    }

    console.log('=== V2.6 EMA EXPONENTIAL DECAY SMOKE TEST ===');

    const filePath = './data/optimizer-ema-memory-test.json';

    if (existsSync(filePath)) {
      try { await fs.unlink(filePath); } catch {}
    }

    const memory = new FileBackedEMAOptimizerMemory(filePath, 0.2); // alpha = 0.2

    const now = Date.now();
    const staleDate = new Date(now - 48 * 3_600_000).toISOString(); // 48 saat once
    const freshDate = new Date(now - 1 * 3_360_000).toISOString(); // 1 saat once

    // Eski ama cok guclu kayit
    await memory.merge({
      experimentId: 'exp_1',
      variantId: 'variant_a',
      contextKey: 'exp_1|segment:vip|device:mobile|latency:high|visitor:returning',
      level: 'exact',
      signal: { uplift: 40, risk: 2, confidence: 95, final: 38, evaluatedAt: staleDate }
    });

    // Taze ama zayif trend - surekli geliyor
    await memory.merge({
      experimentId: 'exp_1',
      variantId: 'variant_b',
      contextKey: 'exp_1|segment:vip|device:mobile|latency:high|visitor:returning',
      level: 'exact',
      signal: { uplift: 10, risk: 8, confidence: 80, final: 8, evaluatedAt: staleDate } // Ilk kayit
    });

    // Sonrasinda yeni gerceklige akiyor...
    await memory.merge({
      experimentId: 'exp_1',
      variantId: 'variant_b',
      contextKey: 'exp_1|segment:vip|device:mobile|latency:high|visitor:returning',
      level: 'exact',
      signal: { uplift: 12, risk: 8, confidence: 82, final: 10, evaluatedAt: freshDate }
    });

    const adapter = new TemporalEMAOptimizerAdapter(memory, {
      minSamplesRequired: 1,
      minAverageConfidenceRequired: 50,
    });

    const result = await adapter.adaptRecommendations({
      context: {
        segment: 'vip',
        device: 'mobile',
        latencyTier: 'high',
        visitorType: 'returning',
      },
      candidates: [
        {
          recommendationId: 'r1',
          experimentId: 'exp_1',
          variantId: 'variant_a',
          title: 'Decayed Strong Memory',
          summary: 'Was strong 2 days ago',
          baseScore: 80,
          recommendationFamily: 'conversion_copy',
        },
        {
          recommendationId: 'r2',
          experimentId: 'exp_1',
          variantId: 'variant_b',
          title: 'Fresh EMA Trending Memory',
          summary: 'Adaptive trend',
          baseScore: 80,
          recommendationFamily: 'conversion_copy',
        },
      ],
    });

    const top = result.ranked[0];
    const second = result.ranked[1];

    console.log(`Rank 1: ${top.variantId} (Score: ${top.adjustedScore.toFixed(2)}, Decay: ${top.temporalMemory.decayWeight.toFixed(2)})`);
    console.log(`Rank 2: ${second.variantId} (Score: ${second.adjustedScore.toFixed(2)}, Decay: ${second.temporalMemory.decayWeight.toFixed(2)})`);

    assert(
      top.variantId === 'variant_b',
      `Expected fresh trending variant_b to outrank decayed variant_a, got ${top.variantId}`
    );

    assert(
      top.temporalMemory.decayWeight > second.temporalMemory.decayWeight,
      `Expected variant_b to have higher decay weight (fresher) than variant_a`
    );

    console.log('🏆 V2.6 EMA EXPONENTIAL DECAY SMOKE TEST PASSED');
  }
});

