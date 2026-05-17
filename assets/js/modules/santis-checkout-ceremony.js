import { SantisCheckoutEligibility } from "./santis-checkout-eligibility.js";

export class SantisCheckoutCeremony {
  constructor() {
    this.ritual = null;
    this.init();
  }

  init() {
    console.log("🦅 [Checkout Ceremony] Initialized.");
    
    // Listen for checkout requests
    document.addEventListener("guest:checkout_requested", this.handleCheckoutRequested.bind(this));
  }

  handleCheckoutRequested(e) {
    this.ritual = e.detail?.ritual;
    console.log(`[Checkout Ceremony] Checkout requested for:`, this.ritual);

    const eligibility = SantisCheckoutEligibility.checkEligibility(this.ritual);

    if (!eligibility.eligible) {
      console.warn("[Checkout Ceremony] Guest is NOT eligible for checkout:", eligibility.reasons);
      return;
    }

    console.log("[Checkout Ceremony] Guest is eligible. Proceeding to Ritual Confirmation.");
    this.transitionToConfirmation();
  }

  transitionToConfirmation() {
    console.log("[Checkout Ceremony] Ritual Confirmation step active.");
    // Shell implementation - UI logic will go here
  }
}

// Bootstrap
window.Santis = window.Santis || {};
window.Santis.CheckoutCeremony = new SantisCheckoutCeremony();
