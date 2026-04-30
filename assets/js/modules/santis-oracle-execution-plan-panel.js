/**
 * santis-oracle-execution-plan-panel.js
 * Human-gated execution planning panel. It never applies actions.
 */
import { SantisOracleExecutionGuard } from './santis-oracle-execution-guard.js';

export class SantisOracleExecutionPlanPanel {
  constructor({
    container = document.getElementById('oracle-execution-plan-container'),
    guard = new SantisOracleExecutionGuard(),
  } = {}) {
    this.container = container;
    this.guard = guard;
    this.refresh = this.refresh.bind(this);
  }

  init() {
    if (!this.container) return;

    this.refresh();
    window.addEventListener('santis:oracle:action-memory:synced', this.refresh);
    window.addEventListener('santis:oracle:action-memory:hydrated', this.refresh);
  }

  async refresh() {
    if (!this.container) return;

    try {
      const plan = await this.guard.read();
      this.render(plan);
    } catch (error) {
      console.warn('[Oracle Execution Plan] Failed to read execution guard.', error);
      this.renderUnavailable();
    }
  }

  render(plan) {
    this.container.innerHTML = `
      <div class="oracle-execution-brief">
        <span>${this.escapeHtml(this.resolveStatusLabel(plan?.status))}</span>
        <p>${this.escapeHtml(plan?.rationale || 'Execution guard is standing by. No operational plan is active.')}</p>
      </div>
      <div class="oracle-execution-grid">
        <div class="oracle-execution-panel">
          <h3>Guardrails</h3>
          ${this.renderGuardrails(plan?.guardrails || [])}
        </div>
        <div class="oracle-execution-panel">
          <h3>Suggested Execution Plan</h3>
          ${this.renderSteps(plan?.steps || [])}
        </div>
      </div>
    `;
  }

  renderGuardrails(guardrails) {
    if (!guardrails.length) {
      return '<div class="oracle-execution-empty">No guardrails are active yet.</div>';
    }

    return guardrails.map((guardrail) => `
      <div class="oracle-guardrail ${guardrail.passed ? 'oracle-guardrail-pass' : 'oracle-guardrail-block'}">
        <strong>${this.escapeHtml(guardrail.label)}</strong>
        <p>${this.escapeHtml(String(guardrail.actual))} / ${this.escapeHtml(String(guardrail.threshold))}</p>
      </div>
    `).join('');
  }

  renderSteps(steps) {
    if (!steps.length) {
      return '<div class="oracle-execution-empty">No execution plan is recommended. Human approval remains required.</div>';
    }

    return `
      <ol class="oracle-execution-steps">
        ${steps.map((step) => `
          <li>
            <strong>${this.escapeHtml(step.label)}</strong>
            <p>${this.escapeHtml(step.detail)}</p>
          </li>
        `).join('')}
      </ol>
      <div class="oracle-execution-human-gate">Human approval required. No auto-apply.</div>
    `;
  }

  resolveStatusLabel(status) {
    switch (status) {
      case 'human_approval_required':
        return 'Human approval required';
      case 'not_recommended':
        return 'Not recommended';
      case 'awaiting_signal':
      default:
        return 'Awaiting guarded signal';
    }
  }

  renderUnavailable() {
    this.container.innerHTML = `
      <div class="oracle-execution-empty">
        Execution guard is unavailable. Auto-apply remains disabled.
      </div>
    `;
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
