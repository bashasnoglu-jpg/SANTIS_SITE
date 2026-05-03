/**
 * Santis OS Canary Deployment Engine + Traffic Split AI
 * Deterministic canary planning, traffic allocation and promotion governance.
 */

import { simulateDeployment } from './deploy-simulation-engine.js';
import { scoreDeployRisk } from './deploy-risk-engine.js';
import { evaluateApprovalPolicy } from './approval-policy-engine.js';

export const CANARY_SCHEMA_VERSION = '1.0.0';

export const DEFAULT_CANARY_POLICY = Object.freeze({
  initialSplitPct: 5,
  maxSplitPct: 50,
  promoteStepPct: 10,
  minimumObservationMinutes: 15,
  guardrails: {
    maxErrorRatePct: 3,
    maxP95LatencyMs: 950,
    minConversionDeltaPct: -4,
    minRevenueDeltaPct: -5,
    maxHesitationIndex: 65,
  },
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function toNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function evaluateGuardrails(metrics = {}, policy = DEFAULT_CANARY_POLICY) {
  const guardrails = { ...DEFAULT_CANARY_POLICY.guardrails, ...(policy.guardrails || {}) };
  const violations = [];

  const errorRatePct = toNumber(metrics.errorRatePct);
  const p95LatencyMs = toNumber(metrics.p95LatencyMs);
  const conversionDeltaPct = toNumber(metrics.conversionDeltaPct);
  const revenueDeltaPct = toNumber(metrics.revenueDeltaPct);
  const hesitationIndex = toNumber(metrics.hesitationIndex);

  if (errorRatePct > guardrails.maxErrorRatePct) {
    violations.push(`Error rate ${errorRatePct}% exceeds ${guardrails.maxErrorRatePct}%.`);
  }

  if (p95LatencyMs > guardrails.maxP95LatencyMs) {
    violations.push(`P95 latency ${p95LatencyMs}ms exceeds ${guardrails.maxP95LatencyMs}ms.`);
  }

  if (conversionDeltaPct < guardrails.minConversionDeltaPct) {
    violations.push(`Conversion delta ${conversionDeltaPct}% is below ${guardrails.minConversionDeltaPct}%.`);
  }

  if (revenueDeltaPct < guardrails.minRevenueDeltaPct) {
    violations.push(`Revenue delta ${revenueDeltaPct}% is below ${guardrails.minRevenueDeltaPct}%.`);
  }

  if (hesitationIndex > guardrails.maxHesitationIndex) {
    violations.push(`Hesitation index ${hesitationIndex} exceeds ${guardrails.maxHesitationIndex}.`);
  }

  return {
    passed: violations.length === 0,
    violations,
    observed: {
      errorRatePct,
      p95LatencyMs,
      conversionDeltaPct,
      revenueDeltaPct,
      hesitationIndex,
    },
  };
}

function deriveInitialSplit(simulation, policy = DEFAULT_CANARY_POLICY) {
  const score = simulation?.assessment?.score ?? 100;

  if (score >= 85) return 0;
  if (score >= 75) return Math.min(policy.initialSplitPct, 2);
  if (score >= 55) return policy.initialSplitPct;
  if (score >= 35) return Math.min(policy.initialSplitPct + 5, policy.maxSplitPct);
  return Math.min(policy.initialSplitPct + 10, policy.maxSplitPct);
}

export function createCanaryPlan(input = {}) {
  const policy = { ...DEFAULT_CANARY_POLICY, ...(input.policy || {}) };
  const simulation = simulateDeployment({
    ...input,
    context: {
      ...(input.context || {}),
      deploymentMode: 'canary',
    },
  });

  const initialSplitPct = deriveInitialSplit(simulation, policy);
  const blocked = initialSplitPct === 0 || simulation.recommendation === 'BLOCK_DEPLOY';

  return {
    schemaVersion: CANARY_SCHEMA_VERSION,
    kind: 'CANARY_PLAN',
    mode: blocked ? 'blocked' : 'canary',
    candidateSha: input.sha || input.headSha || 'unknown',
    stableSha: input.rollbackTargetSha || input.stableSha || null,
    traffic: {
      stablePct: blocked ? 100 : 100 - initialSplitPct,
      candidatePct: blocked ? 0 : initialSplitPct,
      maxCandidatePct: policy.maxSplitPct,
      promoteStepPct: policy.promoteStepPct,
    },
    observation: {
      minimumMinutes: policy.minimumObservationMinutes,
      guardrails: policy.guardrails,
    },
    simulation,
    decision: blocked ? 'BLOCK_CANARY' : 'START_CANARY',
    reason: blocked
      ? 'Pre-deploy simulation blocked canary start.'
      : `Start canary at ${initialSplitPct}% candidate traffic.`,
    createdAt: new Date().toISOString(),
  };
}

export function decideCanaryProgress(input = {}) {
  const policy = { ...DEFAULT_CANARY_POLICY, ...(input.policy || {}) };
  const currentCandidatePct = clamp(toNumber(input.currentCandidatePct, policy.initialSplitPct), 0, 100);
  const stableSha = input.stableSha || input.rollbackTargetSha || null;
  const candidateSha = input.candidateSha || input.sha || 'unknown';
  const metrics = input.metrics || {};
  const guardrail = evaluateGuardrails(metrics, policy);

  const deploymentAssessment = scoreDeployRisk({
    deployment: {
      event: guardrail.passed ? 'CANARY_OBSERVATION_PASSED' : 'CANARY_GUARDRAIL_BREACHED',
      status: guardrail.passed ? 'observing' : 'degraded',
      repository: input.repository || 'bashasnoglu-jpg/SANTIS_SITE',
      workflow: 'canary-traffic-engine',
      runId: input.runId || 'canary-local',
      runUrl: input.runUrl || '',
      sha: candidateSha,
      image: input.image || `ghcr.io/bashasnoglu-jpg/santis-sovereign-os:sha-${candidateSha}`,
      timestamp: new Date().toISOString(),
    },
    previousDeployments: input.previousDeployments || [],
    metrics,
    rollbackTargetSha: stableSha,
  });

  const policyDecision = evaluateApprovalPolicy({
    assessment: deploymentAssessment,
    operator: input.operator || 'SOVEREIGN_ADMIN',
    environment: input.environment || 'production',
    policy: input.approvalPolicy,
  });

  if (!guardrail.passed || deploymentAssessment.score >= 85 || policyDecision.decision === 'BLOCKED') {
    return {
      schemaVersion: CANARY_SCHEMA_VERSION,
      kind: 'CANARY_DECISION',
      decision: 'ROLLBACK_CANARY',
      nextTraffic: {
        stablePct: 100,
        candidatePct: 0,
      },
      guardrail,
      assessment: deploymentAssessment,
      policyDecision,
      rollbackPlan: stableSha
        ? {
            action: 'ROLLBACK_DEPLOYMENT',
            target_sha: stableSha,
            reason: guardrail.violations.join(' ') || 'Canary risk exceeded rollback threshold.',
            requiresApproval: policyDecision.requiresHumanApproval,
          }
        : null,
      decidedAt: new Date().toISOString(),
    };
  }

  const nextCandidatePct = clamp(currentCandidatePct + policy.promoteStepPct, 0, policy.maxSplitPct);
  const fullyPromoted = nextCandidatePct >= policy.maxSplitPct && deploymentAssessment.score < 55;

  return {
    schemaVersion: CANARY_SCHEMA_VERSION,
    kind: 'CANARY_DECISION',
    decision: fullyPromoted ? 'PROMOTE_TO_STABLE' : 'INCREASE_TRAFFIC',
    nextTraffic: {
      stablePct: fullyPromoted ? 0 : 100 - nextCandidatePct,
      candidatePct: fullyPromoted ? 100 : nextCandidatePct,
    },
    guardrail,
    assessment: deploymentAssessment,
    policyDecision,
    rollbackPlan: null,
    decidedAt: new Date().toISOString(),
  };
}
