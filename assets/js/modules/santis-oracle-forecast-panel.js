/**
 * santis-oracle-forecast-panel.js
 * Displays statistical forecast baseline next to heuristic Oracle intelligence.
 */
import { SantisOracleStatisticalForecastClient } from './santis-oracle-statistical-forecast-client.js';

export class SantisOracleForecastPanel {
  constructor({
    container = document.getElementById('oracle-statistical-forecast-container'),
    client = new SantisOracleStatisticalForecastClient(),
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
      const forecast = await this.client.read();
      this.render(forecast);
    } catch (error) {
      console.warn('[Oracle Forecast Panel] Failed to read statistical forecast.', error);
      this.renderUnavailable();
    }
  }

  render(forecast) {
    this.container.innerHTML = `
      <div class="oracle-forecast-brief">
        <span>${this.escapeHtml(this.resolveComparisonLabel(forecast?.heuristicComparison))}</span>
        <p>${this.escapeHtml(this.resolveNarrative(forecast))}</p>
      </div>
      <div class="oracle-forecast-grid">
        ${this.renderMetric('Baseline', `${Number(forecast?.baselineForecast || 0)}%`)}
        ${this.renderMetric('Trend', forecast?.trend || 'insufficient_data')}
        ${this.renderMetric('Variance', Number(forecast?.variance || 0).toFixed(2))}
        ${this.renderMetric('Stat confidence', Number(forecast?.confidence || 0).toFixed(2))}
        ${this.renderMetric('Hybrid confidence', Number(forecast?.hybridConfidence || 0).toFixed(2))}
        ${this.renderMetric('Samples', forecast?.sampleSize ?? 0)}
      </div>
    `;
  }

  resolveNarrative(forecast) {
    if (!forecast || forecast.sampleSize < 3) {
      return 'Statistical baseline is collecting outcome density. Heuristic Oracle forecasts remain the primary reference until enough outcomes exist.';
    }

    if (forecast.heuristicComparison === 'overconfidence_flag') {
      return 'Heuristic forecast is materially above statistical baseline. Treat future recommendations as overconfidence risk until more outcomes align.';
    }

    if (forecast.heuristicComparison === 'missed_opportunity') {
      return 'Statistical baseline is outperforming heuristic expectation. Similar future scenarios may represent missed opportunity.';
    }

    return 'Heuristic and statistical forecast are aligned. Hybrid confidence can be lifted cautiously for similar strategy windows.';
  }

  resolveComparisonLabel(comparison) {
    switch (comparison) {
      case 'aligned':
        return 'Hybrid forecast aligned';
      case 'overconfidence_flag':
        return 'Overconfidence flag';
      case 'missed_opportunity':
        return 'Missed opportunity';
      case 'insufficient_data':
      default:
        return 'Collecting statistical baseline';
    }
  }

  renderMetric(label, value) {
    return `
      <div class="oracle-forecast-metric">
        <span>${this.escapeHtml(label)}</span>
        <strong>${this.escapeHtml(String(value))}</strong>
      </div>
    `;
  }

  renderUnavailable() {
    this.container.innerHTML = `
      <div class="oracle-forecast-empty">
        Statistical forecast is unavailable. Heuristic Oracle remains active.
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
