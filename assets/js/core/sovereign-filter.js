/**
 * SANTIS v13.0 — SOVEREIGN GHOST FILTER
 * Chip navigation + Ghost UI transitions
 * Dependencies: SantisObserver (optional), SovereignMirror
 */
window.SovereignFilter = {
    init() {
        const chips = document.querySelectorAll('.santis-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.execute(chip.dataset.filter);
            });
        });
    },

    execute(category) {
        if (window.triggerPulse) window.triggerPulse(true);
        if (typeof SantisObserver !== 'undefined') SantisObserver.clear(); // Silent disconnect, _seen preserved

        const cards = document.querySelectorAll('.bento-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const status = card.dataset.status || 'ALL';
            const isMatch = category === 'ALL' || status === category;

            if (isMatch) {
                card.style.display = '';
                setTimeout(() => {
                    card.classList.remove('ghost-out');
                    if (typeof SantisObserver !== 'undefined') SantisObserver.observe(card);
                }, 10);
                visibleCount++;
            } else {
                card.classList.add('ghost-out');
                setTimeout(() => {
                    if (card.classList.contains('ghost-out')) {
                        card.style.display = 'none';
                        card.classList.remove('revealed'); // Auto-close expanded cards on filter
                    }
                }, 500);
            }
        });

        // Swiper layout recalculation logic removed (Boardroom now uses Bento Grid)

        // VIP Mirror sync after ghost transition
        setTimeout(() => {
            if (window.SovereignMirror) SovereignMirror.syncVIP();
        }, 600);

        console.log(`🦅 SovereignFilter: [${category}] ${visibleCount} visible`);
    }
};
