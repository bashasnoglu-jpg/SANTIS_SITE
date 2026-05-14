import { existsSync, promises as fs } from 'node:fs';
import { runWithPrivateServerBoundary } from './scripts/helpers/smoke-server-boundary.mjs';

runWithPrivateServerBoundary({
  context: 'Learning Guard Smoke Test',
  requiredPaths: [
    'server/core/experiments/optimizer/optimizer.context.memory.file.ts',
    'server/core/experiments/optimizer/optimizer.learning.pipeline.ts'
  ],
  run: async () => {
    const { FileBackedContextualOptimizerMemory } = await import('./server/core/experiments/optimizer/optimizer.context.memory.file.ts');
    const { OptimizerLearningPipeline } = await import('./server/core/experiments/optimizer/optimizer.learning.pipeline.ts');

    function assert(condition: unknown, message: string): void {
      if (!condition) {
        throw new Error(message);
      }
    }

    console.log('=== V2.4 LEARNING GUARD SMOKE TEST ===');

    const filePath = './data/optimizer-learning-guard-test.json';

    if (existsSync(filePath)) {
      try {
        await fs.unlink(filePath);
      } catch {}
    }

    const memory = new FileBackedContextualOptimizerMemory(filePath);

    const pipeline = new OptimizerLearningPipeline(memory, {
      minSamplesRequired: 5,
      minConfidenceRequired: 60,
      maxRiskAllowed: 80,
      maxAbsoluteUpliftAllowed: 100,
      maxAbsoluteFinalScoreAllowed: 100,
    });

    const rejected = await pipeline.process({
      observedSampleCount: 2,
      score: {
        experimentId: 'exp_1',
        variantId: 'variant_a',
        contextKey: 'exp_1|segment:vip|device:mobile',
        context: {
          segment: 'vip',
          device: 'mobile',
          latencyTier: 'high',
          visitorType: 'returning',
        },
        upliftScore: 18,
        riskScore: 10,
        confidenceScore: 82,
        finalScore: 14,
        evaluatedAt: new Date().toISOString(),
      },
    } as any);

    assert(rejected.accepted === false, 'Expected low-sample score to be rejected.');
    assert(
      rejected.reasons.includes('insufficient_samples'),
      'Expected insufficient_samples rejection reason.'
    );

    const anomalyRejected = await pipeline.process({
      observedSampleCount: 12,
      score: {
        experimentId: 'exp_1',
        variantId: 'variant_b',
        contextKey: 'exp_1|segment:vip|device:desktop',
        context: {
          segment: 'vip',
          device: 'desktop',
          latencyTier: 'low',
          visitorType: 'returning',
        },
        upliftScore: 240,
        riskScore: 12,
        confidenceScore: 90,
        finalScore: 180,
        evaluatedAt: new Date().toISOString(),
      },
    } as any);

    assert(anomalyRejected.accepted === false, 'Expected anomaly score to be rejected.');
    assert(
      anomalyRejected.reasons.includes('uplift_anomaly'),
      'Expected uplift_anomaly rejection reason.'
    );

    const accepted = await pipeline.process({
      observedSampleCount: 9,
      score: {
        experimentId: 'exp_1',
        variantId: 'variant_c',
        contextKey: 'exp_1|segment:vip|device:mobile',
        context: {
          segment: 'vip',
          device: 'mobile',
          latencyTier: 'medium',
          visitorType: 'unknown',
        },
        upliftScore: 15,
        riskScore: 8,
        confidenceScore: 86,
        finalScore: 12,
        evaluatedAt: new Date().toISOString(),
      },
    } as any);

    assert(accepted.accepted === true, 'Expected valid score to be accepted.');
    assert(accepted.persisted === true, 'Expected valid score to be persisted.');

    const stored = await memory.getScoresByContextKey('exp_1|segment:vip|device:mobile');

    assert(stored.length === 1, `Expected exactly 1 persisted score, got ${stored.length}`);

    console.log('🏆 V2.4 LEARNING GUARD SMOKE TEST PASSED');
  }
});

