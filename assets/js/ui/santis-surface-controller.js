/**
 * SANTIS Sovereign OS - Surface Lifecycle Controller
 * Path: /assets/js/ui/santis-surface-controller.js
 */
import { SantisCardGenerator } from './santis-card-generator.js';
import { IntegrityManager } from '../core/santis-integrity.js';

export const SurfaceController = {
    init() {
        console.log("[SURFACE]: Booting Data-Driven Sovereign Experience...");
        
        const pageType = document.activeElement && document.body.dataset.page ? document.body.dataset.page : 'massage'; 

        if (pageType === 'massage') {
            SantisCardGenerator.generate('massage', 'highlight', 'sov-3d-stage');
            SantisCardGenerator.generate('massage', 'klasik', 'sov-3d-stage-klasik');
            SantisCardGenerator.generate('massage', 'spor-terapi', 'sov-3d-stage-spor-terapi');
            SantisCardGenerator.generate('massage', 'asya', 'sov-3d-stage-asya');
            SantisCardGenerator.generate('massage', 'bolgesel', 'sov-3d-stage-bolgesel');
        } else if (pageType === 'skincare') {
            SantisCardGenerator.generate('skincare', 'highlight', 'sov-3d-stage');
            SantisCardGenerator.generate('skincare', 'arindirma', 'stage-arindirma');
            SantisCardGenerator.generate('skincare', 'nem-isilti', 'stage-nem-isilti');
            SantisCardGenerator.generate('skincare', 'anti-age', 'stage-anti-aging');
            SantisCardGenerator.generate('skincare', 'homme', 'stage-erkek-bakimi');
        }

        this.bindCarousels();
        this.registerPriceBridge();
        this.registerShield();
    },

    bindCarousels() {
        if (typeof window.initCoverFlowCarousel === 'function') {
            window.initCoverFlowCarousel();
            console.log("🎡 [SURFACE]: Sovereign Carousels Initialized.");
        } else {
            console.warn("[SURFACE]: Cover Flow module pending Bootloader.");
        }
    },

    registerShield() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log("[INTEGRITY]: Sovereign Shield Active (Scope: " + reg.scope + ")"))
                .catch(err => console.error("[INTEGRITY]: Shield failure:", err));
        }
    },

    registerPriceBridge() {
        this._priceSocketStopped = false;

        if (this._priceBridgeBound) {
            return;
        }

        this._priceBridgeBound = true;
        this._priceEventHandler = (event) => {
            this.applyPriceAdjustment(event.detail);
        };

        document.addEventListener('sovereign:price-adjusted', this._priceEventHandler);

        if (window.SovereignBus && typeof window.SovereignBus.subscribe === 'function') {
            window.SovereignBus.subscribe('PRICE_ADJUSTED', (data) => {
                this.emitPriceAdjustment(data && data.payload ? data.payload : data);
            });
        }

        this.connectPriceSocket();
    },

    connectPriceSocket() {
        if (this._priceSocketStopped) {
            return;
        }

        if (
            this._priceSocket &&
            (this._priceSocket.readyState === WebSocket.OPEN ||
                this._priceSocket.readyState === WebSocket.CONNECTING)
        ) {
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const gatewayUrl = `${protocol}${window.location.hostname || 'localhost'}:4040`;

        try {
            this._priceSocket = new WebSocket(gatewayUrl);
        } catch (error) {
            console.warn('[SURFACE]: Price bridge socket could not be created.', error);
            return;
        }

        this._priceSocket.onmessage = (event) => {
            try {
                const envelope = JSON.parse(event.data);
                if (
                    envelope &&
                    envelope.type === 'EVENT' &&
                    envelope.payload &&
                    envelope.payload.action === 'PRICE_ADJUSTED'
                ) {
                    this.emitPriceAdjustment(envelope.payload);
                }
            } catch (_) {
                // Ignore non-constitutional packets on this bridge.
            }
        };

        this._priceSocket.onclose = () => {
            this._priceSocket = null;

            if (!this._priceSocketStopped) {
                window.setTimeout(() => this.connectPriceSocket(), 2000);
            }
        };
    },

    emitPriceAdjustment(payload) {
        if (!payload || payload.action !== 'PRICE_ADJUSTED') {
            return;
        }

        document.dispatchEvent(
            new CustomEvent('sovereign:price-adjusted', {
                detail: payload
            })
        );
    },

    applyPriceAdjustment(payload) {
        if (!payload) {
            return;
        }

        const ritualIds = [...new Set(
            Array.isArray(payload.affectedRitualIds) && payload.affectedRitualIds.length
                ? payload.affectedRitualIds
                : [payload.requestedRitualId, payload.ritualId].filter(Boolean)
        )];

        let updatedCount = 0;

        ritualIds.forEach((ritualId) => {
            const selectorId =
                window.CSS && typeof window.CSS.escape === 'function'
                    ? window.CSS.escape(ritualId)
                    : String(ritualId).replace(/"/g, '\\"');

            document.querySelectorAll(`[data-ritual-id="${selectorId}"]`).forEach((card) => {
                const priceTag = card.querySelector('.santis-card__meta');
                const metaText = card.dataset.ritualMeta || (priceTag ? priceTag.textContent.split(' — €')[0] : '');

                if (priceTag) {
                    priceTag.textContent = payload.newPrice
                        ? `${metaText} — €${payload.newPrice}`
                        : metaText;
                }

                card.dataset.displayPrice = String(payload.newPrice);
                card.classList.add('santis-card--updated');
                card.style.transition = 'transform 420ms ease, box-shadow 420ms ease';
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = '0 20px 48px rgba(212, 175, 55, 0.22)';

                window.setTimeout(() => {
                    card.classList.remove('santis-card--updated');
                    card.style.transform = '';
                    card.style.boxShadow = '';
                }, 1400);

                updatedCount += 1;
            });
        });

        if (updatedCount > 0) {
            console.log(
                `[SURFACE]: Price overlay applied to ${updatedCount} ritual node(s) for ${payload.ritualId}.`
            );
        }
    },

    teardown() {
        console.log("[SURFACE]: Tearing down Experience...");
        
        if (window.SantisGodCanvas) {
            window.SantisGodCanvas.stop();
        } else if (document.getElementById('santis-god-canvas')) {
            const canvas = document.getElementById('santis-god-canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('2d');
            if (gl && gl.getExtension('WEBGL_lose_context')) {
                gl.getExtension('WEBGL_lose_context').loseContext();
            }
            canvas.remove();
            console.log("[TEARDOWN]: GodCanvas purged from memory. Integrity maintained.");
        }
        
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }

        this._priceSocketStopped = true;
        if (this._priceSocket) {
            this._priceSocket.close();
            this._priceSocket = null;
        }

        if (this._priceBridgeBound && this._priceEventHandler) {
            document.removeEventListener('sovereign:price-adjusted', this._priceEventHandler);
            this._priceBridgeBound = false;
            this._priceEventHandler = null;
        }
        
        this.destroyCarousels();
    }
};

window.destroyGodCanvas = function() {
    SurfaceController.teardown();
};

document.addEventListener('DOMContentLoaded', () => SurfaceController.init());
document.addEventListener('sovereign:modulesLoaded', () => SurfaceController.init());
