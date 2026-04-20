import type {
  RolloutDecisionRecord,
  RolloutGuardrails,
  RolloutPlan,
} from './rollout.contract.ts';
import type { RolloutRepository } from './rollout.repository.ts';
import { buildRolloutHealthSnapshot, type MetricsObserver } from './rollout.telemetry-bridge.ts';
import { evaluateAndApplyRollout } from './rollout.controller.ts';
import { createRolloutDecisionAuditEvent } from './rollout.audit.ts';

export interface RolloutGuardrailProvider {
  getForExperiment(experimentId: string): Promise<RolloutGuardrails>;
}

export interface RolloutApprovalStore {
  hasApproval(rolloutId: string, requestedStage: 100): Promise<boolean>;
  requestApproval?(input: { rolloutId: string; requestedStage: 100 }): Promise<void>;
}

export interface RolloutHealthWindowStore {
  getConsecutiveHealthyCount(rolloutId: string): Promise<number>;
  recordHealthyWindow(rolloutId: string, timestamp: string): Promise<void>;
  resetHealthyWindows(rolloutId: string): Promise<void>;
}

export interface RolloutSchedulerDeps {
  repository: RolloutRepository;
  guardrailProvider: RolloutGuardrailProvider;
  metricsObserver: MetricsObserver;
  approvalStore: RolloutApprovalStore;
  healthWindowStore: RolloutHealthWindowStore;
  logger?: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
  };
}

export interface TickSingleRolloutInput {
  plan: RolloutPlan;
  nowIso: string;
}

export interface TickSingleRolloutResult {
  previousPlan: RolloutPlan;
  nextPlan: RolloutPlan;
  decisionRecord: RolloutDecisionRecord;
}

function isHealthyDecision(decision: RolloutDecisionRecord['finalDecision']): boolean {
  return decision === 'advance' || decision === 'complete';
}

function shouldResetHealthyWindows(decision: RolloutDecisionRecord['finalDecision']): boolean {
  return decision === 'rollback' || decision === 'pause';
}

export class RolloutScheduler {
  constructor(private readonly deps: RolloutSchedulerDeps) {}

  async tickSingleRollout(
    input: TickSingleRolloutInput
  ): Promise<TickSingleRolloutResult> {
    const { plan, nowIso } = input;

    const guardrails = await this.deps.guardrailProvider.getForExperiment(plan.experimentId);

    const snapshot = await buildRolloutHealthSnapshot(
      { observer: this.deps.metricsObserver },
      {
        experimentId: plan.experimentId,
        stagePercent: plan.currentStage,
        windowMinutes: guardrails.evaluationWindowMinutes,
        nowIso,
      }
    );

    const healthyWindowCount =
      await this.deps.healthWindowStore.getConsecutiveHealthyCount(plan.rolloutId);

    const hasManualApproval = await this.deps.approvalStore.hasApproval(
      plan.rolloutId,
      100
    );

    const result = evaluateAndApplyRollout({
      plan,
      guardrails,
      snapshot,
      context: {
        healthyWindowCount,
        hasManualApproval,
      },
      nowIso,
    });

    await this.deps.repository.savePlan(result.nextPlan);
    await this.deps.repository.saveDecisionRecord(result.decisionRecord);
    await this.deps.repository.saveAuditEvent(
      createRolloutDecisionAuditEvent(plan, result.nextPlan, result.decisionRecord)
    );

    if (isHealthyDecision(result.decisionRecord.finalDecision)) {
      await this.deps.healthWindowStore.recordHealthyWindow(plan.rolloutId, nowIso);
    } else if (shouldResetHealthyWindows(result.decisionRecord.finalDecision)) {
      await this.deps.healthWindowStore.resetHealthyWindows(plan.rolloutId);
    }

    if (
      result.decisionRecord.finalDecision === 'hold' &&
      result.decisionRecord.reason === 'manual_approval' &&
      this.deps.approvalStore.requestApproval
    ) {
      await this.deps.approvalStore.requestApproval({
        rolloutId: plan.rolloutId,
        requestedStage: 100,
      });

      this.deps.logger?.info('rollout.approval.requested', {
        rolloutId: plan.rolloutId,
        experimentId: plan.experimentId,
        requestedStage: 100,
      });
    }

    this.deps.logger?.info('rollout.tick.completed', {
      rolloutId: plan.rolloutId,
      experimentId: plan.experimentId,
      previousStage: plan.currentStage,
      nextStage: result.nextPlan.currentStage,
      previousStatus: plan.status,
      nextStatus: result.nextPlan.status,
      decision: result.decisionRecord.finalDecision,
      reason: result.decisionRecord.reason,
    });

    return {
      previousPlan: plan,
      nextPlan: result.nextPlan,
      decisionRecord: result.decisionRecord,
    };
  }

  async tickAll(nowIso: string): Promise<TickSingleRolloutResult[]> {
    const activePlans = await this.deps.repository.listActivePlans();
    const results: TickSingleRolloutResult[] = [];

    for (const plan of activePlans) {
      try {
        const result = await this.tickSingleRollout({
          plan,
          nowIso,
        });

        results.push(result);
      } catch (error) {
        this.deps.logger?.error('rollout.tick.failed', {
          rolloutId: plan.rolloutId,
          experimentId: plan.experimentId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }
}
