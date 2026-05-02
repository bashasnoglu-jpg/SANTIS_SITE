'use strict';

/**
 * Santis OS Approval Policy Engine
 * Converts deploy risk assessments into deterministic governance decisions.
 */

const APPROVAL_POLICY_SCHEMA_VERSION = '1.0.0';

const DEFAULT_POLICY = Object.freeze({
  autoRollbackEnabled: false,
  emergencyAutoRollbackEnabled: true,
  emergencyRollbackScore: 95,
  requireApprovalScore: 75,
  requireTwoPersonRuleScore: 90,
  allowedAutoRollbackEvents: ['DEPLOYMENT_FAILED', 'ROLLBACK_FAILED'],
  blockedEnvironments: ['production_locked'],
  allowedOperators: ['SOVEREIGN_ADMIN', 'BOARDROOM_OPERATOR'],
});

function isAllowedOperator(operator, policy) {
  return typeof operator === 'string' && policy.allowedOperators.includes(operator);
}

function evaluateApprovalPolicy(input = {}) {
  const policy = { ...DEFAULT_POLICY, ...(input.policy || {}) };
  const assessment = input.assessment || {};
  const operator = input.operator || 'SYSTEM';
  const environment = input.environment || 'production';
  const score = typeof assessment.score === 'number' ? assessment.score : 0;
  const event = assessment.deployment?.event || input.event || 'UNKNOWN';
  const rollbackRecommended = assessment.rollbackRecommended === true;

  const violations = [];
  const gates = [];

  if (policy.blockedEnvironments.includes(environment)) {
    violations.push('Environment is locked for automated rollback.');
  }

  if (!rollbackRecommended && score < policy.requireApprovalScore) {
    return {
      schemaVersion: APPROVAL_POLICY_SCHEMA_VERSION,
      kind: 'APPROVAL_POLICY_DECISION',
      decision: 'OBSERVE',
      approvedForExecution: false,
      requiresHumanApproval: false,
      requiresTwoPersonRule: false,
      operator,
      environment,
      gates,
      violations,
      reason: 'Risk below approval threshold.',
      decidedAt: new Date().toISOString(),
    };
  }

  if (score >= policy.requireTwoPersonRuleScore) {
    gates.push('TWO_PERSON_RULE');
  }

  if (!isAllowedOperator(operator, policy) && operator !== 'SYSTEM') {
    violations.push(`Operator ${operator} is not allowed by policy.`);
  }

  const eventEligibleForAutoRollback = policy.allowedAutoRollbackEvents.includes(event);
  const emergencyEligible =
    policy.emergencyAutoRollbackEnabled &&
    score >= policy.emergencyRollbackScore &&
    eventEligibleForAutoRollback &&
    violations.length === 0;

  if (emergencyEligible) {
    return {
      schemaVersion: APPROVAL_POLICY_SCHEMA_VERSION,
      kind: 'APPROVAL_POLICY_DECISION',
      decision: 'AUTO_ROLLBACK_APPROVED',
      approvedForExecution: true,
      requiresHumanApproval: false,
      requiresTwoPersonRule: false,
      operator: 'SYSTEM',
      environment,
      gates,
      violations,
      reason: `Emergency auto-rollback approved at score ${score}.`,
      decidedAt: new Date().toISOString(),
    };
  }

  if (policy.autoRollbackEnabled && rollbackRecommended && violations.length === 0 && eventEligibleForAutoRollback) {
    return {
      schemaVersion: APPROVAL_POLICY_SCHEMA_VERSION,
      kind: 'APPROVAL_POLICY_DECISION',
      decision: 'AUTO_ROLLBACK_APPROVED',
      approvedForExecution: true,
      requiresHumanApproval: false,
      requiresTwoPersonRule: false,
      operator: 'SYSTEM',
      environment,
      gates,
      violations,
      reason: 'Auto-rollback enabled and rollback criteria satisfied.',
      decidedAt: new Date().toISOString(),
    };
  }

  if (violations.length > 0) {
    return {
      schemaVersion: APPROVAL_POLICY_SCHEMA_VERSION,
      kind: 'APPROVAL_POLICY_DECISION',
      decision: 'BLOCKED',
      approvedForExecution: false,
      requiresHumanApproval: true,
      requiresTwoPersonRule: gates.includes('TWO_PERSON_RULE'),
      operator,
      environment,
      gates,
      violations,
      reason: violations.join(' '),
      decidedAt: new Date().toISOString(),
    };
  }

  return {
    schemaVersion: APPROVAL_POLICY_SCHEMA_VERSION,
    kind: 'APPROVAL_POLICY_DECISION',
    decision: 'APPROVAL_REQUIRED',
    approvedForExecution: false,
    requiresHumanApproval: true,
    requiresTwoPersonRule: gates.includes('TWO_PERSON_RULE'),
    operator,
    environment,
    gates,
    violations,
    reason: `Human approval required at deploy risk score ${score}.`,
    decidedAt: new Date().toISOString(),
  };
}

module.exports = {
  APPROVAL_POLICY_SCHEMA_VERSION,
  DEFAULT_POLICY,
  evaluateApprovalPolicy,
};
