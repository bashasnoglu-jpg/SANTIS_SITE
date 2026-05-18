function renderBillingStatus(e) {
  const payload = e.detail;
  const panel = document.querySelector("[data-billing-session-status]");
  const title = document.querySelector("[data-billing-session-title]");
  const message = document.querySelector("[data-billing-session-message]");

  if (!panel || !title || !message) return;

  const session = payload?.billingSession;
  const writeDOM = window.SantisDOM?.write || ((fn) => requestAnimationFrame(fn));

  if (session?.ready) {
    writeDOM(() => {
      panel.hidden = false;
      title.textContent = "Ödeme oturumu hazır.";
      message.textContent = session.message || "Ödeme adımı hazırlanıyor.";
    });
    return;
  }

  writeDOM(() => {
    panel.hidden = false;
    title.textContent = "Ödeme oturumu henüz hazır değil.";
    message.textContent =
      session?.message ||
      payload?.message ||
      "Spa ekibi fiyat ve zaman bilgisini teyit ettikten sonra ödeme oturumu açılacaktır.";
  });
}

function bindBillingSessionStatusUI() {
  document.addEventListener("guest:stripe_session_blocked", renderBillingStatus);
  document.addEventListener("guest:billing_session_ready", renderBillingStatus);
}

bindBillingSessionStatusUI();
