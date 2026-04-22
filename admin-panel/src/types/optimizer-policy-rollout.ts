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

export type OptimizerPolicyRolloutRecord = {
  rolloutId: string;
  proposalId: string;
  tenantId: string;
  initiatedBy: string;
  status: 'pending' | 'running' | 'completed' | 'reverted' | 'failed';
  scope: OptimizerRolloutScope;
  guard: OptimizerRolloutGuard;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  revertedAt?: string;
  revertReason?: string;
  metricsHistory: Array<{
    timestamp: string;
    sampleSize: number;
    scoreDelta: number;
    riskDelta: number;
    stabilityDelta: number;
  }>;
};

export type StartPolicyRolloutResponse = {
  ok: true;
  rollout: OptimizerPolicyRolloutRecord;
};
