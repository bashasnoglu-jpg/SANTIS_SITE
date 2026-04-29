/**
 * santis-oracle-human-approval-loop.js
 * Captures human decisions for Oracle Action Rail recommendations.
 */
import { SantisOracleActionMemory } from './santis-oracle-action-memory.js';

export class SantisOracleHumanApprovalLoop {
  constructor({
    container = document.getElementById('oracle-action-rail-container'),
    memory = new SantisOracleActionMemory(),
  } = {}) {
    this.container = container;
    this.memory = memory;
    this.actions = new Map();
    this.handleDecisionClick = this.handleDecisionClick.bind(this);
    this.handleActionsRendered = this.handleActionsRendered.bind(this);

    this.init();
  }

  init() {
    if (!this.container) return;

    this.container.addEventListener('click', this.handleDecisionClick);
    window.addEventListener('santis:oracle:actions:rendered', this.handleActionsRendered);
  }

  handleActionsRendered(event) {
    const actions = event.detail?.actions || [];

    actions.forEach((action) => {
      this.actions.set(action.id, action);
    });

    this.applyStoredDecisionStates();
  }

  handleDecisionClick(event) {
    const button = event.target.closest('[data-oracle-decision]');
    if (!button || !this.container.contains(button)) return;

    const card = button.closest('[data-oracle-action-id]');
    const actionId = card?.dataset.oracleActionId;
    const action = this.actions.get(actionId);
    const decision = button.dataset.oracleDecision;

    if (!action || !this.isValidDecision(decision)) return;

    const decisionEvent = this.createDecisionEvent(action, decision);
    const record = this.memory.recordDecision(decisionEvent);

    window.dispatchEvent(new CustomEvent('santis:oracle:action:decision', {
      detail: record,
    }));

    this.markCardDecision(card, record);
  }

  createDecisionEvent(action, decision) {
    return {
      type: 'ORACLE_ACTION_DECISION',
      actionId: action.id,
      decision,
      confidence: Number(action.confidenceScore || 0),
      riskLevel: action.riskLevel,
      suggestedAction: action.suggestedAction,
      evidence: action.evidenceTrail || [],
      timestamp: new Date().toISOString(),
    };
  }

  applyStoredDecisionStates() {
    if (!this.container) return;

    this.container.querySelectorAll('[data-oracle-action-id]').forEach((card) => {
      const record = this.memory.getDecision(card.dataset.oracleActionId);
      if (record) this.markCardDecision(card, record);
    });
  }

  markCardDecision(card, record) {
    if (!card) return;

    card.classList.add('oracle-action-card-decided');
    card.dataset.oracleDecisionState = record.decision;

    const status = card.querySelector('[data-oracle-decision-status]');
    if (status) {
      status.textContent = this.resolveStatusLabel(record);
    }

    card.querySelectorAll('[data-oracle-decision]').forEach((button) => {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    });
  }

  resolveStatusLabel(record) {
    const label = {
      approved: 'Approved by human operator',
      dismissed: 'Dismissed by human operator',
      escalated: 'Escalated to Boardroom review',
    }[record.decision] || 'Decision recorded';

    return `${label} at ${new Date(record.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  isValidDecision(decision) {
    return ['approved', 'dismissed', 'escalated'].includes(decision);
  }
}
