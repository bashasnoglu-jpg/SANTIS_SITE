/**
 * SANTIS v13.0 — SOVEREIGN VIP MIRROR + URGENCY LAYER
 * Revenue-sorted Focus card + WebSocket Nuclear Focus bridge
 * Dependencies: triggerPulse (global)
 */
window.SovereignMirror = {
    syncVIP() {
        const visible = [...document.querySelectorAll('.swiper-slide:not(.ghost-out)')]
            .filter(s => s.style.display !== 'none' && s.dataset.revenue);

        if (visible.length === 0) return;

        const top = visible.sort((a, b) =>
            parseFloat(b.dataset.revenue || 0) - parseFloat(a.dataset.revenue || 0)
        )[0];

        this.updateFocus(top);
    },

    updateFocus(slide) {
        const focusCard = document.getElementById('santis-focus-card');
        const focusName = document.getElementById('santis-focus-name');
        const focusIcon = document.getElementById('santis-focus-icon');
        const focusScore = document.getElementById('santis-focus-score');
        if (!focusCard || !slide) return;

        const city = slide.dataset.city || 'Unknown';
        const revenue = parseFloat(slide.dataset.revenue || 0);
        const isSurge = slide.dataset.status === 'SURGE';

        focusName.textContent = city;
        focusIcon.textContent = isSurge ? '🔥' : '🏙️';
        focusScore.textContent = `€${revenue.toLocaleString()}`;

        const intensity = Math.min(0.6, 0.1 + (revenue / 500000) * 0.5);
        focusCard.style.setProperty('--santis-glow', intensity.toFixed(2));

        if (isSurge) {
            focusCard.classList.add('urgency');
        } else {
            focusCard.classList.remove('urgency');
        }

        if (window.triggerPulse) window.triggerPulse(isSurge);
        console.log(`🦅 VIP Mirror: ${city} (€${revenue}) ${isSurge ? '[SURGE]' : ''}`);
    }
};

/**
 * Nuclear Focus Update — WebSocket event → Focus Card bridge
 */
window.updateNuclearFocus = function (payload) {
    const focusCard = document.getElementById('santis-focus-card');
    const focusName = document.getElementById('santis-focus-name');
    const focusIcon = document.getElementById('santis-focus-icon');
    const focusScore = document.getElementById('santis-focus-score');
    if (!focusCard) return;

    const name = payload.guest_name || payload.city || payload.service || 'Sovereign Event';
    const score = payload.revenue_eur || payload.surge_multiplier || 1;
    const isVIP = payload.is_vip || payload.action === 'FLARE';
    const isSentinel = payload.action === 'SENTINEL_FLARE';

    focusName.textContent = name;
    focusIcon.textContent = isSentinel ? '🛡️' : isVIP ? '👑' : '📦';
    focusScore.textContent = payload.revenue_eur ? `€${payload.revenue_eur.toLocaleString()}` : '';

    const intensity = isSentinel ? 0.6 : isVIP ? 0.5 : 0.2;
    focusCard.style.setProperty('--santis-glow', intensity);

    if (window.triggerPulse) window.triggerPulse(isVIP || isSentinel);
};
