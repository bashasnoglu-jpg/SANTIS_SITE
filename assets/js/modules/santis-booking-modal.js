export class SantisBookingModal {
  constructor() {
    this.currentPayload = null;
    this.init();
  }

  init() {
    console.log("🦅 [Booking Modal] Initialized in shell mode.");
    
    document.addEventListener("guest:booking_handoff_requested", this.handleHandoffRequested.bind(this));
    
    this.bindUI();
  }

  bindUI() {
    const modal = document.querySelector("[data-booking-modal]");
    if (!modal) return;
    
    const cancelBtn = modal.querySelector("[data-booking-cancel]");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.close());
    }

    const form = modal.querySelector("[data-booking-form]");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.submitForm();
      });
    }
  }

  handleHandoffRequested(e) {
    this.currentPayload = e.detail;
    console.log("[Booking Modal] Handoff received:", this.currentPayload);
    
    this.render();
  }

  render() {
    const modal = document.querySelector("[data-booking-modal]");
    if (!modal || !this.currentPayload) return;
    
    const titleEl = modal.querySelector("[data-booking-ritual-title]");
    if (titleEl) {
      titleEl.textContent = this.currentPayload.ritualTitle || "Ritüel Rezervasyonu";
    }

    modal.hidden = false;
  }

  close() {
    const modal = document.querySelector("[data-booking-modal]");
    if (modal) {
      modal.hidden = true;
    }
  }

  submitForm() {
    const modal = document.querySelector("[data-booking-modal]");
    if (!modal || !this.currentPayload) return;
    
    const dateInput = modal.querySelector("[name='preferredDate']")?.value;
    const timeInput = modal.querySelector("[name='preferredTime']")?.value;
    const partyInput = modal.querySelector("[name='partySize']")?.value;
    const noteInput = modal.querySelector("[name='note']")?.value;

    const intentPayload = {
      ...this.currentPayload,
      preferredDate: dateInput,
      preferredTime: timeInput,
      partySize: partyInput,
      note: noteInput,
      source: "booking-modal",
      timestamp: Date.now()
    };

    console.log("[Booking Modal] Intent submitted:", intentPayload);
    
    window.SantisBus?.emit?.("guest:booking_intent_submitted", intentPayload);
    document.dispatchEvent(new CustomEvent("guest:booking_intent_submitted", { detail: intentPayload }));

    // Temporary feedback
    const submitBtn = modal.querySelector("[data-booking-submit]");
    if (submitBtn) {
      submitBtn.textContent = "Talep Alındı";
      submitBtn.disabled = true;
    }
    
    setTimeout(() => this.close(), 1500);
  }
}

// Bootstrap
window.Santis = window.Santis || {};
window.Santis.BookingModal = new SantisBookingModal();
