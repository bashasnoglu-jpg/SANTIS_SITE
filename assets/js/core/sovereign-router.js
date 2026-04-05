import { SovereignLedger, ContinuityReplayEngine } from './sovereign-core.js';

/**
 * =======================================================
 * L9 SOVEREIGN MPA NAVIGATION BRIDGE (v3 Kernal Layer)
 * "Distributed Runtime Bridge for Multi-Page Physics"
 * =======================================================
 */

export class SovereignMPABridge {
    constructor(arbitrator) {
        this.arbitrator = arbitrator;
        this._injectMeta();
        this._bindOutboundLayer();
        this._bindInboundLayer();
    }

    // A. Native View Transition Otonom Enjeksiyonu
    _injectMeta() {
        if (!document.querySelector('meta[name="view-transition"]')) {
            const meta = document.createElement('meta');
            meta.name = 'view-transition';
            meta.content = 'same-origin';
            document.head.appendChild(meta);
        }
    }

    // 🛫 B. GİDİŞ: Kâhin Modeli (Predictive Outbound Arbitration)
    _bindOutboundLayer() {
        // Safari ve Navigation API by-pass'larına karşı kusursuz click tüneli
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-sovereign-trigger]');
            if (!link) return;

            const willThrottle = this.arbitrator.budget.shouldThrottle();
            if (willThrottle) {
                // Eğer cihaz yanıyorsa bunu Ledger'a mühürle (SOS)
                SovereignLedger.write('PRESSURE_SPIKE', { level: this.arbitrator.budget.pressure });
            }

            SovereignLedger.write('NAV_INTENT', {
                triggerId: link.getAttribute('data-sovereign-trigger'),
                forceSync: willThrottle // Hedef sayfaya Mühür: Animasyon İptal Emri
            });

            link.style.viewTransitionName = 'sovereign-morph';
        });

        // Sayfa donmadan (Page Swap) önceki son salise: Momentum'u arşive göm.
        window.addEventListener('pageswap', (e) => {
            SovereignLedger.write('SCROLL_VECTOR', { v: this.arbitrator.quantizer.velocity });

            // Zaten boğuluyorsak, fırlatma sahnesini (Native VT) çöpe atarak donanımı koru
            if (e.viewTransition && this.arbitrator.budget.shouldThrottle()) {
                console.warn("[L9 Bridge] Outbound Frame Risk. Vetoing Native ViewTransition.");
                e.viewTransition.skipTransition();
            }
        });
    }

    // 🛬 C. VARIŞ: Replay Modeli ve Kuantum Tüneli
    _bindInboundLayer() {
        // Yeni sayfanın HTML'si indi ancak EKRANA ÇİZİLMEDİ (Frame 0)
        window.addEventListener('pagereveal', (e) => {
            // 1. REPLAY ENGINE: Geçmiş olayların Ledger üzerinden izole simülasyonu
            const intent = ContinuityReplayEngine.execute(this.arbitrator);
            
            if (!e.viewTransition) return;

            // 2. KORO FRENİ (Dual Arbitration Throttle)
            // Ya eski sayfa "forceSync" yolladı, ya da yeni sayfamızın Peer/Lokal sekmesinde kriz var!
            if (this.arbitrator.budget.shouldThrottle() || (intent && intent.forceSync)) {
                console.warn("[L9 Bridge] Inbound Transition Denied by Distributed Consensus.");
                e.viewTransition.skipTransition();
                SovereignLedger.clear();
                return;
            }

            // 3. KUANTUM EŞLEŞTİRME (Target Resolution)
            if (intent && intent.triggerId) {
                const target = document.querySelector(`[data-sovereign-receiver="${intent.triggerId}"]`);
                if (target) {
                    target.style.viewTransitionName = 'sovereign-morph';
                    
                    e.viewTransition.finished.finally(() => {
                        target.style.viewTransitionName = '';
                        document.documentElement.style.removeProperty('--l9-velocity');
                        SovereignLedger.clear(); // Safe state reached, burn the log.
                    });
                }
            }
        });

        // BFCache (Resurrect / Diriliş) Handling: RAM'den uyanma anı
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                console.warn("[L9 Bridge] BFCache Resurrect. Cleaning ghost transitions...");
                document.querySelectorAll('[style*="view-transition-name"]')
                        .forEach(el => el.style.viewTransitionName = '');
                SovereignLedger.clear();
            }
        });
    }
}
