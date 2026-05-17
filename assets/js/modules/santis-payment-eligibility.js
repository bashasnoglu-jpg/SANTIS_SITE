function resolvePaymentEligibility(payload) {
  const missing = [];

  if (!payload?.ritualTitle) missing.push("ritualTitle");
  if (!payload?.preferredDate) missing.push("preferredDate");
  if (!payload?.preferredTime) missing.push("preferredTime");
  if (payload?.confirmationMode !== "host-review") missing.push("confirmationMode");

  const hasPrice = typeof payload?.price === "number" && payload.price > 0;

  if (!hasPrice) {
    return {
      eligible: false,
      reason: "price_required",
      missing,
      message: "Ritüel fiyatı ve son onay bilgisi tamamlandıktan sonra ödeme adımı açılacaktır."
    };
  }

  return {
    eligible: missing.length === 0,
    reason: missing.length ? "missing_required_fields" : "eligible",
    missing,
    message: "Ödeme adımı için ön koşullar tamamlandı."
  };
}

function bindPaymentEligibility() {
  document.addEventListener("guest:booking_confirmation_hold_created", (e) => {
    const payload = e.detail;
    if (!payload) return;

    const result = resolvePaymentEligibility(payload);
    
    const eventPayload = {
      ...payload,
      paymentEligibility: result,
      timestamp: Date.now()
    };

    window.SantisBus?.emit?.("guest:payment_eligibility_checked", eventPayload);
    document.dispatchEvent(new CustomEvent("guest:payment_eligibility_checked", { detail: eventPayload }));
  });
}

bindPaymentEligibility();
