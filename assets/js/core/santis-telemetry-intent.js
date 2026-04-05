const hoverCooldown = new Map();
const impressionSeen = new Set();
const hoverTimers = new WeakMap();

function getCardPayload(card) {
  return {
    cardId: card.dataset.cardId || null,
    cardType: card.dataset.cardType || null,
    serviceName: card.dataset.serviceName || null
  };
}

function canTrackHover(cardId) {
  const now = Date.now();
  const last = hoverCooldown.get(cardId) || 0;
  return now - last > 8000;
}

export const SantisTelemetryIntent = {
  bindRail(rail, isInteractionBlocked) {
    const cards = rail.querySelectorAll('.sovereign-card');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.6) return;
        const card = entry.target;
        const payload = getCardPayload(card);
        if (!payload.cardId || impressionSeen.has(payload.cardId)) return;

        impressionSeen.add(payload.cardId);

        if (window.SovereignTelemetry?.reportCardImpression) {
          window.SovereignTelemetry.reportCardImpression(payload);
        }
      });
    }, {
      threshold: [0.6]
    });

    cards.forEach((card) => observer.observe(card));

    rail.addEventListener('mouseover', (event) => {
      const card = event.target.closest('.sovereign-card');
      if (!card || !rail.contains(card)) return;
      if (isInteractionBlocked()) return;

      const payload = getCardPayload(card);
      if (!payload.cardId || !canTrackHover(payload.cardId)) return;

      const timer = window.setTimeout(() => {
        hoverCooldown.set(payload.cardId, Date.now());
        if (window.SovereignTelemetry?.reportHoverIntent) {
          window.SovereignTelemetry.reportHoverIntent(payload);
        }
      }, 220);

      hoverTimers.set(card, timer);
    });

    rail.addEventListener('mouseout', (event) => {
      const card = event.target.closest('.sovereign-card');
      if (!card) return;
      const timer = hoverTimers.get(card);
      if (timer) clearTimeout(timer);
    });

    rail.addEventListener('click', (event) => {
      const card = event.target.closest('.sovereign-card');
      if (!card) return;
      const payload = getCardPayload(card);

      if (window.SovereignTelemetry?.reportCardClick) {
        window.SovereignTelemetry.reportCardClick(payload);
      }
    });
  }
};
