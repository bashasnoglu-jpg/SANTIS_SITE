/**
 * SANTIS OS - SOVEREIGN DATA BRIDGE V1
 * Kuantum Veri Enjektörü & FOMO Arbitraj Motoru
 * 
 * JSON Matrix'i (Kuantum DNA) çeker, FOMO çarpanıyla fiyatları manipüle eder,
 * VDOM'u HTML olarak inşa edip SantisDiffEngine'e cerrahi yama emri verir.
 */

export class SovereignDataBridge {
    constructor(diffEngine, containerSelector = '#santis-app') {
        this.diffEngine = diffEngine;
        this.containerSelector = containerSelector;
        this.appContainer = document.querySelector(containerSelector);

        // Sistemin kalbindeki FOMO Çarpanı (Sovereign Surge)
        // Eğer sistem yoğunsa bu oran 1.15x'e (Surge Pricing) çıkabilir.
        this.surgeMultiplier = 1.0;

        console.log("🦅 [Sovereign Bridge] Veri Enjektörü ve FOMO Motoru Hazır.");
    }

    /**
     * Dışarıdan veya iç sistemden FOMO çarpanını günceller.
     * Bu tetiklendiğinde tüm fiyatlar O(1) hızında ekranda (Diff ile) güncellenir.
     */
    setSurgeMultiplier(multiplier) {
        this.surgeMultiplier = multiplier;
        console.log(`📈 [Revenue Brain] FOMO Arbitrajı Aktif! Çarpan: ${multiplier}x`);
    }

    /**
     * Kuantum Yakıtını (JSON) Sisteme Pompalar.
     * @param {string} endpoint JSON Veri Yolu (Örn: '/api/v1/rituals.json')
     */
    async injectMatrix(endpoint) {
        if (!this.appContainer) {
            console.error("[Sovereign Bridge] Hedef Container Bulunamadı!");
            return;
        }

        try {
            // 1. GHOST FETCH: Veriyi Sessizce Çek
            const response = await fetch(endpoint);
            const matrix = await response.json();

            // 2. VDOM İNŞASI: Yeni HTML Ağacını Hafızada (Sanal) Yarat
            const virtualContainer = document.createElement('div');
            virtualContainer.id = this.appContainer.id;
            virtualContainer.className = this.appContainer.className;

            matrix.rituals.forEach(ritual => {
                const card = this.renderRitualCard(ritual);
                virtualContainer.appendChild(card);
            });

            // 3. THE QUANTUM MORPH: SantisDiffEngine ile Cerrahi Yama
            // Ekrandaki eski kartları silmeden, sadece değişen (fiyat, hash) kısımları yamalar.
            this.diffEngine.patchContainer(this.appContainer, virtualContainer);

            // 4. SİSTEMİ UYAR: Mesh ve GPU Field'a "Yeni Veri Geldi" Sinyali
            if (window.Santis && window.Santis.Bus) {
                window.Santis.Bus.emit('matrix:injected', { count: matrix.rituals.length });
            }

        } catch (error) {
            console.error("[Sovereign Bridge] Matrix Enjeksiyonu Başarısız:", error);
        }
    }

    /**
     * JSON'daki Kuantum DNA'sını kusursuz bir HTML Kartına çevirir.
     * data-key, data-hash, data-aura mühürlerini basar.
     */
    renderRitualCard(ritual) {
        const card = document.createElement('div');
        card.className = 'santis-card-armor';

        // --- ZORUNLU KUANTUM MÜHÜRLERİ ---
        card.setAttribute('data-key', ritual.key);
        card.setAttribute('data-hash', ritual.hash);

        // GPU Field için Aura Değerleri (Aralarına virgül koyarak string'e çevir)
        const rgbString = ritual.gpu_dna.color.join(',');
        card.setAttribute('data-aura-color', rgbString);
        card.setAttribute('data-aura-effect', ritual.gpu_dna.effect_multiplier);

        // --- FOMO ARBİTRAJI (Sovereign Pricing) ---
        // Fiyatı dinamik çarpanla hesapla ve pürüzsüzce yuvarla
        const finalPrice = Math.round(ritual.ui.price_eur * this.surgeMultiplier);

        // --- İÇERİK İNŞASI (Sığ Metin Diff'i İçin Optimize Edildi) ---
        card.innerHTML = `
            <div class="santis-card-content">
                <h2 class="santis-card-title" data-text="title">${ritual.ui.title}</h2>
                <div class="santis-card-meta">
                    <span class="santis-duration" data-text="duration">${ritual.ui.duration}</span>
                    <span class="santis-price" data-text="price">€${finalPrice}</span>
                </div>
            </div>
            <button class="santis-intent-btn" data-id="${ritual.key}">
                <span>Mühürle</span>
            </button>
        `;

        return card;
    }
}

window.SovereignDataBridge = SovereignDataBridge;
