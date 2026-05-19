function bindStripeSessionShell() {
  document.addEventListener("guest:payment_eligibility_checked", (e) => {
    const payload = e.detail;
    const eligibility = payload?.paymentEligibility;

    if (!eligibility?.eligible) {
      const blockedPayload = {
        reason: eligibility?.reason || "payment_not_eligible",
        source: "stripe-session-shell",
        timestamp: Date.now()
      };
      
      window.SantisBus?.emit?.("guest:stripe_session_blocked", blockedPayload);
      document.dispatchEvent(new CustomEvent("guest:stripe_session_blocked", { detail: blockedPayload }));
      return;
    }

    const requestedPayload = {
      ritualTitle: payload.ritualTitle,
      preferredDate: payload.preferredDate,
      preferredTime: payload.preferredTime,
      source: "stripe-session-shell",
      timestamp: Date.now()
    };

    window.SantisBus?.emit?.("guest:stripe_session_requested", requestedPayload);
    document.dispatchEvent(new CustomEvent("guest:stripe_session_requested", { detail: requestedPayload }));
  });
}

bindStripeSessionShell();
