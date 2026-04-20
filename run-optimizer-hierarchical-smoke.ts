import { existsSync, promises as fs } from 'node:fs';

import { FileBackedContextualOptimizerMemory } from './server/core/experiments/optimizer/optimizer.context.memory.file.ts';
import { HierarchicalOptimizerAdapter } from './server/core/experiments/optimizer/optimizer.hierarchical.adapter.ts';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function run(): Promise<void> {
  console.log('=== V2.3 HIERARCHICAL OPTIMIZER SMOKE TEST ===');

  const filePath = './data/optimizer-context-hierarchical-test.json';

  if (existsSync(filePath)) {
    try {
      await fs.unlink(filePath);
    } catch {}
  }

  const memory = new FileBackedContextualOptimizerMemory(filePath);
  const adapter = new HierarchicalOptimizerAdapter(memory);

  // Exact context yazmıyoruz.
  // Sadece segment+device seviyesinde bilgi var.
  await memory.append({
    experimentId: 'exp_1',
    variantId: 'variant_a',
    contextKey: 'exp_1|segment:vip|device:mobile',
    context: {
      segment: 'vip',
      device: 'mobile',
      latencyTier: 'unknown',
      visitorType: 'unknown',
    },
    upliftScore: 16,
    riskScore: 2,
    confidenceScore: 92,
    finalScore: 12,
    evaluatedAt: new Date().toISOString(),
  });

  await memory.append({
    experimentId: 'exp_1',
    variantId: 'variant_b',
    contextKey: 'exp_1|global',
    context: {
      segment: 'unknown',
      device: 'unknown',
      latencyTier: 'unknown',
      visitorType: 'unknown',
    },
    upliftScore: 8,
    riskScore: 1,
    confidenceScore: 88,
    finalScore: 6,
    evaluatedAt: new Date().toISOString(),
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
        title: 'VIP mobile calming copy',
        summary: 'Stabilize premium mobile flow.',
        baseScore: 80,
        recommendationFamily: 'conversion_copy',
      },
      {
        recommendationId: 'r2',
        experimentId: 'exp_1',
        variantId: 'variant_b',
        title: 'Generic layout fallback',
        summary: 'Broader low-specificity fallback.',
        baseScore: 81,
        recommendationFamily: 'layout_density',
      },
    ],
  });

  const top = result.ranked[0];

  assert(
    top.variantId === 'variant_a',
    'Expected variant_a to rank first via hierarchical fallback.'
  );

  assert(
    top.hierarchicalMemory.matchedLevel === 'segment_device',
    `Expected matchedLevel=segment_device, got ${top.hierarchicalMemory.matchedLevel}`
  );

  console.log('🏆 V2.3 HIERARCHICAL OPTIMIZER SMOKE TEST PASSED');
}

run().catch((error) => {
  console.error('❌ V2.3 HIERARCHICAL OPTIMIZER SMOKE TEST FAILED');
  console.error(error);
  process.exitCode = 1;
});
