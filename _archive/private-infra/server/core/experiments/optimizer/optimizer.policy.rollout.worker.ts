import { OptimizerPolicyRolloutStore } from './optimizer.policy.rollout.memory.ts';
import { OptimizerPolicyStateRepository } from './optimizer.policy.state.memory.ts';
import { OptimizerPolicyRolloutMetricsProvider } from './optimizer.policy.rollout.metrics.ts';
import { evaluateRolloutGuard } from './optimizer.policy.rollout.guard.ts';
import {
  applyPatch,
  fingerprintOf,
  nowIso,
} from './optimizer.policy.rollout.utils.ts';
import { sovereignEventBus } from '../../events/sovereign-event-bus.ts';

export class OptimizerPolicyRolloutWorker {
  constructor(
    private readonly rolloutStore: OptimizerPolicyRolloutStore,
    private readonly policyStateRepository: OptimizerPolicyStateRepository,
    private readonly metricsProvider: OptimizerPolicyRolloutMetricsProvider,
  ) {}

  async tick(): Promise<void> {
    const running = await this.rolloutStore.listRunning();

    for (const rollout of running) {
      await this.processOne(rollout.rolloutId);
    }
  }

  private async processOne(rolloutId: string): Promise<void> {
    const rollout = await this.rolloutStore.getById(rolloutId);
    if (!rollout || rollout.status !== 'running') {
      return;
    }

    const policyDoc = await this.policyStateRepository.getPolicy(rollout.tenantId);

    const currentFingerprint = fingerprintOf(policyDoc.policy);
    if (!currentFingerprint) {
      rollout.status = 'failed';
      rollout.updatedAt = nowIso();
      await this.rolloutStore.update(rollout);
      return;
    }

    const metrics = await this.metricsProvider.getSnapshot({
      tenantId: rollout.tenantId,
      scope: rollout.scope,
      since: rollout.startedAt,
      until: nowIso(),
    });

    rollout.metricsHistory.push(metrics);
    rollout.updatedAt = nowIso();

    const evaluation = evaluateRolloutGuard(rollout.guard, metrics);

    if (!evaluation.ok) {
      const revertedPolicy = applyPatch(policyDoc.policy, rollout.rollbackPatch);

      await this.policyStateRepository.savePolicy({
        tenantId: rollout.tenantId,
        policy: revertedPolicy,
        updatedAt: nowIso(),
      });

      rollout.status = 'reverted';
      rollout.revertedAt = nowIso();
      rollout.revertReason = evaluation.reason;
      rollout.updatedAt = nowIso();

      await this.rolloutStore.update(rollout);
      
      // Push event to the Nöral Köprü via WebSocket
      sovereignEventBus.emitRolloutUpdate(rollout);
      return;
    }

    const enoughSamples =
      metrics.sampleSize >= (rollout.guard.minSampleSize ?? 30);

    const healthy =
      metrics.scoreDelta >= rollout.guard.minScoreDelta &&
      metrics.riskDelta <= rollout.guard.maxRiskIncrease &&
      (rollout.guard.minStabilityDelta === undefined ||
        metrics.stabilityDelta >= rollout.guard.minStabilityDelta);

    if (enoughSamples && healthy) {
      rollout.status = 'completed';
      rollout.completedAt = nowIso();
      rollout.updatedAt = nowIso();

      await this.rolloutStore.update(rollout);
      sovereignEventBus.emitRolloutUpdate(rollout);
      return;
    }

    await this.rolloutStore.update(rollout);
    sovereignEventBus.emitRolloutUpdate(rollout);
  }
}
