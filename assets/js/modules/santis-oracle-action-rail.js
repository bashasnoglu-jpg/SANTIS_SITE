/**
 * santis-oracle-action-rail.js
 * Renders Oracle recommendations as an executive action queue.
 */
export class SantisOracleActionRail {
  constructor(container = document.getElementById('oracle-action-rail-container')) {
    this.container = container;
    this.actions = new Map();
  }

  render(insights) {
    if (!this.container) return;

    insights.forEach((insight) => {
      this.actions.set(insight.id, this.toAction(insight));
    });

    const actions = Array.from(this.actions.values())
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);

    if (actions.length === 0) {
      this.renderEmpty();
      return;
    }

    this.container.innerHTML = actions.map((action) => this.renderAction(action)).join('');
    window.dispatchEvent(new CustomEvent('santis:oracle:actions:rendered', {
      detail: { actions },
    }));
  }

  toAction(insight) {
    return {
      id: insight.id,
      title: this.resolveTitle(insight),
      priority: this.resolvePriority(insight),
      confidenceScore: insight.confidenceScore,
      riskLevel: insight.riskLevel,
      suggestedAction: insight.suggestedAction,
      evidenceTrail: insight.evidenceTrail || [],
      learningSummary: insight.learningSummary || '',
      learningFeedback: insight.learningFeedback || null,
    };
  }

  resolveTitle(insight) {
    if (insight.type === 'opportunity' && insight.riskLevel === 'high') {
      return 'VIP Momentum Follow-up';
    }

    if (insight.type === 'opportunity') {
      return 'Premium Intent Capture';
    }

    if (insight.type === 'anomaly') {
      return 'Revenue Spike Review';
    }

    return 'Boardroom Signal Review';
  }

  resolvePriority(insight) {
    const riskWeight = { high: 300, medium: 200, low: 100 }[insight.riskLevel] || 100;
    return riskWeight + Number(insight.confidenceScore || 0);
  }

  renderAction(action) {
    const evidence = action.evidenceTrail
      .map((item) => `<li>${this.escapeHtml(item)}</li>`)
      .join('');

    return `
      <article
        class="oracle-action-card oracle-risk-${this.escapeHtml(action.riskLevel)}"
        data-oracle-action-id="${this.escapeHtml(action.id)}"
      >
        <div class="oracle-action-meta">
          <span class="oracle-risk-label">${this.escapeHtml(action.riskLevel)} risk</span>
          <strong>${Number(action.confidenceScore || 0)}%</strong>
        </div>
        <h3>${this.escapeHtml(action.title)}</h3>
        <p>${this.escapeHtml(action.suggestedAction)}</p>
        <ul>${evidence}</ul>
        ${this.renderLearningSummary(action)}
        <div class="oracle-human-controls" aria-label="Oracle human decision controls">
          <button class="oracle-human-decision-btn" type="button" data-oracle-decision="approved">Approve</button>
          <button class="oracle-human-decision-btn" type="button" data-oracle-decision="dismissed">Dismiss</button>
          <button class="oracle-human-decision-btn" type="button" data-oracle-decision="escalated">Escalate</button>
        </div>
        <div class="oracle-human-decision-status" data-oracle-decision-status>Awaiting human decision</div>
      </article>
    `;
  }

  renderLearningSummary(action) {
    if (!action.learningSummary) return '';

    const delta = Number(action.learningFeedback?.confidenceDelta || 0);
    const deltaLabel = delta === 0 ? 'neutral' : `${delta > 0 ? '+' : ''}${delta}%`;

    return `
      <div class="oracle-learning-summary">
        ${this.escapeHtml(action.learningSummary)}
        <span class="oracle-learning-chip">Calibration ${this.escapeHtml(deltaLabel)}</span>
      </div>
    `;
  }

  renderEmpty() {
    this.container.innerHTML = `
      <div class="oracle-action-empty">
        <span class="pulse-dot"></span> Action Rail armed. Awaiting decision-grade signal...
      </div>
    `;
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
