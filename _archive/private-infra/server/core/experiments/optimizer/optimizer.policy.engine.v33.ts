import { randomUUID } from 'node:crypto';

import type { OptimizerAnomaly } from './optimizer.ops.anomaly.contract.ts';
import {
  buildDefaultRuntimePolicy,
  type OptimizerRuntimePolicy,
} from './optimizer.policy.contract.ts';
import type { OptimizerPolicyStateStore } from './optimizer.policy.state.ts';
import { applyAnomalyMitigations } from './optimizer.policy.mitigation.ts';
import type { OptimizerPolicyAuditStore } from './optimizer.policy.audit.memory.ts';
import type {
  OptimizerPolicyProposal,
} from './optimizer.policy.approval.contract.ts';
import type { OptimizerPolicyApprovalStore } from './optimizer.policy.approval.memory.ts';
import { evaluatePolicyApprovalRequirement } from './optimizer.policy.approval.rules.ts';
import type {
  PolicyApprovalActionInput,
  PolicyForceOverrideInput,
  PolicyRejectActionInput,
} from './optimizer.policy.override.contract.ts';

export interface PolicyV33EvaluationResult {
  policy: OptimizerRuntimePolicy;
  proposal: OptimizerPolicyProposal | null;
  applied: boolean;
  pendingApproval: boolean;
}

export class OptimizerPolicyEngineV33 {
  constructor(
    private readonly stateStore: OptimizerPolicyStateStore,
    private readonly auditStore: OptimizerPolicyAuditStore,
    private readonly approvalStore: OptimizerPolicyApprovalStore
  ) {}

  async resolvePolicy(experimentId: string): Promise<OptimizerRuntimePolicy> {
    await this.stateStore.clearExpiredPolicies();

    const existing = await this.stateStore.getPolicy(experimentId);
    if (existing) {
      return existing;
    }

    return buildDefaultRuntimePolicy({ experimentId });
  }

  async evaluateAndMitigate(params: {
    experimentId: string;
    anomalies: OptimizerAnomaly[];
  }): Promise<PolicyV33EvaluationResult> {
    const basePolicy = await this.resolvePolicy(params.experimentId);

    if (params.anomalies.length === 0) {
      return {
        policy: basePolicy,
        proposal: null,
        applied: false,
        pendingApproval: false,
      };
    }

    const mitigation = applyAnomalyMitigations({
      basePolicy,
      anomalies: params.anomalies,
    });

    const approvalDecision = evaluatePolicyApprovalRequirement({
      anomalies: params.anomalies,
      basePolicy,
      proposedPolicy: mitigation.nextPolicy,
      changedFields: mitigation.changedFields,
    });

    const proposal: OptimizerPolicyProposal = {
      proposalId: randomUUID(),
      experimentId: params.experimentId,
      basePolicy,
      proposedPolicy: mitigation.nextPolicy,
      anomalies: params.anomalies,
      changedFields: mitigation.changedFields,
      requiresApproval: approvalDecision.requiresApproval,
      status: approvalDecision.requiresApproval ? 'pending' : 'auto_applied',
      createdAt: new Date().toISOString(),
      decidedAt: approvalDecision.requiresApproval ? null : new Date().toISOString(),
      decidedBy: approvalDecision.requiresApproval ? null : 'system:auto',
      rejectionReason: null,
    };

    await this.approvalStore.create(proposal);

    if (approvalDecision.requiresApproval) {
      return {
        policy: basePolicy,
        proposal,
        applied: false,
        pendingApproval: true,
      };
    }

    await this.stateStore.setPolicy(mitigation.nextPolicy);

    await this.auditStore.append({
      experimentId: params.experimentId,
      anomalies: params.anomalies,
      changedFields: mitigation.changedFields,
      policy: mitigation.nextPolicy,
      evaluatedAt: new Date().toISOString(),
    });

    return {
      policy: mitigation.nextPolicy,
      proposal,
      applied: true,
      pendingApproval: false,
    };
  }

  async approveProposal(input: PolicyApprovalActionInput): Promise<OptimizerPolicyProposal> {
    const proposal = await this.approvalStore.getById(input.proposalId);

    if (!proposal) {
      throw new Error(`Proposal not found: ${input.proposalId}`);
    }

    const approved: OptimizerPolicyProposal = {
      ...proposal,
      status: 'approved',
      decidedAt: new Date().toISOString(),
      decidedBy: input.actor,
    };

    await this.approvalStore.update(approved);
    await this.stateStore.setPolicy(approved.proposedPolicy);

    await this.auditStore.append({
      experimentId: approved.experimentId,
      anomalies: approved.anomalies,
      changedFields: approved.changedFields,
      policy: approved.proposedPolicy,
      evaluatedAt: new Date().toISOString(),
    });

    return approved;
  }

  async rejectProposal(input: PolicyRejectActionInput): Promise<OptimizerPolicyProposal> {
    const proposal = await this.approvalStore.getById(input.proposalId);

    if (!proposal) {
      throw new Error(`Proposal not found: ${input.proposalId}`);
    }

    const rejected: OptimizerPolicyProposal = {
      ...proposal,
      status: 'rejected',
      decidedAt: new Date().toISOString(),
      decidedBy: input.actor,
      rejectionReason: input.reason,
    };

    await this.approvalStore.update(rejected);
    return rejected;
  }

  async forceOverride(input: PolicyForceOverrideInput): Promise<OptimizerRuntimePolicy> {
    const policy: OptimizerRuntimePolicy = {
      ...input.policy,
      source: 'auto_mitigated',
      reason: `manual_override:${input.reason}`,
      activatedAt: new Date().toISOString(),
    };

    await this.stateStore.setPolicy(policy);

    await this.auditStore.append({
      experimentId: input.experimentId,
      anomalies: [],
      changedFields: Object.keys(policy),
      policy,
      evaluatedAt: new Date().toISOString(),
    });

    return policy;
  }
}
