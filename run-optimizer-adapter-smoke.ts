import fs from 'node:fs';
import { FileBackedOptimizerMemory } from './server/core/experiments/optimizer/optimizer.memory.file.ts';
import { FeedbackEngine } from './server/core/experiments/optimizer/optimizer.feedback.engine.ts';
import { OptimizerAdapter } from './server/core/experiments/optimizer/optimizer.adapter.ts';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function run(): Promise<void> {
  console.log('=== V2.1 OPTIMIZER ADAPTER SMOKE TEST ===');

  const memoryFile = './data/optimizer-memory-test.json';
  if (fs.existsSync(memoryFile)) {
    try {
      await fs.promises.unlink(memoryFile);
    } catch {}
  }

  const memory = new FileBackedOptimizerMemory(memoryFile);
  const feedbackEngine = new FeedbackEngine(memory);
  const adapter = new OptimizerAdapter(memory);

  await feedbackEngine.process({
    experimentId: 'exp_1',
    rolloutId: 'rollout_1',
    variantId: 'variant_a',
    baselineConversion: 0.10,
    candidateConversion: 0.18,
    baselineErrorRate: 0.01,
    candidateErrorRate: 0.012,
    baselineLatencyMs: 1000,
    candidateLatencyMs: 1030,
    sampleSize: 1200,
    confidenceScore: 95,
    outcome: 'win',
    evaluatedAt: new Date().toISOString(),
  });

  const result = await adapter.adaptRecommendations({
    candidates: [
      {
        recommendationId: 'r1',
        experimentId: 'exp_1',
        variantId: 'variant_a',
        title: 'Promote adaptive quote copy',
        summary: 'Increase persuasive quote framing.',
        baseScore: 80,
        recommendationFamily: 'conversion_copy',
      },
      {
        recommendationId: 'r2',
        experimentId: 'exp_1',
        variantId: 'variant_b',
        title: 'Increase compact density',
        summary: 'Fit more service cards above fold.',
        baseScore: 82,
        recommendationFamily: 'layout_density',
      },
    ],
  });

  console.log(result.ranked);

  assert(result.ranked.length === 2, 'Expected 2 adapted recommendations.');
  assert(
    result.ranked[0].variantId === 'variant_a',
    'Expected variant_a to rank first due to positive memory bias.'
  );

  console.log('🏆 V2.1 OPTIMIZER ADAPTER SMOKE TEST PASSED');
}

run().catch((error) => {
  console.error('❌ V2.1 OPTIMIZER ADAPTER SMOKE TEST FAILED');
  console.error(error);
  process.exitCode = 1;
});
