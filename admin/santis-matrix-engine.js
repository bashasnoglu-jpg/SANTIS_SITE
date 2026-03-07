// santis-matrix-engine.js - The Sovereign Core V2

class SovereignMatrix {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.gap = options.gap || 20;
        this.minColWidth = options.minColWidth || 320;

        this.columns = [];
        this.cards = [];

        // SSE Batching (Kuantum Kuyruğu) state
        this.isProcessingQueue = false;
        this.sseQueue = [];

        // Flag to prevent double init
        if (this.container.dataset.matrixInit) return;
        this.container.dataset.matrixInit = true;

        this.initEngine();
    }

    initEngine() {
        // Base styling for absolute container
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.transition = 'height 0.3s ease-in-out';
        this.container.style.display = 'block';

        // 1. ResizeObserver: Debounce kalkaný eklendi
        let resizeTimeout;
        const ro = new ResizeObserver(() => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                requestAnimationFrame(() => this.calculateMatrix());
            }, 50); // Maksimum saniyede 20 kare (GPU Erimesini Önler)
        });
        ro.observe(this.container);

        // 2. Kesişim Gözlemcisi (Void Engine / Sanallaştırma)
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const img = entry.target.querySelector('img.void-target');
                if (!img) return;

                if (entry.isIntersecting) {
                    // Ekrana girince gerçek src'yi yükle
                    if (!img.src || img.src === window.location.href) {
                        img.src = img.dataset.src;
                    }
                    entry.target.classList.remove('void-skeleton');

                    // Native CSS optimization if supported
                    if ('contentVisibility' in entry.target.style) {
                        entry.target.style.contentVisibility = 'visible';
                    }
                } else {
                    // Ekrandan çýkınca içeriği gizle, dom performansını artır
                    if ('contentVisibility' in entry.target.style) {
                        entry.target.style.contentVisibility = 'auto';
                    }
                }
            });
        }, { rootMargin: "800px 0px" }); // 800px tampon alan
    }

    // İlk DOM yüklemesindeki kartları yakalar ve sisteme kaydeder
    ingestDOMNodes() {
        const domCards = Array.from(this.container.children).filter(el => el.classList.contains('matrix-asset-card'));
        this.cards = domCards;
        this.cards.forEach(card => {
            card.style.position = 'absolute';
            card.style.top = '0';
            card.style.left = '0';
            card.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease';
            this.observer.observe(card);
        });

        // Start layout calculation
        this.calculateMatrix();
    }

    calculateMatrix() {
        if (!this.container) return;

        const containerWidth = this.container.offsetWidth;
        if (containerWidth === 0) return; // Görünmezken işlem yapma

        // Sütun sayısını bul (min 1 sütun)
        let colCount = Math.floor((containerWidth + this.gap) / (this.minColWidth + this.gap));
        colCount = Math.max(1, colCount);

        const actualColWidth = (containerWidth - (this.gap * (colCount - 1))) / colCount;
        this.columns = Array(colCount).fill(0);

        this.cards.forEach((card) => {
            // Whale Card (SAS > 90) tespiti
            const isWhale = card.classList.contains('whale-node') && colCount > 1;

            let targetColIndex = 0;
            let yPos = 0;

            if (isWhale) {
                // THE WHALE ALGORITHM (Kuantum Vadisi / Quantum Valley)
                let minCombinedHeight = Infinity;
                let minVariance = Infinity;

                for (let i = 0; i < colCount - 1; i++) {
                    const h1 = this.columns[i];
                    const h2 = this.columns[i + 1];
                    const currentMax = Math.max(h1, h2);
                    const variance = Math.abs(h1 - h2);

                    // Öncelik: En küçük boy farkı olan 2 sütun (Kör empty space olmasın)
                    // İkincil: Daha yukarýda olan sütunlar
                    if (variance < minVariance || (variance === minVariance && currentMax < minCombinedHeight)) {
                        minVariance = variance;
                        minCombinedHeight = currentMax;
                        targetColIndex = i;
                    }
                }

                yPos = minCombinedHeight;
                card.style.width = `${(actualColWidth * 2) + this.gap}px`;

                // İki sütunu da aynı hizaya getir (Whale'in bittiği alt çizgi)
                const newHeight = yPos + card.offsetHeight + this.gap;
                this.columns[targetColIndex] = newHeight;
                this.columns[targetColIndex + 1] = newHeight;

            } else {
                // STANDART KART (En Kısa Sütunu Bul)
                let minHeight = this.columns[0];
                for (let i = 1; i < colCount; i++) {
                    if (this.columns[i] < minHeight) {
                        minHeight = this.columns[i];
                        targetColIndex = i;
                    }
                }
                yPos = minHeight;
                card.style.width = `${actualColWidth}px`;

                // Tek sütunun yüksekliğini eşitle
                this.columns[targetColIndex] = yPos + card.offsetHeight + this.gap;
            }

            const xPos = targetColIndex * (actualColWidth + this.gap);

            // Akıcı geçişi garantile -> transition ile translate3d !
            requestAnimationFrame(() => {
                card.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
            });
        });

        // Konteyner alanını en uzun sütuna çek ki alttaki içeriklerle karışmasın
        const maxHeight = Math.max(...this.columns);
        this.container.style.height = `${maxHeight}px`;
    }

    // --- THE SSE TSUNAMI ENGINES ---
    injectGenesisCard(assetMetadata) {
        // Doğrudan DOM'a basma, kuyruðA (Queue) al. Race-condition önler.
        this.sseQueue.push(assetMetadata);
        if (!this.isProcessingQueue) {
            this.isProcessingQueue = true;
            setTimeout(() => {
                this.processSSEQueue();
            }, 200); // 200ms batching (Saniyede max 5 çizim)
        }
    }

    processSSEQueue() {
        if (this.sseQueue.length === 0) {
            this.isProcessingQueue = false;
            return;
        }

        const assetsToInject = [...this.sseQueue];
        this.sseQueue = []; // kuyruðu boþalt

        // Sondan başa işliyoruz çünkü insertBefore ile tepeye ekleyeceğiz
        assetsToInject.reverse().forEach(asset => {
            // integrated_hub'daki render fonksiyonunu kanca ile çağırıyoruz
            let rawDOM = '';
            if (typeof renderMatrixCardHTML === 'function') {
                rawDOM = renderMatrixCardHTML(asset);
            } else if (window.renderMatrixCardHTML) {
                rawDOM = window.renderMatrixCardHTML(asset);
            } else {
                console.error("renderMatrixCardHTML hook not found!");
                return;
            }

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = rawDOM.trim();
            const newCard = tempDiv.firstChild;

            // Masonry Initialization values
            newCard.style.position = 'absolute';
            newCard.style.top = '0';
            newCard.style.left = '0';

            // Kuantum İniş Fizigi (Yere Çarpma Animasyonu)
            newCard.style.transform = "translate3d(0, -100px, 0) scale(0.8)";
            newCard.style.opacity = "0";
            newCard.style.transition = "transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease-in";

            // Parlak glow (Aura) sýnýflarý the genesis drop için
            newCard.classList.add('shadow-[0_0_50px_rgba(212,175,55,0.8)]', 'border-santis-gold', 'z-50');

            this.container.insertBefore(newCard, this.container.firstChild);

            // Reflow
            void newCard.offsetWidth;

            newCard.style.opacity = "1";

            // Glow'u yavaşça söndür
            setTimeout(() => {
                newCard.classList.remove('shadow-[0_0_50px_rgba(212,175,55,0.8)]', 'border-santis-gold', 'z-50');
            }, 3000);

            // Yeni kartı havuza al
            this.cards.unshift(newCard);
            this.observer.observe(newCard);
        });

        // 3. Grid Koordinatlarını Baştan Hesapla (Tüm kartlar translate ile kayacak / Fluid Drop)
        this.calculateMatrix();

        // Akış esnasında yeni varlıklar geldiyse süreci devam ettir
        if (this.sseQueue.length > 0) {
            setTimeout(() => this.processSSEQueue(), 200);
        } else {
            this.isProcessingQueue = false;
        }
    }

    purgeCard(assetId) {
        const cardIndex = this.cards.findIndex(c => c.dataset && c.dataset.assetId === assetId);
        if (cardIndex > -1) {
            const card = this.cards[cardIndex];
            this.observer.unobserve(card);

            // Kayboluş animasyonu
            card.style.opacity = '0';
            card.style.transform += ' scale(0.5)';

            setTimeout(() => {
                card.remove();
                this.cards.splice(cardIndex, 1);
                this.calculateMatrix(); // Kalanları sıkıştır
            }, 400); // CSS transition süresi kadar bekle
        }
    }

    // ==========================================
    // 👁️ PHASE 55: TELEMETRY SHIELD & ORACLE
    // ==========================================

    activateTelemetry() {
        console.log("👁️ [TELEMETRY SHIELD] Gözler açıldı. Kuantum izleme aktif.");

        // Kuantum Kimlik ve Havuz
        this.telemetryData = {
            client_id: sessionStorage.getItem("sovereign_sid") || "sv_" + Math.random().toString(36).substr(2, 9),
            mouse_moves: 0,
            scroll_depth: 0,
            hesitation_events: [],
            timestamp: 0
        };
        sessionStorage.setItem("sovereign_sid", this.telemetryData.client_id);

        // 1. İşlemci Dostu (60FPS) Mouse Takibi
        this.throttleMove = false;
        document.addEventListener('mousemove', () => {
            if (!this.throttleMove) {
                requestAnimationFrame(() => {
                    this.telemetryData.mouse_moves++;
                    this.throttleMove = false;
                });
                this.throttleMove = true;
            }
        });

        // 2. Scroll Derinliği Takibi (Performans Zırhlı)
        let scrollTimeout;
        window.addEventListener("scroll", () => {
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => {
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                this.telemetryData.scroll_depth = Math.max(this.telemetryData.scroll_depth, Math.round((window.scrollY / docHeight) * 100));
                scrollTimeout = null;
            }, 150);
        });

        // 3. Kararsızlık (Hesitation) & Tıklama (Event Delegation)
        this.hoverTimers = {};

        this.container.addEventListener('mouseover', (e) => {
            const card = e.target.closest('.matrix-asset-card');
            if (card && !this.hoverTimers[card.id]) {
                this.hoverTimers[card.id] = Date.now();
            }
        });

        this.container.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.matrix-asset-card');
            if (card && this.hoverTimers[card.id]) {
                const dwellTime = Date.now() - this.hoverTimers[card.id];
                const isWhale = card.classList.contains('whale-node'); // SAS > 0.90 Kalkanı

                // Sadece 500ms'den uzun (anlamlı) bakışları yakala
                if (dwellTime > 500) {
                    this.telemetryData.hesitation_events.push({
                        price_id: card.id, // FastAPI şeması price_id bekliyor
                        hesitation_ms: dwellTime
                    });

                    if (isWhale && dwellTime > 2000) {
                        console.log(`🐋 [WHALE DETECTED] Hayalet VIP radarda: ${dwellTime}ms`);
                    } else {
                        console.log(`🔵 [HOVER] Kararsızlık: ${dwellTime}ms`);
                    }
                }
                delete this.hoverTimers[card.id];
            }
        });

        this.container.addEventListener('click', (e) => {
            const card = e.target.closest('.matrix-asset-card');
            if (card) {
                console.log(`🟢 [CLICK] Hedef: ${card.id}`);
                // Görsel geri bildirim (Kuantum dalgalanması)
                const innerImg = card.querySelector('img');
                if (innerImg) {
                    innerImg.style.transform = 'scale(0.95)';
                    setTimeout(() => innerImg.style.transform = 'scale(1)', 200);
                }
            }
        });

        // 4. Kalp Atışı (Pulse): Her 5 saniyede bir Kuantum Havuzunu God Mode'a boşalt
        setInterval(() => this.flushTelemetry(), 5000);

        // 5. Son Nefes Protokolü (Kullanıcı sekmeyi kapatırsa mermi gibi veriyi fırlat)
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") this.flushTelemetry(true);
        });
    }

    async flushTelemetry(isBeacon = false) {
        if (this.telemetryData.mouse_moves === 0 && this.telemetryData.hesitation_events.length === 0) return;

        this.telemetryData.timestamp = Date.now();
        const payload = JSON.stringify(this.telemetryData);

        try {
            if (isBeacon) {
                const blob = new Blob([payload], { type: 'application/json' });
                navigator.sendBeacon('/api/v1/telemetry/ingest', blob);
            } else {
                await fetch('/api/v1/telemetry/ingest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload
                });
            }
        } catch (e) {
            console.warn("👁️ [God Mode] Telemetry nabzı (pulse) iletilemedi.");
        }

        // RAM'i temizle, yeni döngüye hazırlan (Sızıntıyı önle)
        this.telemetryData.mouse_moves = 0;
        this.telemetryData.hesitation_events = [];
    }

    // 📡 Dışarıdan gelen SSE (TELEMETRY_PULSE) sinyallerini DOM Heatmap'ine çevirir
    visualizeTelemetry(pulseEvent) {
        // pulseEvent örneği: { type: 'TELEMETRY_PULSE', hesitation_events: [{price_id: 'card-id', hesitation_ms: 1500}], is_whale: true }
        if (!pulseEvent.hesitation_events) return;

        pulseEvent.hesitation_events.forEach(event => {
            const card = document.getElementById(event.price_id);
            if (!card) return;

            // Görsel Heatmap Efekti Yarat
            const glow = document.createElement('div');
            glow.className = "absolute inset-0 pointer-events-none transition-opacity duration-1000";

            if (pulseEvent.is_whale || event.hesitation_ms > 3000) {
                // Whale tespiti kırmızı / altın aurayla yanar
                glow.classList.add('bg-red-500/20', 'shadow-[inset_0_0_50px_rgba(239,68,68,0.5)]');
            } else {
                // Standart hover mavi aurayla yanar
                glow.classList.add('bg-blue-500/10', 'shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]');
            }

            card.appendChild(glow);

            // Neon Glow'un sönmesi
            setTimeout(() => {
                glow.style.opacity = '0';
                setTimeout(() => glow.remove(), 1000);
            }, 1000);
        });
    }
}

window.SovereignMatrix = SovereignMatrix;
