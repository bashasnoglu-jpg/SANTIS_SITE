import fs from 'node:fs';
import assert from 'node:assert';
import path from 'node:path';
import { createRequire } from 'node:module';
import { runWithPrivateServerBoundary } from './scripts/helpers/smoke-server-boundary.mjs';

runWithPrivateServerBoundary({
  context: 'Rollout Daemon Smoke Test',
  requiredPaths: [
    'server/core/experiments/rollout/rollout.bootstrap.ts',
    'server/core/experiments/rollout/rollout.test-fixtures.ts',
    'server/core/experiments/engine/read-rollout-state.cjs'
  ],
  run: async () => {
    const { getOrCreateRolloutBootstrapContainer } = await import('./server/core/experiments/rollout/rollout.bootstrap.ts');
    const { createBasePlan } = await import('./server/core/experiments/rollout/rollout.test-fixtures.ts');
    
    const require = createRequire(import.meta.url);
    const readSide = require('./server/core/experiments/engine/read-rollout-state.cjs');

    console.log("=== V1.9 DAEMON SMOKE TEST ===");

    const repoPath = path.resolve('./data/test-rollout-state.json');
    const approvalPath = path.resolve('./data/test-rollout-approval.json');
    const healthPath = path.resolve('./data/test-rollout-health.json');

    // Clean up previous test files
    for (const p of [repoPath, approvalPath, healthPath]) {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    const container = getOrCreateRolloutBootstrapContainer(
      {
        enabled: true,
        dryRun: false,
        tickIntervalMs: 15000,
        runImmediateTickOnStart: false,
        repositoryMode: 'file',
        repositoryFilePath: repoPath,
        approvalStoreFilePath: approvalPath,
        healthWindowStoreFilePath: healthPath,
      },
      {
        metricsObserver: {
          getConversionRate: async () => 0,
          getErrorRate: async () => 0,
          getP95LatencyMs: async () => 0,
          getSampleSize: async () => 0,
          getConfidenceScore: async () => 0,
        } as any,
        logger: {
          info: () => {}, warn: () => {}, error: () => {}
        }
      }
    );

    console.log("1. Injecting a pending approval, healthy window state, and active rollout plan...");
    await container.approvalStore.requestApproval({ rolloutId: 'test-r1', requestedStage: 100 });
    await container.healthWindowStore.recordHealthyWindow('test-r1');
    
    const mockPlan = createBasePlan('test-exp', 'test-r1');
    mockPlan.status = 'running';
    mockPlan.currentStage = 50;
    await container.repository.savePlan(mockPlan);

    console.log("2. Running tickOnce()...");
    await container.runtime.tickOnce(new Date().toISOString());

    console.log("3. Verifying JSON file creation...");
    assert.strictEqual(fs.existsSync(repoPath), true, "rollout-state.json should exist");
    assert.strictEqual(fs.existsSync(approvalPath), true, "rollout-approval.json should exist");
    assert.strictEqual(fs.existsSync(healthPath), true, "rollout-health.json should exist");

    console.log("4. Verifying read-side helpers...");
    const rawState = readSide.readJsonFileSafe(repoPath);
    assert.ok(rawState !== null, "readJsonFileSafe should return parsed object");

    const approval = readSide.getApprovalByRolloutIdFromFile({ filePath: approvalPath, rolloutId: 'test-r1' });
    assert.strictEqual(approval?.requestedStage, 100, "Approval store should persist request");

    const health = readSide.getHealthWindowByRolloutIdFromFile({ filePath: healthPath, rolloutId: 'test-r1' });
    assert.strictEqual(health?.consecutiveHealthyCount, 1, "Health store should persist healthy count");

    console.log("✅ SMOKE TEST PASSED! The V1.9 Daemon persists state to the filesystem and the CJS read-side reads it correctly.");
  }
});

