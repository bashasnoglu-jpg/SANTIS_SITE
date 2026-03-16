/**
 * SANTIS v13.0 — SOVEREIGN GHOST FILTER
 * Chip navigation + Ghost UI transitions + Swiper sync
 * Dependencies: SantisObserver (optional), SovereignMirror, Swiper
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

        const slides = document.querySelectorAll('.swiper-slide');
        let visibleCount = 0;

        slides.forEach(slide => {
            const status = slide.dataset.status || 'ALL';
            const isMatch = category === 'ALL' || status === category;

            if (isMatch) {
                slide.style.display = '';
                setTimeout(() => {
                    slide.classList.remove('ghost-out');
                    if (typeof SantisObserver !== 'undefined') SantisObserver.observe(slide);
                }, 10);
                visibleCount++;
            } else {
                slide.classList.add('ghost-out');
                setTimeout(() => {
                    if (slide.classList.contains('ghost-out')) {
                        slide.style.display = 'none';
                    }
                }, 500);
            }
        });

        // Swiper layout recalculation
        if (window.boardroomSwiper) {
            setTimeout(() => {
                window.boardroomSwiper.update();
                window.boardroomSwiper.slideTo(0, 300);
            }, 550);
        }

        // VIP Mirror sync after ghost transition
        setTimeout(() => {
            if (window.SovereignMirror) SovereignMirror.syncVIP();
        }, 600);

        console.log(`🦅 SovereignFilter: [${category}] ${visibleCount} visible`);
    }
};
