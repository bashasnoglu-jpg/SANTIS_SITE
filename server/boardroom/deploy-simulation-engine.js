'use strict';

/**
 * Santis OS Deploy Simulation Engine
 * Pre-deployment deterministic simulation layer.
 * It estimates risk before publishing an image and routes the outcome through
 * the Approval Policy Engine.
 */

const { scoreDeployRisk } = require('./deploy-risk-engine.js');
const { evaluateApprovalPolicy } = require('./approval-policy-engine.js');

const DEPLOY_SIMULATION_SCHEMA_VERSION = '1.0.0';

const DEFAULT_SIMULATION_WEIGHTS = Object.freeze({
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
});

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeFiles(files) {
  return Array.isArray(files)
    ? files.filter((file) => typeof file === 'string' && file.trim()).map((file) => file.trim())
    : [];
}

function includesPath(files, predicate) {
  return files.some(predicate);
}

function buildSyntheticDeployment(input) {
  return {
    event: 'PRE_DEPLOY_SIMULATION',
    status: 'simulated',
    repository: input.repository || 'bashasnoglu-jpg/SANTIS_SITE',
    workflow: input.workflow || 'docker-publish',
    runId: input.runId || 'simulation',
    runUrl: input.runUrl || '',
    sha: input.sha || input.headSha || 'unknown',
    image: input.image || 'ghcr.io/bashasnoglu-jpg/santis-sovereign-os:simulation',
    timestamp: new Date().toISOString(),
  };
}

function scoreChangeSurface(input = {}) {
  const weights = { ...DEFAULT_SIMULATION_WEIGHTS, ...(input.weights || {}) };
  const files = normalizeFiles(input.changedFiles);
  const diffStats = input.diffStats && typeof input.diffStats === 'object' ? input.diffStats : {};
  const ci = input.ci && typeof input.ci === 'object' ? input.ci : {};
  const context = input.context && typeof input.context === 'object' ? input.context : {};

  let score = 0;
  const reasons = [];
  const signals = {
    changedFileCount: files.length,
    additions: Number(diffStats.additions || 0),
    deletions: Number(diffStats.deletions || 0),
  };

  if (includesPath(files, (file) => /(^|\/)package(-lock)?\.json$|pnpm-lock\.yaml$|yarn\.lock$/.test(file))) {
    score += weights.packageChange;
    reasons.push('Dependency or lockfile surface changed.');
    signals.packageChange = true;
  }

  if (includesPath(files, (file) => file.startsWith('.github/workflows/'))) {
    score += weights.workflowChange;
    reasons.push('CI/CD workflow surface changed.');
    signals.workflowChange = true;
  }

  if (includesPath(files, (file) => file === 'server.js' || file.startsWith('server/'))) {
    score += weights.serverChange;
    reasons.push('Server/runtime surface changed.');
    signals.serverChange = true;
  }

  if (includesPath(files, (file) => file.includes('boardroom'))) {
    score += weights.boardroomChange;
    reasons.push('Boardroom control surface changed.');
    signals.boardroomChange = true;
  }

  if (includesPath(files, (file) => /^(assets|admin|tr|en|index\.html)/.test(file))) {
    score += weights.publicSurfaceChange;
    reasons.push('Public or admin UI surface changed.');
    signals.publicSurfaceChange = true;
  }

  const churn = Number(diffStats.additions || 0) + Number(diffStats.deletions || 0);
  signals.churn = churn;
  if (churn >= 750 || files.length >= 25) {
    score += weights.largeDiff;
    reasons.push('Large diff/churn detected.');
    signals.largeDiff = true;
  }

  if (ci.testsPresent === false) {
    score += weights.missingTests;
    reasons.push('No test evidence supplied for simulation.');
    signals.testsPresent = false;
  }

  if (ci.status === 'failure' || ci.status === 'cancelled') {
    score += weights.failingChecks;
    reasons.push(`CI status is ${ci.status}.`);
    signals.ciStatus = ci.status;
  }

  if (!input.rollbackTargetSha) {
    score += weights.noRollbackTarget;
    reasons.push('No rollback target SHA supplied.');
    signals.rollbackTargetReady = false;
  } else {
    signals.rollbackTargetReady = true;
  }

  if (context.trafficWindow === 'peak') {
    score += weights.peakTrafficWindow;
    reasons.push('Deployment planned during peak traffic window.');
    signals.trafficWindow = 'peak';
  }

  return {
    score: clampScore(score),
    reasons,
    signals,
  };
}

function simulateDeployment(input = {}) {
  const changeRisk = scoreChangeSurface(input);

  const metrics = {
    conversionDeltaPct: input.predictedMetrics?.conversionDeltaPct ?? -Math.round(changeRisk.score / 10),
    revenueDeltaPct: input.predictedMetrics?.revenueDeltaPct ?? -Math.round(changeRisk.score / 12),
    hesitationIndex: input.predictedMetrics?.hesitationIndex ?? Math.min(100, 35 + changeRisk.score),
    errorRatePct: input.predictedMetrics?.errorRatePct ?? Number((changeRisk.score / 18).toFixed(1)),
    p95LatencyMs: input.predictedMetrics?.p95LatencyMs ?? 450 + changeRisk.score * 9,
  };

  const assessment = scoreDeployRisk({
    deployment: buildSyntheticDeployment(input),
    previousDeployments: input.previousDeployments || [],
    metrics,
    rollbackTargetSha: input.rollbackTargetSha,
  });

  const combinedScore = clampScore(Math.round((assessment.score * 0.65) + (changeRisk.score * 0.35)));
  const simulationAssessment = {
    ...assessment,
    kind: 'PRE_DEPLOY_RISK_ASSESSMENT',
    score: combinedScore,
    severity:
      combinedScore >= 85 ? 'rollback_recommended' :
      combinedScore >= 75 ? 'critical' :
      combinedScore >= 55 ? 'warning' :
      'stable',
    rollbackRecommended: combinedScore >= 85,
    signals: {
      ...assessment.signals,
      changeSurface: changeRisk.signals,
      simulatedMetrics: metrics,
    },
    reasons: [...changeRisk.reasons, ...assessment.reasons],
  };

  const policyDecision = evaluateApprovalPolicy({
    assessment: simulationAssessment,
    operator: input.operator || 'SOVEREIGN_ADMIN',
    environment: input.environment || 'production',
    policy: input.policy,
  });

  const recommendation = deriveSimulationRecommendation(simulationAssessment, policyDecision);

  return {
    schemaVersion: DEPLOY_SIMULATION_SCHEMA_VERSION,
    kind: 'DEPLOY_SIMULATION_RESULT',
    recommendation,
    changeRisk,
    assessment: simulationAssessment,
    policyDecision,
    rollbackPlan: input.rollbackTargetSha
      ? {
          action: 'ROLLBACK_DEPLOYMENT',
          target_sha: input.rollbackTargetSha,
          reason: `Pre-deploy simulation fallback for ${input.sha || input.headSha || 'unknown'}`,
          requiresApproval: true,
        }
      : null,
    simulatedAt: new Date().toISOString(),
  };
}

function deriveSimulationRecommendation(assessment, policyDecision) {
  if (policyDecision.decision === 'BLOCKED') {
    return 'BLOCK_DEPLOY';
  }

  if (assessment.score >= 85) {
    return 'HOLD_AND_PREPARE_ROLLBACK';
  }

  if (policyDecision.requiresTwoPersonRule) {
    return 'REQUIRE_TWO_PERSON_APPROVAL';
  }

  if (policyDecision.requiresHumanApproval || assessment.score >= 75) {
    return 'REQUIRE_APPROVAL';
  }

  if (assessment.score >= 55) {
    return 'CANARY_ONLY';
  }

  return 'GO';
}

module.exports = {
  DEPLOY_SIMULATION_SCHEMA_VERSION,
  DEFAULT_SIMULATION_WEIGHTS,
  scoreChangeSurface,
  simulateDeployment,
};
