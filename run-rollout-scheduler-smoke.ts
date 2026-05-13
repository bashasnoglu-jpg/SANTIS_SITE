import { runWithPrivateServerBoundary } from './scripts/helpers/smoke-server-boundary.mjs';

runWithPrivateServerBoundary({
  context: 'Rollout Scheduler Smoke Test',
  requiredPaths: [
    'server/core/experiments/rollout/rollout.scheduler.ts',
    'server/core/experiments/rollout/rollout.repository.ts',
    'server/core/experiments/rollout/rollout.approval.ts',
    'server/core/experiments/rollout/rollout.health-window-store.ts',
    'server/core/experiments/rollout/rollout.guardrails.ts',
    'server/core/experiments/rollout/rollout.test-fixtures.ts',
    'server/core/experiments/rollout/rollout.contract.ts'
  ],
  run: async () => {
    const { RolloutScheduler } = await import('./server/core/experiments/rollout/rollout.scheduler.ts');
    const { InMemoryRolloutRepository } = await import('./server/core/experiments/rollout/rollout.repository.ts');
    const { InMemoryRolloutApprovalStore } = await import('./server/core/experiments/rollout/rollout.approval.ts');
    const { InMemoryRolloutHealthWindowStore } = await import('./server/core/experiments/rollout/rollout.health-window-store.ts');
    const { StaticRolloutGuardrailProvider } = await import('./server/core/experiments/rollout/rollout.guardrails.ts');
    const { createBasePlan } = await import('./server/core/experiments/rollout/rollout.test-fixtures.ts');

    function assert(condition: unknown, message: string): void {
      if (!condition) {
        throw new Error(message);
      }
    }

    function pass(label: string): void {
      console.log(`✅ PASS — ${label}`);
    }

    class StubMetricsObserver {
      constructor(
        private readonly config: any
      ) {}

      async getConversionRate(input: any): Promise<number> {
        return input.arm === 'control'
          ? this.config.controlConversionRate
          : this.config.candidateConversionRate;
      }

      async getErrorRate(input: any): Promise<number> {
        return input.arm === 'control'
          ? this.config.controlErrorRate
          : this.config.candidateErrorRate;
      }

      async getP95LatencyMs(input: any): Promise<number> {
        return input.arm === 'control'
          ? this.config.controlP95LatencyMs
          : this.config.candidateP95LatencyMs;
      }

      async getSampleSize(input: any): Promise<number> {
        return this.config.sampleSize;
      }

      async getConfidenceScore(input: any): Promise<number> {
        return this.config.confidenceScore;
      }
    }

    async function seedPlan(
      repository: any,
      plan: any
    ): Promise<void> {
      await repository.savePlan(plan);
    }

    async function getSingleDecisionRecord(
      repository: any,
      rolloutId: string
    ): Promise<any> {
      const records = await repository.listDecisionRecords(rolloutId);
      assert(records.length === 1, `Expected exactly 1 decision record, got ${records.length}.`);
      return records[0];
    }

    async function getSingleAuditEvent(
      repository: any,
      rolloutId: string
    ): Promise<any> {
      const events = await repository.listAuditEvents(rolloutId);
      assert(events.length === 1, `Expected exactly 1 audit event, got ${events.length}.`);
      return events[0];
    }

    function createScheduler(input: {
      repository: any;
      metricsObserver: any;
      approvalStore?: any;
      healthWindowStore?: any;
      guardrails?: any;
    }) {
      const approvalStore = input.approvalStore ?? new InMemoryRolloutApprovalStore();
      const healthWindowStore =
        input.healthWindowStore ?? new InMemoryRolloutHealthWindowStore();

      const guardrailProvider = new StaticRolloutGuardrailProvider({
        exp_v18_winner:
          input.guardrails ?? {
            minSampleSizePerStage: 500,
            minConfidenceScore: 85,
            maxRelativeLatencyIncreasePct: 15,
            maxAbsoluteErrorRate: 0.03,
            maxRelativeConversionDropPct: 8,
            evaluationWindowMinutes: 15,
            consecutiveHealthyWindowsRequired: 2,
          },
      });

      return new RolloutScheduler({
        repository: input.repository,
        guardrailProvider,
        metricsObserver: input.metricsObserver,
        approvalStore,
        healthWindowStore,
        logger: {
          info: () => {},
          warn: () => {},
          error: () => {},
        },
      });
    }

    async function caseAHealthyAdvance(): Promise<void> {
      console.log('--- CASE A — active rollout advances and persists ---');

      const repository = new InMemoryRolloutRepository();
      const healthWindowStore = new InMemoryRolloutHealthWindowStore();

      const plan = createBasePlan({
        currentStage: 10,
        status: 'running',
      });

      await healthWindowStore.recordHealthyWindow(plan.rolloutId);
      await healthWindowStore.recordHealthyWindow(plan.rolloutId);

      await seedPlan(repository, plan);

      const scheduler = createScheduler({
        repository,
        healthWindowStore,
        metricsObserver: new StubMetricsObserver({
          controlConversionRate: 0.12,
          candidateConversionRate: 0.118,
          controlErrorRate: 0.01,
          candidateErrorRate: 0.012,
          controlP95LatencyMs: 1000,
          candidateP95LatencyMs: 1080,
          sampleSize: 700,
          confidenceScore: 91,
        }),
      });

      const results = await scheduler.tickAll('2026-04-20T12:30:00.000Z');

      assert(results.length === 1, 'Expected one active rollout to be processed.');

      const updatedPlan = await repository.getPlanByRolloutId(plan.rolloutId);
      assert(updatedPlan?.currentStage === 25, `Expected stage to advance from 10 to 25, got ${updatedPlan?.currentStage} with status ${updatedPlan?.status}.`);

      const record = await getSingleDecisionRecord(repository, plan.rolloutId);
      assert(record.finalDecision === 'advance', 'Expected decision to be advance.');

      const audit = await getSingleAuditEvent(repository, plan.rolloutId);
      assert(audit.eventType === 'rollout_advanced', 'Expected rollout_advanced audit event.');

      pass('active rollout advances and persists');
      console.log();
    }

    async function caseBLatencyRollback(): Promise<void> {
      console.log('--- CASE B — latency breach triggers rollback ---');

      const repository = new InMemoryRolloutRepository();
      const healthWindowStore = new InMemoryRolloutHealthWindowStore();

      const plan = createBasePlan({
        currentStage: 25,
        status: 'running',
      });

      await healthWindowStore.recordHealthyWindow(plan.rolloutId);
      await healthWindowStore.recordHealthyWindow(plan.rolloutId);

      await seedPlan(repository, plan);

      const scheduler = createScheduler({
        repository,
        healthWindowStore,
        metricsObserver: new StubMetricsObserver({
          controlConversionRate: 0.12,
          candidateConversionRate: 0.118,
          controlErrorRate: 0.01,
          candidateErrorRate: 0.012,
          controlP95LatencyMs: 1000,
          candidateP95LatencyMs: 1400,
          sampleSize: 800,
          confidenceScore: 93,
        }),
      });

      await scheduler.tickAll('2026-04-20T12:45:00.000Z');

      const updatedPlan = await repository.getPlanByRolloutId(plan.rolloutId);
      assert(updatedPlan?.status === 'rolled_back', 'Expected rollout to be rolled_back.');

      const record = await getSingleDecisionRecord(repository, plan.rolloutId);
      assert(record.finalDecision === 'rollback', 'Expected decision to be rollback.');
      assert(record.reason === 'latency_regression', 'Expected reason to be latency_regression.');

      const audit = await getSingleAuditEvent(repository, plan.rolloutId);
      assert(audit.eventType === 'rollout_rolled_back', 'Expected rollout_rolled_back audit event.');

      const healthyCount = await healthWindowStore.getConsecutiveHealthyCount(plan.rolloutId);
      assert(healthyCount === 0, 'Expected healthy window count to reset after rollback.');

      pass('latency breach triggers rollback');
      console.log();
    }

    async function caseCManualApprovalGate(): Promise<void> {
      console.log('--- CASE C — 50 to 100 waits for human approval ---');

      const repository = new InMemoryRolloutRepository();
      const healthWindowStore = new InMemoryRolloutHealthWindowStore();
      const approvalStore = new InMemoryRolloutApprovalStore();

      const plan = createBasePlan({
        currentStage: 50,
        status: 'running',
        requiresHumanApprovalAt100: true,
      });

      await healthWindowStore.recordHealthyWindow(plan.rolloutId);
      await healthWindowStore.recordHealthyWindow(plan.rolloutId);

      await seedPlan(repository, plan);

      const scheduler = createScheduler({
        repository,
        approvalStore,
        healthWindowStore,
        metricsObserver: new StubMetricsObserver({
          controlConversionRate: 0.12,
          candidateConversionRate: 0.119,
          controlErrorRate: 0.01,
          candidateErrorRate: 0.012,
          controlP95LatencyMs: 1000,
          candidateP95LatencyMs: 1075,
          sampleSize: 850,
          confidenceScore: 95,
        }),
      });

      await scheduler.tickAll('2026-04-20T13:00:00.000Z');

      const updatedPlan = await repository.getPlanByRolloutId(plan.rolloutId);
      assert(updatedPlan?.currentStage === 50, 'Expected stage to remain 50 without approval.');
      assert(updatedPlan?.status === 'running', 'Expected rollout to remain running while holding.');

      const record = await getSingleDecisionRecord(repository, plan.rolloutId);
      assert(record.finalDecision === 'hold', 'Expected decision to be hold.');
      assert(record.reason === 'manual_approval', 'Expected reason to be manual_approval.');
      
      const hasApprovalRequest = await approvalStore.hasApproval(plan.rolloutId, 100);
      assert(!hasApprovalRequest, 'Expected approval to not be granted yet');

      pass('50 to 100 waits for human approval');
      console.log();
    }

    async function caseDApprovedCompletion(): Promise<void> {
      console.log('--- CASE D — 100 percent rollout completes when healthy ---');

      const repository = new InMemoryRolloutRepository();
      const healthWindowStore = new InMemoryRolloutHealthWindowStore();
      const approvalStore = new InMemoryRolloutApprovalStore();

      const plan = createBasePlan({
        currentStage: 100,
        status: 'running',
        requiresHumanApprovalAt100: true,
      });

      await approvalStore.approve({
        rolloutId: plan.rolloutId,
        approvedAt: '2026-04-20T13:10:00.000Z',
        approvedBy: 'sovereign_operator',
      });

      await healthWindowStore.recordHealthyWindow(plan.rolloutId);
      await healthWindowStore.recordHealthyWindow(plan.rolloutId);

      await seedPlan(repository, plan);

      const scheduler = createScheduler({
        repository,
        approvalStore,
        healthWindowStore,
        metricsObserver: new StubMetricsObserver({
          controlConversionRate: 0.12,
          candidateConversionRate: 0.121,
          controlErrorRate: 0.01,
          candidateErrorRate: 0.011,
          controlP95LatencyMs: 1000,
          candidateP95LatencyMs: 1050,
          sampleSize: 1200,
          confidenceScore: 97,
        }),
      });

      await scheduler.tickAll('2026-04-20T13:15:00.000Z');

      const updatedPlan = await repository.getPlanByRolloutId(plan.rolloutId);
      assert(updatedPlan?.status === 'completed', 'Expected rollout to be completed.');

      const record = await getSingleDecisionRecord(repository, plan.rolloutId);
      assert(record.finalDecision === 'complete', 'Expected decision to be complete.');

      const audit = await getSingleAuditEvent(repository, plan.rolloutId);
      assert(audit.eventType === 'rollout_completed', 'Expected rollout_completed audit event.');

      pass('100 percent rollout completes when healthy');
      console.log();
    }

    console.log('=== SAFE ROLLOUT SCHEDULER V1.9 SMOKE TEST ===\n');

    await caseAHealthyAdvance();
    await caseBLatencyRollback();
    await caseCManualApprovalGate();
    await caseDApprovedCompletion();

    console.log('🏆 ALL SAFE ROLLOUT SCHEDULER CASES PASSED');
  }
});

