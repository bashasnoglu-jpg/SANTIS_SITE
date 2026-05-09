/**
 * santis-oracle-simulation-panel.js
 * Executive decision preview for risk-adjusted Oracle strategy simulations.
 */
import { SantisOracleStrategySimulator } from './santis-oracle-strategy-simulator.js';

export class SantisOracleSimulationPanel {
  constructor({
    container = document.getElementById('oracle-strategy-simulation-container'),
    simulator = new SantisOracleStrategySimulator(),
  } = {}) {
    this.container = container;
    this.simulator = simulator;
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
      const simulation = await this.simulator.read();
      this.render(simulation);
    } catch (error) {
      console.warn('[Oracle Simulation Panel] Failed to read strategy simulation.', error);
      this.renderUnavailable();
    }
  }

  render(simulation) {
    const scenarios = Array.isArray(simulation?.scenarios) ? simulation.scenarios.slice(0, 2) : [];

    this.container.innerHTML = `
      <div class="oracle-simulation-brief">
        <span>Executive Decision Preview</span>
        <p>${this.escapeHtml(this.resolvePreview(simulation))}</p>
      </div>
      <div class="oracle-simulation-grid">
        ${scenarios.map((scenario) => this.renderScenario(scenario, simulation?.recommendedScenarioId)).join('')}
      </div>
    `;
  }

  resolvePreview(simulation) {
    if (!simulation || !simulation.scenarioCount) {
      return 'Strategy simulation is standing by. Cross-node learning needs a transferable pattern before outcome projection.';
    }

    return simulation.executivePreview;
  }

  renderScenario(scenario, recommendedScenarioId) {
    const isRecommended = scenario.scenarioId === recommendedScenarioId;

    return `
      <article class="oracle-simulation-card ${isRecommended ? 'oracle-simulation-card-recommended' : ''}">
        <div class="oracle-simulation-card-header">
          <strong>${this.escapeHtml(scenario.label)}</strong>
          <span>${isRecommended ? 'Recommended' : this.escapeHtml(scenario.riskLevel)}</span>
        </div>
        <p>${this.escapeHtml(scenario.strategy)}</p>
        <div class="oracle-simulation-metrics">
          ${this.renderMetric('Revenue lift', `${Number(scenario.projectedRevenueLift || 0)}%`)}
          ${this.renderMetric('Approval', `${Number(scenario.projectedApprovalRate || 0)}%`)}
          ${this.renderMetric('Risk confidence', `${Number(scenario.riskAdjustedConfidence || 0)}%`)}
        </div>
        <ol>
          ${(scenario.decisionPath || []).map((step) => `<li>${this.escapeHtml(step)}</li>`).join('')}
        </ol>
      </article>
    `;
  }

  renderMetric(label, value) {
    return `
      <div>
        <span>${this.escapeHtml(label)}</span>
        <strong>${this.escapeHtml(value)}</strong>
      </div>
    `;
  }

  renderUnavailable() {
    this.container.innerHTML = `
      <div class="oracle-simulation-empty">
        Strategy simulation is unavailable. Human approval gates remain active.
      </div>
    `;
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
