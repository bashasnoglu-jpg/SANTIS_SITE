const BILLING_STATUS_COPY = {
  sessionReady: {
    title: "Ödeme oturumu hazır.",
    message: "Ödeme adımı hazırlanıyor.",
  },
  sessionBlocked: {
    title: "Ödeme oturumu henüz hazır değil.",
    message: "Spa ekibi fiyat ve zaman bilgisini teyit ettikten sonra ödeme oturumu açılacaktır.",
  },
};

function t(key, fallback) {
  return (
    window.SantisI18n?.t?.(`billing.sessionStatus.${key}`) ||
    window.SantisI18N?.t?.(`billing.sessionStatus.${key}`) ||
    fallback
  );
}

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
      title.textContent = t("sessionReady.title", BILLING_STATUS_COPY.sessionReady.title);
      message.textContent = session.message || t("sessionReady.message", BILLING_STATUS_COPY.sessionReady.message);
    });
    return;
  }

  writeDOM(() => {
    panel.hidden = false;
    title.textContent = t("sessionBlocked.title", BILLING_STATUS_COPY.sessionBlocked.title);
    message.textContent =
      session?.message ||
      payload?.message ||
      t("sessionBlocked.message", BILLING_STATUS_COPY.sessionBlocked.message);
  });
}

function bindBillingSessionStatusUI() {
  document.addEventListener("guest:stripe_session_blocked", renderBillingStatus);
  document.addEventListener("guest:billing_session_ready", renderBillingStatus);
}

bindBillingSessionStatusUI();
