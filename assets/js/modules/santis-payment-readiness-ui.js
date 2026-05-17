function renderPaymentReadiness(e) {
  const payload = e.detail;
  const panel = document.querySelector("[data-payment-readiness]");
  const title = document.querySelector("[data-payment-readiness-title]");
  const message = document.querySelector("[data-payment-readiness-message]");

  if (!panel || !payload?.paymentEligibility) return;

  panel.hidden = false;

  if (payload.paymentEligibility.eligible) {
    title.textContent = "Ödeme adımı hazırlanıyor.";
    message.textContent = payload.paymentEligibility.message || "Ödeme adımı için ön koşullar tamamlandı.";
    return;
  }

  title.textContent = "Ödeme adımı şu anda kapalı.";
  message.textContent =
    payload.paymentEligibility.message ||
    "Spa ekibi ritüel zamanınızı ve fiyat bilgisini teyit ettikten sonra ödeme adımı açılacaktır.";
}

function bindPaymentReadinessUI() {
  document.addEventListener("guest:payment_eligibility_checked", renderPaymentReadiness);
}

bindPaymentReadinessUI();
