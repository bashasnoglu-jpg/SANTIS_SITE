let cachedNodes = null;

function getNodes() {
  if (!cachedNodes) {
    cachedNodes = {
      panel: document.querySelector("[data-billing-session-status]"),
      title: document.querySelector("[data-billing-session-title]"),
      message: document.querySelector("[data-billing-session-message]")
    };
  }
  return cachedNodes;
}

function renderBillingStatus(e) {
  const payload = e.detail;
  const { panel, title, message } = getNodes();

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
