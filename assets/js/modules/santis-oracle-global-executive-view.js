/**
 * santis-oracle-global-executive-view.js
 * Read-only Global Oracle aggregation view for the Boardroom.
 */
import { SantisOracleActionMemoryClient } from './santis-oracle-action-memory-client.js';
import { SantisOracleGlobalContext } from './santis-oracle-global-context.js';
import { SantisOracleCrossNodeLearning } from './santis-oracle-cross-node-learning.js';
import { SantisOracleNetworkStrategy } from './santis-oracle-network-strategy.js';

export class SantisOracleGlobalExecutiveView {
  constructor({
    container = document.getElementById('oracle-global-executive-view-container'),
    client = new SantisOracleActionMemoryClient(),
    globalContext = new SantisOracleGlobalContext(),
    limit = 250,
    crossNodeLearning = new SantisOracleCrossNodeLearning({ client, limit }),
    networkStrategy = new SantisOracleNetworkStrategy(),
  } = {}) {
    this.container = container;
    this.client = client;
    this.globalContext = globalContext;
    this.crossNodeLearning = crossNodeLearning;
    this.networkStrategy = networkStrategy;
    this.limit = limit;
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
      const [data, learning] = await Promise.all([
        this.client.readGlobalAggregation({ limit: this.limit }),
        this.crossNodeLearning.read(),
      ]);
      this.render(data, learning);
    } catch (error) {
      console.warn('[Oracle Global Executive View] Failed to read global aggregation.', error);
      this.renderUnavailable();
    }
  }

  render(data, learning = null) {
    const context = this.globalContext.resolve();
    const signals = Array.isArray(data?.signals) ? data.signals.slice(0, 3) : [];

    this.container.innerHTML = `
      <div class="oracle-executive-brief">
        <div class="oracle-executive-kicker">Global aggregation - ${this.escapeHtml(context.networkId)}</div>
        <p>${this.escapeHtml(this.resolveNarrative(data, context))}</p>
      </div>
      <div class="oracle-executive-grid">
        <div class="oracle-executive-panel">
          <h3>Network Signals</h3>
          ${signals.map((signal) => this.renderSignal(signal)).join('')}
        </div>
        <div class="oracle-executive-panel">
          <h3>Cross-node Readiness</h3>
          ${this.renderMetricCard('Nodes', data?.nodeCount ?? 0, 'Tagged Oracle memory sources')}
          ${this.renderMetricCard('Global Approval', `${data?.globalApprovalRate ?? 0}%`, 'Approved decision density')}
          ${this.renderMetricCard('Escalation', `${data?.globalEscalationRate ?? 0}%`, 'Human risk review pressure')}
        </div>
        <div class="oracle-executive-panel">
          <h3>Cross-node Learning</h3>
          ${this.renderLearningSummary(learning)}
        </div>
      </div>
    `;
  }

  resolveNarrative(data, context) {
    if (!data || !data.decisionCount) {
      return 'Global Oracle aggregation is standing by. Human decisions will become cross-node learning signals as node-tagged memory grows.';
    }

    if (data.topApprovalNode && data.leadingAction) {
      const node = data.topApprovalNode.node;
      return `${node.location} node is leading network approval momentum at ${data.globalApprovalRate}%. Prioritize "${data.leadingAction}" as a controlled candidate for ${context.launchNodeIds.join(', ')}.`;
    }

    return data.crossNodeRecommendation || 'Keep collecting node-scoped decisions before promoting global strategy.';
  }

  renderSignal(signal) {
    return `
      <div class="oracle-strategic-alert">
        <strong>${this.escapeHtml(signal.title)}</strong>
        <p>${this.escapeHtml(signal.detail)}</p>
        <span>${Number(signal.confidence || 0)}% global confidence</span>
      </div>
    `;
  }

  renderMetricCard(label, value, detail) {
    return `
      <div class="oracle-playbook-card">
        <strong>${this.escapeHtml(label)} - ${this.escapeHtml(String(value))}</strong>
        <p>${this.escapeHtml(detail)}</p>
      </div>
    `;
  }

  renderLearningSummary(learning) {
    const transfers = Array.isArray(learning?.transfers) ? learning.transfers.slice(0, 3) : [];
    const summary = this.networkStrategy.summarize(learning);

    return `
      <div class="oracle-playbook-card">
        <strong>Network Strategy</strong>
        <p>${this.escapeHtml(summary)}</p>
      </div>
      ${transfers.map((transfer) => this.renderTransfer(transfer)).join('')}
    `;
  }

  renderTransfer(transfer) {
    return `
      <div class="oracle-playbook-card">
        <strong>${this.escapeHtml(transfer.targetNodeId)} - ${Number(transfer.adjustedConfidence || 0)}%</strong>
        <p>${this.escapeHtml(transfer.recommendation)}</p>
        <span>${this.escapeHtml(transfer.riskBoundary)} boundary - ${Number(transfer.contextFit || 0)}% context fit</span>
      </div>
    `;
  }

  renderUnavailable() {
    this.container.innerHTML = `
      <div class="oracle-executive-empty">
        Global Oracle aggregation is unavailable. Local HACI memory remains active.
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
