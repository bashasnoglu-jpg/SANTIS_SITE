'use strict';

/**
 * Santis OS Real-Time Learning Engine
 * Outcome-driven weight tuning recommendations for deployment governance.
 *
 * Safety model:
 * - Never mutates production weights directly.
 * - Emits deterministic learning proposals.
 * - Requires Boardroom/Policy approval before persistence.
 */

const LEARNING_SCHEMA_VERSION = '1.0.0';

const DEFAULT_LEARNING_POLICY = Object.freeze({
  learningRate: 0.08,
  maxAdjustmentPct: 0.18,
  minConfidence: 0.62,
  requireApproval: true,
  minSamplesForAutoProposal: 3,
  protectedWeights: ['rollbackFailed', 'failingChecks'],
});

const DEFAULT_WEIGHT_TARGETS = Object.freeze({
  deployRisk: {
    deploymentFailed: 34,
    rollbackFailed: 45,
    repeatedFailure: 12,
    publishMissing: 20,
    recentRollback: 18,
    conversionDrop: 18,
    revenueDrop: 18,
    highHesitation: 12,
    highErrorRate: 20,
    highLatency: 10,
  },
  simulation: {
    packageChange: 12,
    workflowChange: 18,
    serverChange: 14,
    boardroomChange: 10,
    publicSurfaceChange: 8,
    largeDiff: 10,
    missingTests: 16,
    failingChecks: 35,
    noRollbackTarget: 18,
    peakTrafficWindow: 12,
  },
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundWeight(value) {
  return Number(value.toFixed(2));
}

function toNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeOutcome(outcome = {}) {
  return {
    id: String(outcome.id || `outcome_${Date.now()}`),
    decision: String(outcome.decision || 'UNKNOWN'),
    predictedScore: toNumber(outcome.predictedScore),
    actualRiskScore: toNumber(outcome.actualRiskScore),
    recommendation: String(outcome.recommendation || 'UNKNOWN'),
    actualResult: String(outcome.actualResult || 'UNKNOWN'),
    signals: outcome.signals && typeof outcome.signals === 'object' ? outcome.signals : {},
    metrics: outcome.metrics && typeof outcome.metrics === 'object' ? outcome.metrics : {},
    timestamp: outcome.timestamp || new Date().toISOString(),
  };
}

function classifyPredictionError(outcome) {
  const predicted = toNumber(outcome.predictedScore);
  const actual = toNumber(outcome.actualRiskScore);
  const delta = actual - predicted;

  if (delta >= 18) return 'UNDER_ESTIMATED_RISK';
  if (delta <= -18) return 'OVER_ESTIMATED_RISK';
  return 'CALIBRATED';
}

function confidenceFromSamples(outcomes, affectedSignalCount) {
  const sampleConfidence = clamp(outcomes.length / 8, 0, 1);
  const signalConfidence = clamp(affectedSignalCount / 4, 0, 1);
  return Number(((sampleConfidence * 0.7) + (signalConfidence * 0.3)).toFixed(2));
}

function mapSignalsToWeights(outcome) {
  const signals = outcome.signals || {};
  const metrics = outcome.metrics || {};
  const targets = [];

  if (signals.currentEvent === 'DEPLOYMENT_FAILED') targets.push(['deployRisk', 'deploymentFailed']);
  if (signals.currentEvent === 'ROLLBACK_FAILED') targets.push(['deployRisk', 'rollbackFailed']);
  if (toNumber(signals.recentFailures) >= 2) targets.push(['deployRisk', 'repeatedFailure']);
  if (signals.hasRecentPublishedImage === false) targets.push(['deployRisk', 'publishMissing']);
  if (signals.hasRecentRollback === true) targets.push(['deployRisk', 'recentRollback']);

  if (toNumber(metrics.conversionDeltaPct || signals.conversionDeltaPct) <= -8) targets.push(['deployRisk', 'conversionDrop']);
  if (toNumber(metrics.revenueDeltaPct || signals.revenueDeltaPct) <= -10) targets.push(['deployRisk', 'revenueDrop']);
  if (toNumber(metrics.hesitationIndex || signals.hesitationIndex) >= 70) targets.push(['deployRisk', 'highHesitation']);
  if (toNumber(metrics.errorRatePct || signals.errorRatePct) >= 5) targets.push(['deployRisk', 'highErrorRate']);
  if (toNumber(metrics.p95LatencyMs || signals.p95LatencyMs) >= 1200) targets.push(['deployRisk', 'highLatency']);

  const changeSurface = signals.changeSurface || {};
  if (changeSurface.packageChange) targets.push(['simulation', 'packageChange']);
  if (changeSurface.workflowChange) targets.push(['simulation', 'workflowChange']);
  if (changeSurface.serverChange) targets.push(['simulation', 'serverChange']);
  if (changeSurface.boardroomChange) targets.push(['simulation', 'boardroomChange']);
  if (changeSurface.publicSurfaceChange) targets.push(['simulation', 'publicSurfaceChange']);
  if (changeSurface.largeDiff) targets.push(['simulation', 'largeDiff']);
  if (changeSurface.testsPresent === false) targets.push(['simulation', 'missingTests']);
  if (changeSurface.rollbackTargetReady === false) targets.push(['simulation', 'noRollbackTarget']);
  if (changeSurface.trafficWindow === 'peak') targets.push(['simulation', 'peakTrafficWindow']);

  return targets;
}

function proposeWeightUpdates(input = {}) {
  const policy = { ...DEFAULT_LEARNING_POLICY, ...(input.policy || {}) };
  const currentWeights = {
    deployRisk: { ...DEFAULT_WEIGHT_TARGETS.deployRisk, ...(input.currentWeights?.deployRisk || {}) },
    simulation: { ...DEFAULT_WEIGHT_TARGETS.simulation, ...(input.currentWeights?.simulation || {}) },
  };

  const outcomes = Array.isArray(input.outcomes)
    ? input.outcomes.map(normalizeOutcome)
    : [];

  const accumulators = new Map();
  const evidence = [];

  for (const outcome of outcomes) {
    const errorClass = classifyPredictionError(outcome);
    const targets = mapSignalsToWeights(outcome);

    if (errorClass === 'CALIBRATED' || targets.length === 0) {
      continue;
    }

    evidence.push({
      outcomeId: outcome.id,
      errorClass,
      predictedScore: outcome.predictedScore,
      actualRiskScore: outcome.actualRiskScore,
      targets,
    });

    const direction = errorClass === 'UNDER_ESTIMATED_RISK' ? 1 : -1;
    const magnitude = clamp(Math.abs(outcome.actualRiskScore - outcome.predictedScore) / 100, 0.03, policy.maxAdjustmentPct);

    for (const [group, key] of targets) {
      const id = `${group}.${key}`;
      const current = accumulators.get(id) || { group, key, adjustment: 0, samples: 0 };
      current.adjustment += direction * magnitude;
      current.samples += 1;
      accumulators.set(id, current);
    }
  }

  const proposals = [];

  for (const item of accumulators.values()) {
    if (item.samples < policy.minSamplesForAutoProposal) {
      continue;
    }

    const base = currentWeights[item.group][item.key];
    if (typeof base !== 'number') {
      continue;
    }

    const averageAdjustment = item.adjustment / item.samples;
    const boundedAdjustment = clamp(averageAdjustment * policy.learningRate, -policy.maxAdjustmentPct, policy.maxAdjustmentPct);
    const proposed = roundWeight(base * (1 + boundedAdjustment));
    const confidence = confidenceFromSamples(outcomes, item.samples);

    if (confidence < policy.minConfidence) {
      continue;
    }

    proposals.push({
      id: `learn_${item.group}_${item.key}_${Date.now()}`,
      group: item.group,
      key: item.key,
      current: base,
      proposed,
      delta: roundWeight(proposed - base),
      samples: item.samples,
      confidence,
      protected: policy.protectedWeights.includes(item.key),
      requiresApproval: policy.requireApproval || policy.protectedWeights.includes(item.key),
      rationale: proposed > base
        ? `Increase ${item.group}.${item.key}; previous predictions under-estimated risk.`
        : `Decrease ${item.group}.${item.key}; previous predictions over-estimated risk.`,
    });
  }

  return {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    kind: 'LEARNING_PROPOSAL_BATCH',
    proposals,
    evidence,
    policy: {
      learningRate: policy.learningRate,
      maxAdjustmentPct: policy.maxAdjustmentPct,
      minConfidence: policy.minConfidence,
      requireApproval: policy.requireApproval,
    },
    generatedAt: new Date().toISOString(),
  };
}

function applyApprovedLearning(currentWeights = DEFAULT_WEIGHT_TARGETS, approvedProposals = []) {
  const next = {
    deployRisk: { ...(currentWeights.deployRisk || DEFAULT_WEIGHT_TARGETS.deployRisk) },
    simulation: { ...(currentWeights.simulation || DEFAULT_WEIGHT_TARGETS.simulation) },
  };

  const ledger = [];

  for (const proposal of approvedProposals) {
    if (!proposal || proposal.requiresApproval !== false && proposal.approved !== true) {
      continue;
    }

    if (!next[proposal.group] || typeof next[proposal.group][proposal.key] !== 'number') {
      continue;
    }

    const previous = next[proposal.group][proposal.key];
    next[proposal.group][proposal.key] = proposal.proposed;
    ledger.push({
      proposalId: proposal.id,
      group: proposal.group,
      key: proposal.key,
      previous,
      next: proposal.proposed,
      appliedAt: new Date().toISOString(),
    });
  }

  return {
    schemaVersion: LEARNING_SCHEMA_VERSION,
    kind: 'APPROVED_LEARNING_APPLICATION',
    weights: next,
    ledger,
  };
}

module.exports = {
  LEARNING_SCHEMA_VERSION,
  DEFAULT_LEARNING_POLICY,
  DEFAULT_WEIGHT_TARGETS,
  normalizeOutcome,
  classifyPredictionError,
  proposeWeightUpdates,
  applyApprovedLearning,
};
