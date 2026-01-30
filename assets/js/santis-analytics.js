/* SANTIS INSIGHT BRIDGE - GA4 EVENT TRACKING */
const SANTIS_ANALYTICS = {
    // 1. WhatsApp / Concierge Tıklamasını Ölç
    trackConciergeClick(serviceName) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'generate_lead', {
                'service_name': serviceName,
                'method': 'WhatsApp Concierge',
                'event_category': 'Engagement'
            });
        }
        console.log("📊 Analytics: Concierge Click Tracked for " + serviceName);
    },
    // 2. Sepete Ekleme Aksiyonunu Ölç
    trackAddToCart(serviceName, price) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'add_to_cart', {
                'items': [{
                    'item_name': serviceName,
                    'price': price,
                    'currency': 'EUR'
                }]
            });
        }
    }
};

// Sayfa yüklendiğinde Concierge butonuna dinleyici ekle
document.addEventListener('DOMContentLoaded', () => {
    // Service Detail Page Context
    const cBtn = document.getElementById('concierge-btn');
    // dynamic-title is populated by detail-engine.js. 
    // Since detail-engine runs immediately at end of body, we might need to wait or poll, 
    // but usually DOMContentLoaded fires after scripts.

    if (cBtn) {
        cBtn.addEventListener('click', () => {
            const title = document.getElementById('dynamic-title')?.innerText || 'Unknown Service';
            SANTIS_ANALYTICS.trackConciergeClick(title);
        });
    }
});
