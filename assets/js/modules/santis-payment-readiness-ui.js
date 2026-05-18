let cachedPaymentNodes = null;

function getPaymentNodes() {
  if (
    !cachedPaymentNodes ||
    !cachedPaymentNodes.panel?.isConnected
  ) {
    cachedPaymentNodes = {
      panel: document.querySelector("[data-payment-readiness]"),
      title: document.querySelector("[data-payment-readiness-title]"),
      message: document.querySelector("[data-payment-readiness-message]")
    };
  }
  return cachedPaymentNodes;
}

function renderPaymentReadiness(e) {
  const payload = e.detail;
  const { panel, title, message } = getPaymentNodes();

  if (!panel || !payload?.paymentEligibility) return;

  const writeDOM = window.SantisDOM?.write || ((fn) => requestAnimationFrame(fn));

  if (payload.paymentEligibility.eligible) {
    writeDOM(() => {
      panel.hidden = false;
      title.textContent = "Ödeme adımı hazırlanıyor.";
      message.textContent = payload.paymentEligibility.message || "Ödeme adımı için ön koşullar tamamlandı.";
    }, "PaymentReadinessUI:eligible");
    return;
  }

  writeDOM(() => {
    panel.hidden = false;
    title.textContent = "Ödeme adımı şu anda kapalı.";
    message.textContent =
      payload.paymentEligibility.message ||
      "Spa ekibi ritüel zamanınızı ve fiyat bilgisini teyit ettikten sonra ödeme adımı açılacaktır.";
  }, "PaymentReadinessUI:ineligible");
}

function bindPaymentReadinessUI() {
  document.addEventListener("guest:payment_eligibility_checked", renderPaymentReadiness);
}

bindPaymentReadinessUI();
