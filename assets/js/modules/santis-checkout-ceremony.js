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
    this.transitionToConfirmation(this.ritual);
  }

  transitionToConfirmation(ritual) {
    console.log("[Checkout Ceremony] Ritual Confirmation step active.");
    
    const panel = document.querySelector("[data-checkout-ceremony]");
    if (!panel || !ritual) return;

    panel.hidden = false;
    panel.querySelector("[data-checkout-title]").textContent = ritual.title;
    panel.querySelector("[data-checkout-meta]").textContent =
      `${ritual.category} · ${ritual.duration}`;

    const link = panel.querySelector("[data-checkout-link]");
    if (link && ritual.href) {
      link.href = ritual.href;
    }
    
    // Bind Cancel
    const cancelBtn = panel.querySelector("[data-checkout-cancel]");
    if (cancelBtn && !cancelBtn.dataset.bound) {
        cancelBtn.dataset.bound = "true";
        cancelBtn.addEventListener("click", () => {
            panel.hidden = true;
        });
    }
  }
}

// Bootstrap
window.Santis = window.Santis || {};
window.Santis.CheckoutCeremony = new SantisCheckoutCeremony();
