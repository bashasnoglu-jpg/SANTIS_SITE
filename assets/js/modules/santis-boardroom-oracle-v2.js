/**
 * santis-boardroom-oracle-v2.js
 * The core intelligence layer combining anomaly detection and VIP inferences.
 */
import { RevenueAnomalyDetector } from './santis-revenue-anomaly-detector.js';
import { VipBehaviorInference } from './santis-vip-behavior-inference.js';
import { SantisOracleConfidenceEngine } from './santis-oracle-confidence-engine.js';
import { SantisOracleActionRail } from './santis-oracle-action-rail.js';
import { SantisOracleHumanApprovalLoop } from './santis-oracle-human-approval-loop.js';
import { SantisOracleExecutiveNarrative } from './santis-oracle-executive-narrative.js';
import { SantisOracleGlobalExecutiveView } from './santis-oracle-global-executive-view.js';
import { SantisOracleSimulationPanel } from './santis-oracle-simulation-panel.js';
import { SantisOracleExecutionPlanPanel } from './santis-oracle-execution-plan-panel.js';

class BoardroomOracleV2 {
  constructor() {
    this.anomalyDetector = new RevenueAnomalyDetector();
    this.vipInference = new VipBehaviorInference();
    this.confidenceEngine = new SantisOracleConfidenceEngine();
    this.humanApprovalLoop = new SantisOracleHumanApprovalLoop();
    this.actionRail = new SantisOracleActionRail();
    this.executiveNarrative = new SantisOracleExecutiveNarrative();
    this.globalExecutiveView = new SantisOracleGlobalExecutiveView();
    this.simulationPanel = new SantisOracleSimulationPanel();
    this.executionPlanPanel = new SantisOracleExecutionPlanPanel();
    this.container = document.getElementById('oracle-insights-container');
    
    this.init();
  }

  init() {
    if (!this.container) return;
    this.globalExecutiveView.init();
    this.simulationPanel.init();
    this.executionPlanPanel.init();
    
    // Initial state
    this.container.innerHTML = `
      <div class="oracle-message empty">
        <span class="pulse-dot"></span> Intelligence Core Active. Awaiting stream...
      </div>
    `;

    // Listen to the system-wide patch event from the CoreState stream
    window.addEventListener('santis:corestate:patch', (e) => {
      this.evaluateState(this.resolveBoardroomMetrics(e.detail));
    });
  }

  resolveBoardroomMetrics(payload) {
    if (!payload) return null;
    if (payload.patch?.boardroom) return payload.patch.boardroom;
    if (payload.boardroom) return payload.boardroom;

    return {
      ...payload,
      revenue: payload.revenue ?? payload.totalRevenue,
      bookings: payload.bookings ?? payload.bookingCount,
      vipLeads: payload.vipLeads ?? (Array.isArray(payload.vipSegments) ? payload.vipSegments.length : 0),
      averageLeadValue: payload.averageLeadValue ?? this.resolveAverageLeadValue(payload),
    };
  }

  resolveAverageLeadValue(metrics) {
    const revenue = Number(metrics.revenue ?? metrics.totalRevenue ?? 0);
    const bookings = Number(metrics.bookings ?? metrics.bookingCount ?? 0);

    return bookings > 0 ? revenue / bookings : 0;
  }

  evaluateState(boardroomMetrics) {
    if (!boardroomMetrics) return;

    const anomalyInsights = this.anomalyDetector.analyze(boardroomMetrics);
    const vipInsights = this.vipInference.analyze(boardroomMetrics);

    const allInsights = this.confidenceEngine.enrich(
      [...anomalyInsights, ...vipInsights],
      boardroomMetrics
    );
    
    if (allInsights.length > 0) {
      this.renderInsights(allInsights);
      this.actionRail.render(allInsights);
      this.executiveNarrative.render(allInsights, boardroomMetrics);
    }
  }

  renderInsights(insights) {
    if (!this.container) return;

    // Clear old empty state
    if (this.container.querySelector('.empty')) {
      this.container.innerHTML = ''; 
    }

    insights.forEach(insight => {
      // Prevent duplicates by checking if exact message already exists
      const existing = Array.from(this.container.querySelectorAll('.oracle-insight-content p'))
        .find(p => p.textContent === insight.message);
      
      if (existing) {
        // Blink existing card
        const card = existing.closest('.oracle-insight-card');
        card.classList.remove('pulse-animation');
        void card.offsetWidth; // trigger reflow
        card.classList.add('pulse-animation');
        return;
      }

      const card = document.createElement('div');
      card.className = `oracle-insight-card oracle-severity-${insight.severity}`;
      card.innerHTML = `
        <div class="oracle-insight-icon">${this.getIconForType(insight.type)}</div>
        <div class="oracle-insight-content">
          <p>${insight.message}</p>
          <div class="oracle-decision-row">
            <span>${insight.confidenceScore}% confidence</span>
            <span>${insight.riskLevel} risk</span>
          </div>
          <div class="oracle-suggested-action">${insight.suggestedAction}</div>
          ${this.renderLearningSummary(insight)}
        </div>
      `;
      
      // Prepend so newest is on top
      this.container.insertBefore(card, this.container.firstChild);

      // Keep max 5 insights
      if (this.container.children.length > 5) {
        this.container.lastChild.remove();
      }
    });
  }

  getIconForType(type) {
    switch(type) {
      case 'anomaly': return '⚠️';
      case 'opportunity': return '💎';
      case 'insight': return '🧠';
      case 'warning': return '📉';
      default: return '💡';
    }
  }

  renderLearningSummary(insight) {
    if (!insight.learningSummary) return '';

    return `<div class="oracle-learning-summary">${insight.learningSummary}</div>`;
  }
}

// Auto-initialize
export const santisBoardroomOracle = new BoardroomOracleV2();
