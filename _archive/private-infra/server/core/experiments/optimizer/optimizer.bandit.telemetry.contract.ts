import type { BanditConstraintBlockReason } from './optimizer.bandit.constraints.contract.ts';

export interface BanditDecisionTelemetryEvent {
  experimentId: string;
  variantId: string;
  recommendationId: string;
  recommendationFamily: string;

  finalBanditScore: number;
  exploitationScore: number;
  explorationScore: number;
  posteriorScore: number;

  allowed: boolean;
  blockedReasons: BanditConstraintBlockReason[];

  evaluatedAt: string;
}

export interface BanditDecisionTelemetrySummary {
  totalCandidates: number;
  allowedCandidates: number;
  blockedCandidates: number;
  explorationRate: number;
  blockedReasonCounts: Record<string, number>;
  familyExposureCounts: Record<string, number>;
}
