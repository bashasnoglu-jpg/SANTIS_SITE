/**
 * SANTIS PREMIUM CARD INTERACTIONS v3.1 (SAFE MODE)
 * Stabilite sorunu nedeniyle geçici olarak devre dışı bırakıldı.
 * Kartların görünürlüğü tamamen CSS (cards.css) tarafından kontrol ediliyor.
 */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        console.log('🛡️ Santis Card Effects: SAFE MODE Active. Visual effects disabled for stability.');

        // Force cleanup of any lingering inline styles set by previous versions
        const cards = document.querySelectorAll('.nv-card, .nv-card-service, .nv-card-product, article.nv-card, .prod-card-v2, .luxury-card');
        cards.forEach(card => {
            // Remove any inline opacity/transform that might hide the card
            card.style.removeProperty('opacity');
            card.style.removeProperty('transform');
            card.style.removeProperty('visibility');

            // Add visible class just in case CSS relies on it
            card.classList.add('is-visible');
        });
    });

})();
