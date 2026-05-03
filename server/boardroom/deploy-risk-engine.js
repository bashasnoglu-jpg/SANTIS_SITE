/**
 * Santis OS Deploy Risk Engine
 * Deterministic infrastructure risk scoring for Boardroom deployment governance.
 */

export const DEPLOY_RISK_SCHEMA_VERSION = '1.0.0';

export const DEFAULT_THRESHOLDS = Object.freeze({
  warning: 55,
  critical: 75,
  rollback: 85,
});

export const DEFAULT_WEIGHTS = Object.freeze({
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
});

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeDeploymentEvent(event) {
  if (!event || typeof event !== 'object') {
    return null;
  }

  return {
    event: String(event.event || event.type || '').trim(),
    status: String(event.status || '').trim(),
    repository: String(event.repository || '').trim(),
    workflow: String(event.workflow || '').trim(),
    runId: String(event.runId || event.run_id || '').trim(),
    runUrl: String(event.runUrl || event.run_url || '').trim(),
    sha: String(event.sha || '').trim(),
    image: String(event.image || '').trim(),
    operator: typeof event.operator === 'string' ? event.operator : undefined,
    reason: typeof event.reason === 'string' ? event.reason : undefined,
    timestamp: event.timestamp || new Date().toISOString(),
  };
}

function deriveSeverity(score, thresholds = DEFAULT_THRESHOLDS) {
  if (score >= thresholds.rollback) return 'rollback_recommended';
  if (score >= thresholds.critical) return 'critical';
  if (score >= thresholds.warning) return 'warning';
  return 'stable';
}

export function scoreDeployRisk(input = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...(input.weights || {}) };
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(input.thresholds || {}) };
  const deployment = normalizeDeploymentEvent(input.deployment);
  const previousDeployments = Array.isArray(input.previousDeployments)
    ? input.previousDeployments.map(normalizeDeploymentEvent).filter(Boolean)
    : [];
  const metrics = input.metrics && typeof input.metrics === 'object' ? input.metrics : {};

  let score = 0;
  const reasons = [];
  const signals = {};

  const currentEvent = deployment?.event || 'UNKNOWN';
  signals.currentEvent = currentEvent;

  if (currentEvent === 'DEPLOYMENT_FAILED') {
    score += weights.deploymentFailed;
    reasons.push('Current deployment failed.');
  }

  if (currentEvent === 'ROLLBACK_FAILED') {
    score += weights.rollbackFailed;
    reasons.push('Rollback attempt failed.');
  }

  const recentFailures = previousDeployments.filter((item) =>
    ['DEPLOYMENT_FAILED', 'ROLLBACK_FAILED'].includes(item.event)
  ).length;
  signals.recentFailures = recentFailures;
  if (recentFailures >= 2) {
    score += weights.repeatedFailure;
    reasons.push('Repeated deployment failures detected.');
  }

  const hasRecentPublishedImage = previousDeployments.some((item) => item.event === 'IMAGE_PUBLISHED');
  signals.hasRecentPublishedImage = hasRecentPublishedImage;
  if (!hasRecentPublishedImage && currentEvent !== 'IMAGE_PUBLISHED') {
    score += weights.publishMissing;
    reasons.push('No recent successful image publication found.');
  }

  const hasRecentRollback = previousDeployments.some((item) => item.event === 'ROLLBACK_COMPLETED');
  signals.hasRecentRollback = hasRecentRollback;
  if (hasRecentRollback && currentEvent !== 'ROLLBACK_COMPLETED') {
    score += weights.recentRollback;
    reasons.push('Recent rollback indicates unstable deployment surface.');
  }

  const conversionDelta = toNumber(metrics.conversionDeltaPct);
  signals.conversionDeltaPct = conversionDelta;
  if (conversionDelta <= -8) {
    score += weights.conversionDrop;
    reasons.push(`Conversion drop crossed threshold (${conversionDelta}%).`);
  }

  const revenueDelta = toNumber(metrics.revenueDeltaPct);
  signals.revenueDeltaPct = revenueDelta;
  if (revenueDelta <= -10) {
    score += weights.revenueDrop;
    reasons.push(`Revenue drop crossed threshold (${revenueDelta}%).`);
  }

  const hesitationIndex = toNumber(metrics.hesitationIndex);
  signals.hesitationIndex = hesitationIndex;
  if (hesitationIndex >= 70) {
    score += weights.highHesitation;
    reasons.push(`Hesitation index is elevated (${hesitationIndex}).`);
  }

  const errorRate = toNumber(metrics.errorRatePct);
  signals.errorRatePct = errorRate;
  if (errorRate >= 5) {
    score += weights.highErrorRate;
    reasons.push(`Runtime error rate is elevated (${errorRate}%).`);
  }

  const p95LatencyMs = toNumber(metrics.p95LatencyMs);
  signals.p95LatencyMs = p95LatencyMs;
  if (p95LatencyMs >= 1200) {
    score += weights.highLatency;
    reasons.push(`P95 latency breached budget (${p95LatencyMs}ms).`);
  }

  const finalScore = clampScore(score);
  const severity = deriveSeverity(finalScore, thresholds);
  const rollbackRecommended = severity === 'rollback_recommended';

  return {
    schemaVersion: DEPLOY_RISK_SCHEMA_VERSION,
    kind: 'DEPLOY_RISK_ASSESSMENT',
    score: finalScore,
    severity,
    rollbackRecommended,
    deployment,
    signals,
    reasons,
    recommendedAction: rollbackRecommended
      ? {
          action: 'ROLLBACK_DEPLOYMENT',
          target_sha: input.rollbackTargetSha || deployment?.sha || null,
          reason: reasons.join(' '),
          requiresApproval: true,
        }
      : severity === 'critical'
        ? { action: 'HOLD_DEPLOYMENT', requiresApproval: true, reason: reasons.join(' ') }
        : { action: 'OBSERVE', requiresApproval: false, reason: reasons.join(' ') || 'Deployment surface stable.' },
    assessedAt: new Date().toISOString(),
  };
}
