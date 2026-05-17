function resolvePricingReadiness(payload) {
  const hasPrice = typeof payload?.price === "number" && payload.price > 0;

  if (!hasPrice) {
    return {
      resolved: false,
      reason: "price_required",
      message: "Fiyat bilgisi spa ekibi tarafından teyit edildikten sonra ödeme adımı açılacaktır."
    };
  }

  return {
    resolved: true,
    price: payload.price,
    currency: payload.currency || "EUR",
    message: "Fiyat bilgisi doğrulandı."
  };
}

function bindPricingReadiness() {
  document.addEventListener("guest:booking_confirmation_hold_created", (e) => {
    const payload = e.detail;
    if (!payload) return;

    const result = resolvePricingReadiness(payload);
    
    const eventPayload = {
      ...payload,
      pricing: result,
      timestamp: Date.now()
    };

    const eventName = result.resolved ? "guest:pricing_resolved" : "guest:pricing_required";
    
    window.SantisBus?.emit?.(eventName, eventPayload);
    document.dispatchEvent(new CustomEvent(eventName, { detail: eventPayload }));
  });
}

bindPricingReadiness();
