/**
 * santis-boardroom-oracle-v2.js
 * The core intelligence layer combining anomaly detection and VIP inferences.
 */
import { RevenueAnomalyDetector } from './santis-revenue-anomaly-detector.js';
import { VipBehaviorInference } from './santis-vip-behavior-inference.js';

class BoardroomOracleV2 {
  constructor() {
    this.anomalyDetector = new RevenueAnomalyDetector();
    this.vipInference = new VipBehaviorInference();
    this.container = document.getElementById('oracle-insights-container');
    
    this.init();
  }

  init() {
    if (!this.container) return;
    
    // Initial state
    this.container.innerHTML = `
      <div class="oracle-message empty">
        <span class="pulse-dot"></span> Intelligence Core Active. Awaiting stream...
      </div>
    `;

    // Listen to the system-wide patch event from the CoreState stream
    window.addEventListener('santis:corestate:patch', (e) => {
      this.evaluateState(e.detail.patch.boardroom);
    });
  }

  evaluateState(boardroomMetrics) {
    if (!boardroomMetrics) return;

    const anomalyInsights = this.anomalyDetector.analyze(boardroomMetrics);
    const vipInsights = this.vipInference.analyze(boardroomMetrics);

    const allInsights = [...anomalyInsights, ...vipInsights];
    
    if (allInsights.length > 0) {
      this.renderInsights(allInsights);
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
}

// Auto-initialize
export const santisBoardroomOracle = new BoardroomOracleV2();
