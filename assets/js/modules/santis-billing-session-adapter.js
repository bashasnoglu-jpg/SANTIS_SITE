async function requestCheckoutSession(payload) {
  try {
    const response = await fetch("/api/v1/billing/checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return await response.json();
  } catch (error) {
    console.warn("[BillingSession] checkout session request failed", error);

    return {
      ready: false,
      reason: "billing_api_unreachable",
      message: "Ödeme oturumu şu anda hazırlanamadı."
    };
  }
}

function bindBillingSessionAdapter() {
  document.addEventListener("guest:stripe_session_requested", async (e) => {
    const payload = e.detail;
    if (!payload) return;

    const result = await requestCheckoutSession(payload);
    
    const eventName = result.ready ? "guest:billing_session_ready" : "guest:stripe_session_blocked";
    const eventPayload = {
      ...payload,
      billingSession: result,
      source: "billing-session-adapter",
      timestamp: Date.now()
    };

    window.SantisBus?.emit?.(eventName, eventPayload);
    document.dispatchEvent(new CustomEvent(eventName, { detail: eventPayload }));
  });
}

bindBillingSessionAdapter();
