import { randomUUID } from 'node:crypto';
import {
  GetPolicyRolloutResponse,
  OptimizerPolicyRolloutRecord,
  OptimizerRolloutGuard,
  OptimizerRolloutScope,
  StartPolicyRolloutRequest,
  StartPolicyRolloutResponse,
} from './optimizer.policy.rollout.contract.ts';
import { OptimizerPolicyRolloutStore } from './optimizer.policy.rollout.memory.ts';
import { OptimizerPolicyStateRepository } from './optimizer.policy.state.memory.ts';
import {
  applyPatch,
  fingerprintOf,
  invertPatch,
  nowIso,
} from './optimizer.policy.rollout.utils.ts';

type ApprovalProposal = {
  id: string; // Will map from proposalId
  tenantId: string;
  status: 'pending' | 'approved' | 'rejected' | 'auto_applied';
  title: string;
  summary: string;
  payload: {
    patch: {
      ops: Array<{
        op: 'set';
        path: string;
        value: unknown;
        previousValue?: unknown;
        reason?: string;
      }>;
    };
    scope?: OptimizerRolloutScope;
  };
};

export interface OptimizerPolicyApprovalRepository {
  getById(proposalId: string): Promise<ApprovalProposal | null>;
}

type StartRolloutActor = {
  actorId: string;
};

const DEFAULT_GUARD: OptimizerRolloutGuard = {
  maxRiskIncrease: 5,
  minScoreDelta: -2,
  minStabilityDelta: -3,
  evaluationWindowMinutes: 15,
  minSampleSize: 30,
};

export class OptimizerPolicyRolloutEngine {
  constructor(
    private readonly approvalRepository: OptimizerPolicyApprovalRepository,
    private readonly policyStateRepository: OptimizerPolicyStateRepository,
    private readonly rolloutStore: OptimizerPolicyRolloutStore,
  ) {}

  async startRollout(
    actor: StartRolloutActor,
    request: StartPolicyRolloutRequest,
  ): Promise<StartPolicyRolloutResponse> {
    const proposal = await this.approvalRepository.getById(request.proposalId);

    if (!proposal) {
      throw new Error(`Proposal not found: ${request.proposalId}`);
    }

    if (proposal.status !== 'approved') {
      throw new Error(
        `Proposal ${request.proposalId} must be approved before rollout.`,
      );
    }

    const existingRunning = (await this.rolloutStore.listRunning()).find(
      (item) => item.proposalId === proposal.id,
    );

    if (existingRunning) {
      throw new Error(`Proposal ${proposal.id} already has a running rollout.`);
    }

    const policyDoc = await this.policyStateRepository.getPolicy(proposal.tenantId);
    const baselineFingerprint = fingerprintOf(policyDoc.policy);
    const patch = proposal.payload.patch;
    const rollbackPatch = invertPatch(policyDoc.policy, patch);

    const nextPolicy = applyPatch(policyDoc.policy, patch);

    await this.policyStateRepository.savePolicy({
      tenantId: proposal.tenantId,
      policy: nextPolicy,
      updatedAt: nowIso(),
    });

    const startedAt = nowIso();
    const rollout: OptimizerPolicyRolloutRecord = {
      rolloutId: randomUUID(),
      proposalId: proposal.id,
      tenantId: proposal.tenantId,
      initiatedBy: actor.actorId,
      status: 'running',
      scope: request.scope ?? proposal.payload.scope ?? { type: 'global' },
      patch,
      rollbackPatch,
      guard: {
        ...DEFAULT_GUARD,
        ...request.guard,
      },
      baselineFingerprint,
      startedAt,
      updatedAt: startedAt,
      metricsHistory: [],
    };

    await this.rolloutStore.create(rollout);

    return {
      ok: true,
      rollout,
    };
  }

  async getRollout(rolloutId: string): Promise<GetPolicyRolloutResponse> {
    const rollout = await this.rolloutStore.getById(rolloutId);
    if (!rollout) {
      throw new Error(`Rollout not found: ${rolloutId}`);
    }

    return {
      ok: true,
      rollout,
    };
  }
}
