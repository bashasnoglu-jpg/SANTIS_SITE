/* ==========================================================================
   SANTIS OS - GUEST JOURNEY ORCHESTRATOR
   Phase 1: Deterministic State Machine for Guest Intent
   ========================================================================== */

const JourneyState = {
  IDLE: "idle",
  INTENT_CAPTURED: "intent_captured",
  ATMOSPHERE_ALIGNED: "atmosphere_aligned",
  RITUAL_RECOMMENDED: "ritual_recommended",
  ITINERARY_READY: "itinerary_ready"
};

class GuestJourneyOrchestrator {
  constructor() {
    this.currentState = JourneyState.IDLE;
    this.intent = null;
    this.init();
  }

  init() {
    console.log("🦅 [Journey Orchestrator] Initialized in IDLE state.");
    
    // Listen for intent selection
    document.addEventListener("guest:intent_selected", this.handleIntentSelected.bind(this));
    document.addEventListener("guest:atmosphere_aligned", this.handleAtmosphereAligned.bind(this));
    document.addEventListener("guest:ritual_recommended", this.handleRitualRecommended.bind(this));
    document.addEventListener("guest:itinerary_ready", this.handleItineraryReady.bind(this));
  }

  handleIntentSelected(e) {
    this.intent = e.detail?.intent;
    console.log(`[Journey] Intent Captured: ${this.intent}`);
    this.transitionTo(JourneyState.INTENT_CAPTURED);
  }

  handleAtmosphereAligned(e) {
    console.log(`[Journey] Atmosphere Aligned for: ${this.intent}`);
    this.transitionTo(JourneyState.ATMOSPHERE_ALIGNED);
  }

  handleRitualRecommended(e) {
    console.log(`[Journey] Ritual Recommended:`, e.detail?.ritual);
    this.transitionTo(JourneyState.RITUAL_RECOMMENDED);
  }

  handleItineraryReady(e) {
    console.log(`[Journey] Itinerary Ready.`);
    this.transitionTo(JourneyState.ITINERARY_READY);
  }

  transitionTo(newState) {
    if (this.currentState === newState) return;
    console.log(`🔄 [Journey] State transition: ${this.currentState} -> ${newState}`);
    this.currentState = newState;
  }
}

// Bootstrap
window.Santis = window.Santis || {};
window.Santis.JourneyOrchestrator = new GuestJourneyOrchestrator();
