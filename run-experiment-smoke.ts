import { runWithPrivateServerBoundary } from './scripts/helpers/smoke-server-boundary.mjs';

runWithPrivateServerBoundary({
  context: 'Experiment Smoke Test',
  requiredPaths: [
    'server/core/experiments/engine/experiment-assignment.ts',
    'server/core/experiments/adapters/optimizer-experiment.adapter.ts',
    'server/core/experiments/engine/rollout-engine.ts',
    'server/core/experiments/engine/experiment-evaluator.ts'
  ],
  run: async () => {
    const { assignVariant } = await import('./server/core/experiments/engine/experiment-assignment.ts');
    const { createExperimentFromOptimizer } = await import('./server/core/experiments/adapters/optimizer-experiment.adapter.ts');
    const { resolvePolicyWithExperiment } = await import('./server/core/experiments/engine/rollout-engine.ts');
    const { evaluateExperiment } = await import('./server/core/experiments/engine/experiment-evaluator.ts');

    function assert(condition: boolean, message: string) {
      if (!condition) {
        throw new Error(message);
      }
    }

    function logPass(label: string) {
      console.log(`✅ PASS - ${label}`);
    }

    function approxEqual(value: number, expected: number, tolerance: number) {
      return Math.abs(value - expected) <= tolerance;
    }

    console.log('=== EXPERIMENT GOVERNANCE V1.8 SMOKE TEST ===\n');

    const experiment = createExperimentFromOptimizer({
      key: 'highQuoteLatencyMs',
      currentValue: 1200,
      suggestedValue: 1000,
    });

    console.log('--- CASE A — deterministic assignment ---');
    {
      const v1 = assignVariant(experiment, 'visitor_1');
      const v2 = assignVariant(experiment, 'visitor_1');

      console.log(`visitor_1 -> ${v1}`);
      console.log(`visitor_1 -> ${v2}`);

      assert(v1 === v2, 'Deterministic assignment broken');
      logPass('CASE A');
    }

    console.log('\n--- CASE B — traffic distribution ---');
    {
      let control = 0;
      let variantA = 0;
      let variantB = 0;

      for (let i = 0; i < 2000; i++) {
        const variant = assignVariant(experiment, `visitor_${i}`);

        if (variant === 'control') control++;
        else if (variant === 'variant_a') variantA++;
        else variantB++;
      }

      const controlRate = control / 2000;
      const variantARate = variantA / 2000;

      console.log(
        `control=${controlRate.toFixed(2)}, variant_a=${variantARate.toFixed(2)}, variant_b=${(variantB / 2000).toFixed(2)}`
      );

      assert(approxEqual(controlRate, 0.5, 0.08), 'Control traffic allocation out of range');
      assert(approxEqual(variantARate, 0.5, 0.08), 'Variant A traffic allocation out of range');
      logPass('CASE B');
    }

    console.log('\n--- CASE C — policy override ---');
    {
      const basePolicy = {
        highQuoteLatencyMs: 1200,
        compactLayoutServiceThreshold: 4,
      };

      const controlPolicy = resolvePolicyWithExperiment({
        basePolicy,
        experiments: [experiment],
        visitorId: 'visitor_control_seed',
      });

      const variantPolicy = resolvePolicyWithExperiment({
        basePolicy,
        experiments: [experiment],
        visitorId: 'visitor_variant_seed_99',
      });

      console.log(`resolved control/variant samples ->`, {
        controlPolicy,
        variantPolicy,
      });

      const values = [controlPolicy.highQuoteLatencyMs, variantPolicy.highQuoteLatencyMs];
      assert(values.includes(1200), 'Control policy value missing');
      assert(values.includes(1000), 'Variant policy value missing');
      logPass('CASE C');
    }

    console.log('\n--- CASE D — evaluation winner ---');
    {
      const result = evaluateExperiment({
        control: {
          revenue: 1000,
          abandonmentRate: 0.32,
          intentRate: 0.41,
        },
        variant_a: {
          revenue: 1170,
          abandonmentRate: 0.24,
          intentRate: 0.49,
        },
      });

      console.log(`winner=${result.winner}, confidence=${result.confidence}`);

      assert(result.winner === 'variant_a', 'Experiment evaluator picked wrong winner');
      assert(result.confidence > 0, 'Confidence should be positive for winning variant');
      logPass('CASE D');
    }

    console.log('\n🏆 ALL EXPERIMENT MATRIX CASES PASSED');
  }
});

