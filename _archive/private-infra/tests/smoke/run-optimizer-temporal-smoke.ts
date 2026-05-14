import { existsSync, promises as fs } from 'node:fs';
import { runWithPrivateServerBoundary } from './scripts/helpers/smoke-server-boundary.mjs';

runWithPrivateServerBoundary({
  context: 'Temporal Aggregated Optimizer Smoke Test',
  requiredPaths: [
    'server/core/experiments/optimizer/optimizer.memory.aggregate.file.ts',
    'server/core/experiments/optimizer/optimizer.temporal.adapter.ts'
  ],
  run: async () => {
    const { FileBackedAggregatedOptimizerMemory } = await import('./server/core/experiments/optimizer/optimizer.memory.aggregate.file.ts');
    const { TemporalAggregatedOptimizerAdapter } = await import('./server/core/experiments/optimizer/optimizer.temporal.adapter.ts');

    function assert(condition: unknown, message: string): void {
      if (!condition) {
        throw new Error(message);
      }
    }

    console.log('=== V2.5 TEMPORAL AGGREGATED OPTIMIZER SMOKE TEST ===');

    const filePath = './data/optimizer-aggregated-memory-test.json';

    if (existsSync(filePath)) {
      try {
        await fs.unlink(filePath);
      } catch {}
    }

    const memory = new FileBackedAggregatedOptimizerMemory(filePath);

    const now = Date.now();
    const staleDate = new Date(now - 10 * 24 * 3_600_000).toISOString();
    const freshDate = new Date(now - 2 * 3_600_000).toISOString();

    await memory.upsertAggregate({
      experimentId: 'exp_1',
      variantId: 'variant_a',
      contextKey: 'exp_1|segment:vip|device:mobile|latency:high|visitor:returning',
      level: 'exact',
      sampleCount: 12,
      avgUpliftScore: 22,
      avgRiskScore: 8,
      avgConfidenceScore: 91,
      avgFinalScore: 18,
      lastEvaluatedAt: staleDate,
      updatedAt: new Date().toISOString(),
    });

    await memory.upsertAggregate({
      experimentId: 'exp_1',
      variantId: 'variant_b',
      contextKey: 'exp_1|segment:vip|device:mobile|latency:high|visitor:returning',
      level: 'exact',
      sampleCount: 10,
      avgUpliftScore: 18,
      avgRiskScore: 6,
      avgConfidenceScore: 89,
      avgFinalScore: 16,
      lastEvaluatedAt: freshDate,
      updatedAt: new Date().toISOString(),
    });

    const adapter = new TemporalAggregatedOptimizerAdapter(memory, {
      minSamplesRequired: 2,
      minAverageConfidenceRequired: 60,
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
          title: 'Older strong memory',
          summary: 'Historically strong but stale.',
          baseScore: 80,
          recommendationFamily: 'conversion_copy',
        },
        {
          recommendationId: 'r2',
          experimentId: 'exp_1',
          variantId: 'variant_b',
          title: 'Fresh strong memory',
          summary: 'Slightly lower historic score but recent.',
          baseScore: 80,
          recommendationFamily: 'conversion_copy',
        },
      ],
    });

    const top = result.ranked[0];

    assert(
      top.variantId === 'variant_b',
      `Expected fresh variant_b to outrank stale variant_a, got ${top.variantId}`
    );

    assert(
      top.temporalMemory.recencyWeight >= 0.8,
      `Expected fresh record recency weight >= 0.8, got ${top.temporalMemory.recencyWeight}`
    );

    console.log('🏆 V2.5 TEMPORAL AGGREGATED OPTIMIZER SMOKE TEST PASSED');
  }
});

