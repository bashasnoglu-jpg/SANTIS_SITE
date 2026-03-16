/**
 * ═══════════════════════════════════════════════════════════
 * 🧠 SPAOS: ENGAGE SENTIENCE — METRIC SNIFFER & HOT REPLACER
 * ═══════════════════════════════════════════════════════════
 * 
 * Bu modül "SovereignBus" katmanına entegre olarak çalışır:
 * 1. Metric Sniffer: Belirlenmiş alanlardaki (data-sentience-slot)
 *    kullanıcı davranışlarını (Scroll, Hover, View) 30Hz'de örnekler,
 *    belirli aralıklarla (batch) SovereignBus üzerinden arka plana fırlatır.
 * 2. Hot Component Replacer: Arka plandaki Yapay Zeka (Engage Sentience Engine)
 *    bir slot'un SAS skorunu yetersiz (failing) bulup "AUTONOMOUS_SWAP" yolladığında,
 *    DOM'u Shadow/Virtual DOM teknikleri veya yumuşak CSS transition'ları ile
 *    sarsıntısızca değiştirir.
 */

(function () {
    'use strict';

    if (window.EngageSentience) return;

    class SentienceEngine {
        constructor() {
            this.slots = new Map(); // Kök DOM öğeleri ve metrikleri tutulur
            this.batchQueue = [];
            this.flushInterval = 5000; // Her 5 saniyede bir merkeze raporla
            this.initialized = false;
        }

        init() {
            if (this.initialized) return;
            if (!window.SovereignBus) {
                console.warn("[Engage Sentience] SovereignBus bulunamadı. Boot iptal ediliyor.");
                return;
            }

            console.log("🧠 [Engage Sentience] Metric Sniffer ve Hot Replacer devreye alındı.");

            // 1. Sayfadaki slotları bul ve izlemeye başla
            this.scanSlots();

            // 2. Dinamik olarak eklenen slotları yakalamak için MutationObserver
            this.setupObserver();

            // 3. Telemetri gönderim döngüsü
            setInterval(() => this.flushTelemetry(), this.flushInterval);

            // 4. "The Silent Judgement" - Makineden gelen değiştirme emri
            window.SovereignBus.subscribe('AUTONOMOUS_SWAP', (payload) => this.hotReplace(payload));

            this.initialized = true;
        }

        /** Sayfadaki tüm data-sentience-slot'ları tarar */
        scanSlots() {
            const elements = document.querySelectorAll('[data-sentience-slot]');
            elements.forEach(el => this.registerSlot(el));
        }

        /** Slot kaydı ve Sniffer Event Listener'ları */
        registerSlot(element) {
            const slotId = element.getAttribute('data-sentience-slot');
            const contentId = element.getAttribute('data-sentience-content');
            
            if (!slotId || this.slots.has(slotId)) return;

            const slotMetrics = {
                element: element,
                slotId: slotId,
                contentId: contentId,
                viewStart: null,
                totalDwellTime: 0,
                interactions: 0,
            };

            this.slots.set(slotId, slotMetrics);

            // Hover (Micro-interaction sniffing)
            element.addEventListener('mouseenter', () => {
                slotMetrics.interactions++;
                this.pushEvent('hover', slotId, contentId);
            });

            element.addEventListener('click', () => {
                slotMetrics.interactions++;
                this.pushEvent('interaction', slotId, contentId);
            });

            // Intersection (View & Dwell Time Sniffing)
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Slot ekrana girdi
                        slotMetrics.viewStart = performance.now();
                        this.pushEvent('view', slotId, contentId);
                    } else {
                        // Slot ekrandan çıktı, süreyi hesapla
                        if (slotMetrics.viewStart) {
                            const dwell = performance.now() - slotMetrics.viewStart;
                            slotMetrics.totalDwellTime += dwell;
                            this.pushEvent('dwell', slotId, contentId, { duration: Math.floor(dwell) });
                            slotMetrics.viewStart = null;
                        }
                    }
                });
            }, { threshold: 0.5 });

            observer.observe(element);
        }

        /** Gelen emirle DOM'u pürüzsüzce (Sarsıntısız) değiştirir */
        hotReplace(payload) {
            /* 
             * Payload Format: 
             * {
             *   type: "AUTONOMOUS_SWAP",
             *   slot_id: "hero_slot",
             *   new_content_id: "hero_v2_dark",
             *   html_payload: "<div...>", // Ebatları korunmuş yeni html
             * }
             */
            const { slot_id, new_content_id, html_payload } = payload;
            const slotMetrics = this.slots.get(slot_id);

            if (!slotMetrics || !slotMetrics.element) {
                console.warn(`[Engage Sentience] Hedef slot bulunamadı: ${slot_id}`);
                return;
            }

            console.log(`⚡ [Engage Sentience] Matrix Swap Başlıyor: [${slot_id}] -> [${new_content_id}]`);

            const targetEl = slotMetrics.element;

            // Sarsıntısız Geçiş İçin (Hot Replacement with Cross-Fade)
            // 1. Elementin mevcut ebatlarını dondur (Layout Shift/CLS önlemi)
            const rect = targetEl.getBoundingClientRect();
            targetEl.style.width = `${rect.width}px`;
            targetEl.style.height = `${rect.height}px`;
            targetEl.style.overflow = 'hidden';
            targetEl.style.position = 'relative';

            // 2. Yeni içeriği off-screen (shadow benzeri) hazırla
            const newLayer = document.createElement('div');
            newLayer.innerHTML = html_payload;
            newLayer.style.position = 'absolute';
            newLayer.style.top = '0';
            newLayer.style.left = '0';
            newLayer.style.width = '100%';
            newLayer.style.height = '100%';
            newLayer.style.opacity = '0';
            newLayer.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

            // İçeriği ekle
            targetEl.appendChild(newLayer);

            // Reflow zorla
            void newLayer.offsetWidth; 

            // 3. Fade-in, ardından eski içeriği sil
            requestAnimationFrame(() => {
                newLayer.style.opacity = '1';
                
                // Animasyon bitince temizlik
                setTimeout(() => {
                    targetEl.innerHTML = html_payload;
                    targetEl.setAttribute('data-sentience-content', new_content_id);
                    
                    // Style kilitlerini aç
                    targetEl.style.width = '';
                    targetEl.style.height = '';
                    targetEl.style.overflow = '';
                    targetEl.style.position = '';

                    // Metrikleri sıfırla
                    slotMetrics.contentId = new_content_id;
                    slotMetrics.interactions = 0;
                    slotMetrics.totalDwellTime = 0;

                }, 850); // 800ms transition + 50ms buffer
            });
        }

        /** DOM Değişikliklerini Gözetler */
        setupObserver() {
            const observer = new MutationObserver((mutations) => {
                for (let mutation of mutations) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) { // ELEMENT_NODE
                                if (node.hasAttribute('data-sentience-slot')) {
                                    this.registerSlot(node);
                                }
                                // İçindeki alt düğümleri de tara
                                const innerSlots = node.querySelectorAll('[data-sentience-slot]');
                                innerSlots.forEach(inner => this.registerSlot(inner));
                            }
                        });
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        /** Telemetri paketini sıraya alır */
        pushEvent(type, slotId, contentId, extra = {}) {
            this.batchQueue.push({
                type: type,
                slot_id: slotId,
                content_id: contentId,
                timestamp: Date.now(),
                ...extra
            });
        }

        /** Kuyruktaki batch paketleri arka plana fırlatır */
        flushTelemetry() {
            if (this.batchQueue.length === 0) return;
            
            const payload = [...this.batchQueue];
            this.batchQueue = []; // Reset

            if (window.SovereignBus && window.SovereignBus.connected) {
                window.SovereignBus.send({
                    type: 'ENGAGE_TELEMETRY_BATCH',
                    tenant: window.SANTIS_TENANT || 'hq_global',
                    events: payload
                });
            }
        }
    }

    // Singleton Export
    window.EngageSentience = new SentienceEngine();

    // Auto-boot if bus is ready
    document.addEventListener('DOMContentLoaded', () => {
        // SovereignBus'un yüklenmesi için ufak bir gecikme
        setTimeout(() => window.EngageSentience.init(), 100);
    });

})();
