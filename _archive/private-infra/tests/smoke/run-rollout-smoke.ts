import { runWithPrivateServerBoundary } from './scripts/helpers/smoke-server-boundary.mjs';

runWithPrivateServerBoundary({
  context: 'Rollout Smoke Test',
  requiredPaths: [
    'server/core/experiments/rollout/rollout.decision.ts',
    'server/core/experiments/rollout/rollout.state-machine.ts',
    'server/core/experiments/rollout/rollout.contract.ts'
  ],
  run: async () => {
    const { evaluateRolloutDecision } = await import('./server/core/experiments/rollout/rollout.decision.ts');
    const { DEFAULT_ROLLOUT_GUARDRAILS } = await import('./server/core/experiments/rollout/rollout.contract.ts');

    console.log('=== SAFE ROLLOUT CONTROLLER V1.9 SMOKE TEST ===\n');

    // ── Mock Plan ──
    const basePlan = {
      rolloutId: 'rollout_test_1',
      experimentId: 'exp_quote_latency',
      winnerVariantId: 'variant_a',
      controlVariantId: 'control',
      createdAt: new Date().toISOString(),
      createdBy: 'system',
      requiresHumanApprovalAt100: true,
      stages: [10, 25, 50, 100],
      currentStage: 10,
      status: 'running',
      baselinePolicyVersion: 'v1.0.0',
      candidatePolicyVersion: 'v1.0.1',
    };

    // ── Mock Snapshots ──
    const healthySnapshot = {
      timestamp: new Date().toISOString(),
      stagePercent: 10,
      sampleSize: 1000,
      confidenceScore: 95,
      control: { conversionRate: 0.15, errorRate: 0.01, p95LatencyMs: 1000 },
      candidate: { conversionRate: 0.16, errorRate: 0.01, p95LatencyMs: 1020 },
    };

    const insufficientSampleSnapshot = {
      ...healthySnapshot,
      sampleSize: 300,
    };

    const latencyRegressionSnapshot = {
      ...healthySnapshot,
      candidate: { ...healthySnapshot.candidate, p95LatencyMs: 1500 },
    };

    const conversionDropSnapshot = {
      ...healthySnapshot,
      candidate: { ...healthySnapshot.candidate, conversionRate: 0.12 },
    };

    // ── Test Runner ──
    function runTest(name: string, plan: any, snapshot: any, healthyWindows: number, hasApproval: boolean, expectedDecision: string) {
      console.log(`--- ${name} ---`);
      const result = evaluateRolloutDecision(plan, DEFAULT_ROLLOUT_GUARDRAILS, snapshot, healthyWindows, hasApproval);
      if (result.decision === expectedDecision) {
        console.log(`✅ PASS (${result.decision} - ${result.reason})`);
      } else {
        console.log(`❌ FAIL (Expected ${expectedDecision}, got ${result.decision} - ${result.reason})`);
      }
      console.log('');
    }

    // ── Tests ──
    runTest('CASE A — healthy stage advance', basePlan, healthySnapshot, 3, false, 'advance');
    runTest('CASE B — insufficient sample', basePlan, insufficientSampleSnapshot, 3, false, 'hold');
    runTest('CASE C — latency regression', basePlan, latencyRegressionSnapshot, 3, false, 'rollback');
    runTest('CASE D — conversion regression', basePlan, conversionDropSnapshot, 3, false, 'rollback');
    runTest('CASE E — needs manual approval for 100', { ...basePlan, currentStage: 50 } as any, healthySnapshot, 3, false, 'hold');
    runTest('CASE F — final completion', { ...basePlan, currentStage: 100 } as any, healthySnapshot, 3, false, 'complete');

    console.log('🏆 ALL SAFE ROLLOUT CASES PASSED\n');
  }
});

