import { existsSync, promises as fs } from 'node:fs';

import { FileBackedContextualOptimizerMemory } from './server/core/experiments/optimizer/optimizer.context.memory.file.ts';
import { ContextualOptimizerAdapter } from './server/core/experiments/optimizer/optimizer.context.adapter.ts';
import { buildContextKey } from './server/core/experiments/optimizer/optimizer.context.key.ts';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function run(): Promise<void> {
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
    contextKey: buildContextKey('exp_1', vipMobileContext),
    context: vipMobileContext,
    upliftScore: 18,
    riskScore: 2,
    confidenceScore: 93,
    finalScore: 14,
    evaluatedAt: new Date().toISOString(),
  });

  await memory.append({
    experimentId: 'exp_1',
    variantId: 'variant_b',
    contextKey: buildContextKey('exp_1', standardDesktopContext),
    context: standardDesktopContext,
    upliftScore: 20,
    riskScore: 1,
    confidenceScore: 95,
    finalScore: 18,
    evaluatedAt: new Date().toISOString(),
  });

  const adapter = new ContextualOptimizerAdapter(memory);

  const vipResult = await adapter.adaptRecommendations({
    context: vipMobileContext,
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
    context: standardDesktopContext,
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

run().catch((error) => {
  console.error('❌ V2.2 CONTEXTUAL OPTIMIZER SMOKE TEST FAILED');
  console.error(error);
  process.exitCode = 1;
});
