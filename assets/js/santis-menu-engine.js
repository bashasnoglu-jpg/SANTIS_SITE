/**
 * SANTIS SOVEREIGN OS - MENU HYDRATION & TELEMETRY ENGINE
 * Mimarî Kural: "Arayüz sadece bir yansımadır, tek hakikat Data Manifest'tir."
 */

import { getServiceById } from '../data/menu-manifest.js';

class SantisMenuEngine {
    constructor() {
        this.cards = document.querySelectorAll('.santis-premium-card[data-service-id], .santis-stack-card[data-service-id], [data-service-id]');
        this.sourcePage = this._detectSourcePage();
        
        // Anti-Spam (Deduplication) Sets for Telemetry
        this.viewedCards = new Set();

        this.init();
    }

    init() {
        console.log(`[Sovereign Radar] Menu Engine initialized for ${this.cards.length} services.`);
        
        // 1. Hydration & Verification
        this.hydrateCards();

        // 2. Intersection Observer (View Telemetry)
        this.setupObservers();

        // 3. Event Delegation (Click/Interaction)
        this.setupDelegation();
    }

    _detectSourcePage() {
        const path = window.location.pathname;
        return path.split('/').pop() || 'index.html';
    }

    hydrateCards() {
        this.cards.forEach(card => {
            const serviceId = card.getAttribute('data-service-id');
            if (!serviceId) return;

            const serviceData = getServiceById(serviceId);
            
            // Eğer manifestte yoksa, sessizce yok et (veya warning bas)
            if (!serviceData) {
                console.warn(`[Sovereign Guard] Ghost Service Detected! ${serviceId} is not in Manifest. Disabling...`);
                card.style.opacity = '0.3';
                card.style.pointerEvents = 'none';
                return;
            }

            // Eğer pasifse
            if (!serviceData.active) {
                console.warn(`[Sovereign Guard] Inactive Service Displayed! ${serviceId} is hidden.`);
                card.style.display = 'none';
                return;
            }

            // Hydration Overwrites
            let mismatchDetected = false;

            // DOM Elemanlarını Bul
            const titleNodesTr = card.querySelectorAll('[data-role="service-title"][data-lang="tr"]');
            const durationNodes = card.querySelectorAll('[data-role="service-duration"]');
            const priceNodes = card.querySelectorAll('[data-role="service-price"]');
            const ctaNode = card.querySelector('[data-role="booking-cta"]');

            // 1. Duration Hydration
            durationNodes.forEach(node => {
                const currentText = node.innerText.trim();
                const expectedTextEn = `${serviceData.durationMinutes} Min`;
                const expectedTextTr = `${serviceData.durationMinutes} Dk`;
                
                if (currentText !== expectedTextTr && currentText !== expectedTextEn) {
                    mismatchDetected = true;
                    // Dil (lang) tespitine göre düzelt (Basit heuristic)
                    if (currentText.includes('Min')) node.innerText = expectedTextEn;
                    else node.innerText = expectedTextTr;
                }
            });

            // 2. Price Hydration
            priceNodes.forEach(node => {
                const currentText = node.innerText.trim();
                const expectedText = `${serviceData.priceEUR} €`;
                if (!currentText.includes(serviceData.priceEUR.toString())) {
                    mismatchDetected = true;
                    node.innerText = expectedText;
                }
            });

            // 3. CTA Yönlendirmesini Güvenceye Al
            if (ctaNode) {
                const expectedHref = `/spa-booking.html?service=${serviceId}`;
                if (ctaNode.getAttribute('href') !== expectedHref) {
                    ctaNode.setAttribute('href', expectedHref);
                }
            }

            if (mismatchDetected) {
                console.warn(`[Sovereign Sync] Manifest/DOM mismatch corrected for ${serviceId}`);
            }
        });
    }

    setupObservers() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const serviceId = card.getAttribute('data-service-id');
                    
                    // Dedupe Control
                    if (!this.viewedCards.has(serviceId)) {
                        this.viewedCards.add(serviceId);
                        this._fireTelemetry('SERVICE_CARD_VIEWED', serviceId);
                        observer.unobserve(card); // Observer spam'i kes (Dedupe)
                    }
                }
            });
        }, { threshold: 0.6 });

        this.cards.forEach(card => observer.observe(card));
    }

    setupDelegation() {
        // En yüksek parent kapsayıcıya tek event
        document.body.addEventListener('click', (e) => {
            const cta = e.target.closest('[data-role="booking-cta"]');
            if (!cta) return;

            const card = cta.closest('[data-service-id]');
            if (!card) return;

            const serviceId = card.getAttribute('data-service-id');
            this._fireTelemetry('BOOKING_STARTED_FROM_MENU', serviceId);
            
            // Link varsayılan davranışı çalışacak ve sayfaya gidecek (Prevent Default yapmıyoruz)
        });

        // Alternatif olarak inceleme (View without click) vs eklenebilir.
    }

    _fireTelemetry(eventType, serviceId) {
        const serviceData = getServiceById(serviceId);
        if (!serviceData) return;

        const payload = {
            type: eventType,
            serviceId: serviceData.id,
            category: serviceData.category,
            durationMinutes: serviceData.durationMinutes,
            priceEUR: serviceData.priceEUR,
            sourcePage: this.sourcePage,
            timestamp: Date.now()
        };

        // 1. Console Log for Local Dev
        console.log(`📡 [Telemetry] ${eventType}:`, payload);

        // 2. Global Integration Point (Radar or Apollo)
        if (window.SantisRadar && window.SantisRadar.dispatch) {
            window.SantisRadar.dispatch(payload);
        } else {
            // Global Custom Event Fırlatma
            window.dispatchEvent(new CustomEvent('sovereign:telemetry', { detail: payload }));
        }
    }
}

// Otoconnect Runtime
document.addEventListener('DOMContentLoaded', () => {
    window.MenuEngine = new SantisMenuEngine();
});
