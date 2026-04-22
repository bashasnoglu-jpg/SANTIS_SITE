export type OptimizerPolicyMutationOp = {
  op: 'set';
  path: string;
  value: unknown;
  previousValue?: unknown;
  reason?: string;
};

export type OptimizerPolicyPatch = {
  ops: OptimizerPolicyMutationOp[];
};

export type OptimizerRolloutScope =
  | { type: 'global' }
  | { type: 'segment'; segmentId: string }
  | { type: 'canary'; rolloutPercentage: number; segmentId?: string };

export type OptimizerRolloutGuard = {
  maxRiskIncrease: number;
  minScoreDelta: number;
  minStabilityDelta?: number;
  evaluationWindowMinutes: number;
  minSampleSize?: number;
};

export type OptimizerRolloutMetricsSnapshot = {
  timestamp: string;
  sampleSize: number;
  scoreDelta: number;
  riskDelta: number;
  stabilityDelta: number;
};

export type OptimizerPolicyRolloutStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'reverted'
  | 'failed';

export type OptimizerPolicyRolloutRecord = {
  rolloutId: string;
  proposalId: string;
  tenantId: string;
  initiatedBy: string;
  status: OptimizerPolicyRolloutStatus;
  scope: OptimizerRolloutScope;
  patch: OptimizerPolicyPatch;
  rollbackPatch: OptimizerPolicyPatch;
  guard: OptimizerRolloutGuard;
  baselineFingerprint: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  revertedAt?: string;
  revertReason?: string;
  metricsHistory: OptimizerRolloutMetricsSnapshot[];
};

export type StartPolicyRolloutRequest = {
  proposalId: string;
  scope?: OptimizerRolloutScope;
  guard?: Partial<OptimizerRolloutGuard>;
};

export type StartPolicyRolloutResponse = {
  ok: true;
  rollout: OptimizerPolicyRolloutRecord;
};

export type GetPolicyRolloutResponse = {
  ok: true;
  rollout: OptimizerPolicyRolloutRecord;
};
