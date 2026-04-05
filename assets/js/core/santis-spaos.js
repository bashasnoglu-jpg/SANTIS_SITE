/**
 * Santis SpaOS Core Orchestrator (Phase 1 MVP)
 * Sorumluluk: Veritabanı ve Event Zinciri Yönetimi
 */
window.SantisSpaOS = (function() {
    const EventBus = document.createElement('div');

    function emit(eventName, payload) {
        console.log(`🟢 [SpaOS Event] ${eventName}`, payload);
        const event = new CustomEvent(eventName, { detail: payload });
        EventBus.dispatchEvent(event);
    }

    function on(eventName, callback) {
        EventBus.addEventListener(eventName, (e) => callback(e.detail));
    }

    function triggerCheckoutCompleted(packageData, customerDetails) {
        emit('checkout.completed', { package: packageData, customer: customerDetails, timestamp: Date.now() });
        
        // Olay zancirini başlat
        emit('package.sold', {
            transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            package: packageData,
            customer: customerDetails,
            soldAt: new Date().toISOString()
        });
    }

    let db = { services: [], packages: [] };

    async function loadData() {
        try {
            const svcRes = await fetch('/assets/data/spaos-services.json');
            db.services = await svcRes.json();
            
            const pkgRes = await fetch('/assets/data/spaos-packages.json');
            db.packages = await pkgRes.json();
            console.log('✅ [SpaOS] Data Layer yüklendi. (Görsel vitrin için hazır)');
        } catch (err) {
            console.error('❌ [SpaOS] Data Layer yüklenemedi!', err);
        }
    }

    return {
        init: function() {
            console.log('⚡ [SpaOS] Core Orchestrator başlatılıyor...');
            loadData();
        },
        on: on,
        emit: emit,
        triggerCheckout: triggerCheckoutCompleted,
        getDatabase: () => db
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    if(window.SantisSpaOS) window.SantisSpaOS.init();
});
