/**
 * SANTIS ACCORDION V1.0 (The 'Secrets' Engine)
 * ---------------------------------------------
 * UX Architecture:
 * - Single Mode: Only one item opens at a time (Focus).
 * - Multi Mode: Multiple items can be open.
 * - Soul Integration: Triggers haptic/audio feedback.
 */

window.SantisAccordion = {
    init: function (options = {}) {
        const config = {
            selector: '.nv-accordion-item',
            mode: 'single', // 'single' or 'multi'
            sound: true,    // Click sound
            ...options
        };

        const items = document.querySelectorAll(config.selector);
        if (items.length === 0) return;

        console.log(`🎹 Santis Accordion Init: ${items.length} items found.`);

        items.forEach(item => {
            const header = item.querySelector('.nv-accordion-header');
            if (!header) return;

            // Remove old listeners to prevent dupes
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);

            newHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleItem(item, items, config);
            });
        });
    },

    toggleItem: function (targetItem, allItems, config) {
        const isActive = targetItem.classList.contains('is-active');

        // 1. Close Others (if single mode)
        if (config.mode === 'single' && !isActive) {
            allItems.forEach(item => {
                if (item !== targetItem && item.classList.contains('is-active')) {
                    this.close(item);
                }
            });
        }

        // 2. Toggle Target
        if (isActive) {
            this.close(targetItem);
        } else {
            this.open(targetItem, config);
        }
    },

    open: function (item, config) {
        item.classList.add('is-active');

        // Haptic Feedback
        if (window.navigator.vibrate) window.navigator.vibrate(5); // Micro-tick

        // Audio Feedback (Hypothetical Integration)
        // if (config.sound && window.SantisAudio) SantisAudio.play('click_soft');
    },

    close: function (item) {
        item.classList.remove('is-active');
    }
};

// AUTO-INIT
document.addEventListener('DOMContentLoaded', () => {
    SantisAccordion.init();
});
