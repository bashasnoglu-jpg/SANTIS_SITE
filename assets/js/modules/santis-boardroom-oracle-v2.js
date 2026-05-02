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
import { SantisOracleOutcomeFeedbackPanel } from './santis-oracle-outcome-feedback-panel.js';
import { SantisOracleForecastPanel } from './santis-oracle-forecast-panel.js';

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
    this.outcomeFeedbackPanel = new SantisOracleOutcomeFeedbackPanel();
    this.forecastPanel = new SantisOracleForecastPanel();
    this.container = document.getElementById('oracle-insights-container');
    
    this.init();
  }

  init() {
    if (!this.container) return;
    this.globalExecutiveView.init();
    if (!document.getElementById('btn-apply-simulation')) {
      this.simulationPanel.init();
    }
    this.executionPlanPanel.init();
    this.outcomeFeedbackPanel.init();
    this.forecastPanel.init();
    
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

    const newCards = [];

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

      const planId = `plan_${Math.random().toString(36).substr(2, 9)}`;
      
      const card = document.createElement('div');
      card.className = `oracle-insight-card oracle-severity-${insight.severity} card-${planId}`;
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
          <div class="operator-actions" id="actions-${planId}">
            <button class="btn-santis btn-approve" data-plan="${planId}" data-decision="APPROVED">Approve</button>
            <button class="btn-santis btn-reject" data-plan="${planId}" data-decision="REJECTED">Reject</button>
          </div>
        </div>
      `;
      
      // Attach decision listeners
      const approveBtn = card.querySelector('.btn-approve');
      const rejectBtn = card.querySelector('.btn-reject');
      
      approveBtn.addEventListener('click', () => this.processDecision(planId, 'APPROVED'));
      rejectBtn.addEventListener('click', () => this.processDecision(planId, 'REJECTED'));
      
      // Prepend so newest is on top
      this.container.insertBefore(card, this.container.firstChild);
      newCards.push(card);

      // Keep max 5 insights
      if (this.container.children.length > 5) {
        this.container.lastChild.remove();
      }
    });

    if (newCards.length > 0 && typeof gsap !== 'undefined') {
      gsap.fromTo(newCards, 
        { opacity: 0, y: -15 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.15, 
          ease: 'power3.out',
          clearProps: 'transform',
          onComplete: () => {
            // Fade in buttons sequentially after card lands
            newCards.forEach(c => {
               gsap.to(c.querySelector('.operator-actions'), {
                   opacity: 1, duration: 0.4, ease: 'power2.out'
               });
            });
          }
        }
      );
    }
  }

  async processDecision(planId, decision) {
    console.log(`[Boardroom Operator] Decision for ${planId}: ${decision}`);
    
    // Select the card to animate out
    const card = document.querySelector(`.card-${planId}`);
    if (!card) return;

    // Send decision to backend kernel (Non-blocking, UI-first)
    fetch('http://localhost:3030/api/v1/decision-kernel/execute', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, decision, timestamp: Date.now() }) 
    }).catch(err => console.error('[KERNEL ERROR] Failed to record decision:', err));
    // Add success glow and stamp before sliding out
    const actionsContainer = card.querySelector('.operator-actions');
    const isApproved = decision === 'APPROVED';
    
    if (actionsContainer) {
        actionsContainer.innerHTML = `
            <div class="santis-synced-stamp ${isApproved ? '' : 'rejected'}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>${isApproved ? 'APPROVED' : 'REJECTED'} & SYNCED</span>
            </div>
        `;
        
        gsap.fromTo(actionsContainer.querySelector('.santis-synced-stamp'), 
            { opacity: 0, scale: 0.9 }, 
            { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
        );
    }

    if (isApproved) {
        gsap.to(card, {
            backgroundColor: 'rgba(0, 255, 128, 0.05)',
            borderColor: 'rgba(0, 255, 128, 0.4)',
            duration: 0.3
        });
    } else {
        gsap.to(card, {
            backgroundColor: 'rgba(255, 48, 48, 0.05)',
            borderColor: 'rgba(255, 48, 48, 0.4)',
            duration: 0.3
        });
    }

    // Slide out based on decision, with enough delay to read the stamp
    gsap.to(card, {
        opacity: 0,
        x: isApproved ? 80 : -80,
        y: -10,
        filter: 'blur(5px)',
        duration: 0.6,
        delay: 0.9,
        ease: "power4.in",
        onComplete: () => card.remove()
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
