/**
 * santis-oracle-outcome-feedback-panel.js
 * Displays forecast vs reality feedback for guarded execution outcomes.
 */
import { SantisOracleExecutionOutcomeClient } from './santis-oracle-execution-outcome-client.js';

export class SantisOracleOutcomeFeedbackPanel {
  constructor({
    container = document.getElementById('oracle-outcome-feedback-container'),
    client = new SantisOracleExecutionOutcomeClient(),
  } = {}) {
    this.container = container;
    this.client = client;
    this.refresh = this.refresh.bind(this);
  }

  init() {
    if (!this.container) return;

    this.refresh();
    window.addEventListener('santis:oracle:outcome-feedback:recorded', this.refresh);
  }

  async refresh() {
    if (!this.container) return;

    try {
      const summary = await this.client.readSummary();
      this.render(summary);
    } catch (error) {
      console.warn('[Oracle Outcome Feedback] Failed to read outcome summary.', error);
      this.renderUnavailable();
    }
  }

  render(summary) {
    const outcomes = Array.isArray(summary?.outcomes) ? summary.outcomes.slice(0, 3) : [];

    this.container.innerHTML = `
      <div class="oracle-outcome-brief">
        <span>${this.escapeHtml(this.resolveSignalLabel(summary?.calibrationSignal))}</span>
        <p>${this.escapeHtml(this.resolveNarrative(summary))}</p>
      </div>
      <div class="oracle-outcome-grid">
        ${this.renderMetric('Outcomes', summary?.outcomeCount ?? 0)}
        ${this.renderMetric('Revenue delta', `${Number(summary?.averageRevenueDelta || 0)}%`)}
        ${this.renderMetric('Confidence delta', `${Number(summary?.averageConfidenceDelta || 0)}%`)}
      </div>
      <div class="oracle-outcome-list">
        ${outcomes.length ? outcomes.map((outcome) => this.renderOutcome(outcome)).join('') : '<div class="oracle-outcome-empty">No execution outcomes recorded yet.</div>'}
      </div>
    `;
  }

  resolveNarrative(summary) {
    if (!summary || !summary.outcomeCount) {
      return 'Outcome feedback is standing by. Approved plans can be measured once real-world execution results are recorded.';
    }

    if (summary.calibrationSignal === 'over_forecast') {
      return 'Reality is trailing forecast. Future Oracle confidence should be calibrated downward for similar execution plans.';
    }

    if (summary.calibrationSignal === 'under_forecast') {
      return 'Reality is outperforming forecast. Similar future scenarios can receive cautious confidence lift.';
    }

    return 'Forecast and reality are aligned. Current confidence calibration is holding within expected bounds.';
  }

  resolveSignalLabel(signal) {
    switch (signal) {
      case 'over_forecast':
        return 'Calibration - over forecast';
      case 'under_forecast':
        return 'Calibration - under forecast';
      case 'aligned':
        return 'Calibration - aligned';
      case 'awaiting_outcomes':
      default:
        return 'Awaiting execution outcomes';
    }
  }

  renderMetric(label, value) {
    return `
      <div class="oracle-outcome-metric">
        <span>${this.escapeHtml(label)}</span>
        <strong>${this.escapeHtml(String(value))}</strong>
      </div>
    `;
  }

  renderOutcome(outcome) {
    const revenueDelta = Number(outcome.actualRevenueLift || 0) - Number(outcome.forecastRevenueLift || 0);
    const confidenceDelta = Number(outcome.actualConfidence || 0) - Number(outcome.forecastConfidence || 0);

    return `
      <article class="oracle-outcome-card">
        <strong>${this.escapeHtml(outcome.executionStatus)}</strong>
        <p>${this.escapeHtml(outcome.targetNodeId || 'global')} - revenue delta ${revenueDelta}%, confidence delta ${confidenceDelta}%</p>
      </article>
    `;
  }

  renderUnavailable() {
    this.container.innerHTML = `
      <div class="oracle-outcome-empty">
        Outcome feedback is unavailable. Forecasting remains read-only.
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
