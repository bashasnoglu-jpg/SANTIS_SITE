/**
 * santis-oracle-executive-narrative.js
 * Renders the CEO cockpit narrative for Boardroom Oracle v2.
 */
import { SantisOracleStrategicAlerts } from './santis-oracle-strategic-alerts.js';
import { SantisOracleRevenuePlaybook } from './santis-oracle-revenue-playbook.js';

export class SantisOracleExecutiveNarrative {
  constructor({
    container = document.getElementById('oracle-executive-mode-container'),
    strategicAlerts = new SantisOracleStrategicAlerts(),
    revenuePlaybook = new SantisOracleRevenuePlaybook(),
  } = {}) {
    this.container = container;
    this.strategicAlerts = strategicAlerts;
    this.revenuePlaybook = revenuePlaybook;
  }

  render(insights = [], metrics = {}) {
    if (!this.container) return;

    const alerts = this.strategicAlerts.generate(insights, metrics);
    const playbook = this.revenuePlaybook.generate(insights, metrics);
    const narrative = this.buildNarrative(insights, metrics, alerts, playbook);

    this.container.innerHTML = `
      <div class="oracle-executive-brief">
        <span class="oracle-executive-kicker">Executive narrative</span>
        <p>${this.escapeHtml(narrative)}</p>
      </div>
      <div class="oracle-executive-grid">
        <div class="oracle-executive-panel">
          <h3>Strategic Alerts</h3>
          ${this.renderAlerts(alerts)}
        </div>
        <div class="oracle-executive-panel">
          <h3>Revenue Playbook</h3>
          ${this.renderPlaybook(playbook)}
        </div>
      </div>
    `;
  }

  buildNarrative(insights, metrics, alerts, playbook) {
    const vipLeads = Number(metrics.vipLeads || this.getVipSegmentCount(metrics) || 0);
    const bookings = Number(metrics.bookings || metrics.bookingCount || 0);
    const averageLeadValue = Number(metrics.averageLeadValue || 0);
    const topInsight = [...insights].sort((a, b) => Number(b.confidenceScore || 0) - Number(a.confidenceScore || 0))[0];
    const topPlay = playbook[0]?.title || 'Keep Boardroom review active until the next confirming signal lands';

    if (!topInsight) {
      return 'Oracle is monitoring the live stream. Executive strategy will activate when a decision-grade signal appears.';
    }

    if (vipLeads > 0 && bookings > 0 && vipLeads / bookings >= 0.5) {
      return `VIP intent quality is rising faster than booking volume. A low-volume, high-value Sovereign window is forming with €${Math.round(averageLeadValue).toLocaleString('en-US')} average lead value. Recommended strategy: ${topPlay}.`;
    }

    if (alerts.some((alert) => alert.level === 'high')) {
      return `Oracle sees a high-priority strategic condition with ${topInsight.confidenceScore}% confidence. Keep human approval active, validate capacity, and run the next move through the revenue playbook.`;
    }

    return `Oracle has a calibrated ${topInsight.confidenceScore}% confidence signal. The current executive move is to ${topPlay.toLowerCase()} while the learning loop continues to tune future recommendations.`;
  }

  renderAlerts(alerts) {
    if (alerts.length === 0) {
      return '<div class="oracle-executive-empty">No strategic alerts above threshold.</div>';
    }

    return alerts.map((alert) => `
      <article class="oracle-strategic-alert oracle-alert-${this.escapeHtml(alert.level)}">
        <strong>${this.escapeHtml(alert.title)}</strong>
        <p>${this.escapeHtml(alert.detail)}</p>
      </article>
    `).join('');
  }

  renderPlaybook(playbook) {
    if (playbook.length === 0) {
      return '<div class="oracle-executive-empty">No revenue playbook suggestion yet.</div>';
    }

    return playbook.map((play) => `
      <article class="oracle-playbook-card">
        <span>${this.escapeHtml(play.cadence)}</span>
        <strong>${this.escapeHtml(play.title)}</strong>
        <p>${this.escapeHtml(play.action)}</p>
      </article>
    `).join('');
  }

  getVipSegmentCount(metrics) {
    return Array.isArray(metrics.vipSegments) ? metrics.vipSegments.length : 0;
  }

  escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
