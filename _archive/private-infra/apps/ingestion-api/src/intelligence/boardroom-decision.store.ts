import type {
  BoardroomDecision,
  BoardroomRecommendation,
  DecisionStats
} from "./boardroom-intelligence.types.js";
import type { BoardroomOverrideCommand } from "./boardroom-override.schema.js";
import { calculateFeedbackScore } from "./boardroom-feedback.js";

type OutcomeInput = {
  decisionId: string;
  revenueDelta?: number;
  hesitationDelta?: number;
  evaluatedAt: string;
};

const decisions = new Map<string, BoardroomDecision>();
const stats = new Map<string, DecisionStats>();

function clampFeedback(value: number) {
  return Math.max(-1, Math.min(1, value));
}

export function getDecisionSuccessRate(action: string) {
  const stat = stats.get(action);

  if (!stat || stat.total === 0) {
    return null;
  }

  return Number((stat.success / stat.total).toFixed(4));
}

export function upsertDecisionFromRecommendation(recommendation: BoardroomRecommendation) {
  const existing = decisions.get(recommendation.id);

  if (existing) {
    return {
      ...recommendation,
      successRate: getDecisionSuccessRate(recommendation.action) ?? undefined,
      feedbackScore: existing.feedbackScore,
    };
  }

  decisions.set(recommendation.id, {
    id: recommendation.id,
    sessionId: recommendation.sessionId,
    action: recommendation.action,
    reason: recommendation.reason,
    confidence: recommendation.confidence,
    impactWeight: recommendation.impactWeight,
    emittedAt: recommendation.createdAt,
  });

  return {
    ...recommendation,
    successRate: getDecisionSuccessRate(recommendation.action) ?? undefined,
  };
}

export function applyDecisionOverride(override: BoardroomOverrideCommand) {
  const existing = decisions.get(override.recommendationId);

  if (!existing) {
    decisions.set(override.recommendationId, {
      id: override.recommendationId,
      sessionId: override.sessionId,
      action: override.action,
      reason: override.reason,
      confidence: 0,
      impactWeight: 0,
      emittedAt: override.createdAt,
      override: {
        applied: true,
        operatorId: override.operatorId,
        appliedAt: override.createdAt,
      },
    });
    return decisions.get(override.recommendationId)!;
  }

  const updated = {
    ...existing,
    override: {
      applied: true,
      operatorId: override.operatorId,
      appliedAt: override.createdAt,
    },
  };

  decisions.set(updated.id, updated);
  return updated;
}

export function linkDecisionOutcome(input: OutcomeInput) {
  const decision = decisions.get(input.decisionId);

  if (!decision) {
    return null;
  }

  const revenueDelta = input.revenueDelta ?? 0;
  const hesitationDelta = input.hesitationDelta ?? 0;
  const feedbackScore = clampFeedback(calculateFeedbackScore({ revenueDelta, hesitationDelta }));
  const success = feedbackScore > 0;

  const updated: BoardroomDecision = {
    ...decision,
    outcome: {
      revenueDelta,
      hesitationDelta,
      success,
      evaluatedAt: input.evaluatedAt,
    },
    feedbackScore,
  };

  decisions.set(updated.id, updated);

  const current = stats.get(updated.action) ?? {
    action: updated.action,
    total: 0,
    success: 0,
  };

  stats.set(updated.action, {
    ...current,
    total: current.total + 1,
    success: current.success + (success ? 1 : 0),
  });

  return updated;
}

export function getDecision(decisionId: string) {
  return decisions.get(decisionId) ?? null;
}

export function listDecisions() {
  return Array.from(decisions.values());
}

export function listDecisionStats() {
  return Array.from(stats.values());
}
