/**
 * 🃏 Reservation Card Component
 * Co-located: reservation-card.js + reservation-card.css + reservation-card.html
 *
 * Kullanım: <div data-component="reservation-card" data-service-id="hammam"></div>
 */

// ── Template ──────────────────────────────────────────────────────────────────
const TEMPLATE = (serviceId, serviceName) => `
<article class="res-card" role="article" aria-label="${serviceName} rezervasyon kartı">
    <div class="res-card__header">
        <h3 class="res-card__title">${serviceName}</h3>
        <span class="res-card__badge">Available</span>
    </div>
    <div class="res-card__body">
        <p class="res-card__desc">Premium spa deneyimi için rezervasyon yapın.</p>
    </div>
    <footer class="res-card__footer">
        <button
            class="res-card__cta santis-btn santis-btn--primary"
            data-service-id="${serviceId}"
            aria-label="${serviceName} için rezervasyon yap"
        >
            Rezervasyon Yap
        </button>
    </footer>
</article>`;

// ── Logic ─────────────────────────────────────────────────────────────────────
export function init(container) {
    const serviceId   = container.dataset.serviceId || 'general';
    const serviceName = container.dataset.serviceName || 'Spa Hizmeti';

    container.innerHTML = TEMPLATE(serviceId, serviceName);
    container.classList.add('res-card__host');

    // CTA → Reservation Modal
    container.querySelector('.res-card__cta')?.addEventListener('click', () => {
        window.openReservationModal?.(serviceName);
    });
}

// ── Auto-init (Kernel ComponentLoader tarafından çağrılır) ────────────────────
export default { init, name: 'reservation-card' };
