import { SantisCheckoutEligibility } from "./santis-checkout-eligibility.js";
import { SantisSovereignVault } from "./santis-sovereign-vault.js";

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
    
    // Bind Cancel
    const cancelBtn = panel.querySelector("[data-checkout-cancel]");
    if (cancelBtn && !cancelBtn.dataset.bound) {
        cancelBtn.dataset.bound = "true";
        cancelBtn.addEventListener("click", () => {
            panel.hidden = true;
        });
    }

    // Bind Confirm
    const confirmBtn = panel.querySelector("[data-checkout-confirm]");
    if (confirmBtn && !confirmBtn.dataset.bound) {
        confirmBtn.dataset.bound = "true";
        confirmBtn.addEventListener("click", () => {
            console.log("[Checkout Ceremony] Ritual confirmed. Initiating booking handoff.");
            
            // Retrieve latest vault state for context
            const vaultState = SantisSovereignVault.loadJourney() || {};

            const payload = {
                ritualTitle: ritual.title,
                duration: ritual.duration,
                category: ritual.category,
                intent: vaultState.intent || null,
                atmosphere: vaultState.atmosphere || null,
                source: "checkout-ceremony",
                timestamp: Date.now()
            };

            window.SantisBus?.emit?.("guest:booking_handoff_requested", payload);
            
            // Local fallback
            document.dispatchEvent(new CustomEvent("guest:booking_handoff_requested", { detail: payload }));
            
            // Temporary UX feedback
            confirmBtn.textContent = "Hazırlanıyor...";
            confirmBtn.disabled = true;
        });
    }
  }
}

// Bootstrap
window.Santis = window.Santis || {};
window.Santis.CheckoutCeremony = new SantisCheckoutCeremony();
