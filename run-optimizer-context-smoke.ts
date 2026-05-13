import { existsSync, promises as fs } from 'node:fs';
import { runWithPrivateServerBoundary } from './scripts/helpers/smoke-server-boundary.mjs';

runWithPrivateServerBoundary({
  context: 'Contextual Optimizer Smoke Test',
  requiredPaths: [
    'server/core/experiments/optimizer/optimizer.context.memory.file.ts',
    'server/core/experiments/optimizer/optimizer.context.adapter.ts',
    'server/core/experiments/optimizer/optimizer.context.key.ts'
  ],
  run: async () => {
    const { FileBackedContextualOptimizerMemory } = await import('./server/core/experiments/optimizer/optimizer.context.memory.file.ts');
    const { ContextualOptimizerAdapter } = await import('./server/core/experiments/optimizer/optimizer.context.adapter.ts');
    const { buildContextKey } = await import('./server/core/experiments/optimizer/optimizer.context.key.ts');

    function assert(condition: unknown, message: string): void {
      if (!condition) {
        throw new Error(message);
      }
    }

    console.log('=== V2.2 CONTEXTUAL OPTIMIZER SMOKE TEST ===');

    const filePath = './data/optimizer-context-memory-test.json';

    if (existsSync(filePath)) {
      await fs.unlink(filePath);
    }

    const memory = new FileBackedContextualOptimizerMemory(filePath);

    const vipMobileContext = {
      segment: 'vip',
      device: 'mobile',
      latencyTier: 'high',
      visitorType: 'returning',
    } as const;

    const standardDesktopContext = {
      segment: 'standard',
      device: 'desktop',
      latencyTier: 'low',
      visitorType: 'first_time',
    } as const;

    await memory.append({
      experimentId: 'exp_1',
      variantId: 'variant_a',
      contextKey: buildContextKey('exp_1', vipMobileContext as any),
      context: vipMobileContext as any,
      upliftScore: 18,
      riskScore: 2,
      confidenceScore: 93,
      finalScore: 14,
      evaluatedAt: new Date().toISOString(),
    });

    await memory.append({
      experimentId: 'exp_1',
      variantId: 'variant_b',
      contextKey: buildContextKey('exp_1', standardDesktopContext as any),
      context: standardDesktopContext as any,
      upliftScore: 20,
      riskScore: 1,
      confidenceScore: 95,
      finalScore: 18,
      evaluatedAt: new Date().toISOString(),
    });

    const adapter = new ContextualOptimizerAdapter(memory);

    const vipResult = await adapter.adaptRecommendations({
      context: vipMobileContext as any,
      candidates: [
        {
          recommendationId: 'r1',
          experimentId: 'exp_1',
          variantId: 'variant_a',
          title: 'VIP mobile calming copy',
          summary: 'Stabilize high-latency luxury mobile flow.',
          baseScore: 80,
          recommendationFamily: 'conversion_copy',
        },
        {
          recommendationId: 'r2',
          experimentId: 'exp_1',
          variantId: 'variant_b',
          title: 'Dense desktop grid',
          summary: 'Increase above-the-fold service density.',
          baseScore: 82,
          recommendationFamily: 'layout_density',
        },
      ],
    });

    assert(
      vipResult.ranked[0].variantId === 'variant_a',
      'Expected variant_a to rank first in VIP mobile context.'
    );

    const standardResult = await adapter.adaptRecommendations({
      context: standardDesktopContext as any,
      candidates: [
        {
          recommendationId: 'r1',
          experimentId: 'exp_1',
          variantId: 'variant_a',
          title: 'VIP mobile calming copy',
          summary: 'Stabilize high-latency luxury mobile flow.',
          baseScore: 80,
          recommendationFamily: 'conversion_copy',
        },
        {
          recommendationId: 'r2',
          experimentId: 'exp_1',
          variantId: 'variant_b',
          title: 'Dense desktop grid',
          summary: 'Increase above-the-fold service density.',
          baseScore: 82,
          recommendationFamily: 'layout_density',
        },
      ],
    });

    assert(
      standardResult.ranked[0].variantId === 'variant_b',
      'Expected variant_b to rank first in standard desktop context.'
    );

    console.log('🏆 V2.2 CONTEXTUAL OPTIMIZER SMOKE TEST PASSED');
  }
});

