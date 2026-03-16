/**
 * Sovereign Bento Orchestrator (Phase 31.5: Zero-Jank & Reveal)
 * =============================================================
 * Web Worker ile haberleşerek gelen filtreli veriyi (JSON)
 * Kinetik Bento Grid HTML yapısına dönüştürüp DOM'a aktarır.
 * scheduler.yield() API'si ile Task Chunking uygular.
 */

const yieldToMain = () => {
    return new Promise(resolve => {
        if (globalThis.scheduler && globalThis.scheduler.yield) {
            scheduler.yield().then(resolve);
        } else {
            // MessageChannel tabanlı hızlı (Zero-Delay) yield polyfill'i (setTimeout'dan daha verimli)
            const channel = new MessageChannel();
            channel.port1.onmessage = resolve;
            channel.port2.postMessage(null);
        }
    });
};

class BentoOrchestrator {
    constructor() {
        this.container = document.getElementById('santis-bento-universe');
        if (!this.container) return; // Bu sayfada framework yok
        
        this.category = this.container.getAttribute('data-category') || 'all';
        this.dataSource = '/assets/data/services.json'; // Default
        
        // Mağaza için ürünler datasını kullan
        if (this.category === 'boutique' || this.category === 'skincare') {
            // Şimdilik hepsi services.json'dan geliyor farz edelim, 
            // Gerekirse product-data.json verilebilir.
            if (document.body.getAttribute('data-page') === 'boutique') {
                this.dataSource = '/assets/data/product-data.json';
            }
        }

        this.initWorker();
    }

    initWorker() {
        // Worker'ı ayağa kaldır
        this.worker = new Worker('/assets/js/workers/santis-filter-worker.js');
        
        // Worker'dan gelen mesajları dinle
        this.worker.onmessage = (event) => {
            const { status, renderPayload, error, totalResults, computeTimeMs } = event.data;
            
            if (status === 'error') {
                console.error("🦅 Bento Orchestrator Error:", error);
                return;
            }
            if (status === 'ready') {
                console.log(`🦅 Bento Engine: Datacore initialized. Requesting filter for [${this.category}]...`);
                // Veri hazır, filtreleme komutu gönder
                this.requestFilter();
            }
            if (status === 'filtered') {
                console.log(`🦅 Bento Engine: Received ${totalResults} nodes in ${computeTimeMs}ms. Decoding Zero-Copy Buffer...`);
                let finalPayload = renderPayload;
                
                // ArrayBuffer ise (Zero-Copy) Decode Et
                if (renderPayload instanceof ArrayBuffer) {
                    const jsonStr = new TextDecoder().decode(renderPayload);
                    finalPayload = JSON.parse(jsonStr);
                }
                
                this.renderCards(finalPayload);
            }
        };

        // Worker'ı Init et (Veriyi çekip hafızaya alması için)
        this.worker.postMessage({
            action: 'INIT',
            payload: { sourceUrl: this.dataSource },
            jobId: Date.now()
        });
    }

    requestFilter() {
        this.worker.postMessage({
            action: 'FILTER',
            payload: {
                sourceUrl: this.dataSource,
                category: this.category,
                lang: 'tr'
            },
            jobId: Date.now()
        });
    }

    async renderCards(payload) {
        if (!payload || payload.length === 0) {
            this.container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.5); font-family: Inter;">Bu kriterlere uygun koleksiyon bulunamadı.</div>`;
            return;
        }

        this.container.innerHTML = ''; // Temizle
        
        // 🛡️ TBT 0ms ZIRHI: Task Chunking (8'li Paketler)
        const chunkSize = 8;
        
        // 💎 FAZ 3.1: Liste Sanallaştırması (List Virtualization) İçin Gözlemci (Observer)
        // Kartlar ekrandan çıkınca içlerini boşaltarak (veya gizleyerek) DOM yükünü minimize eder.
        if (!this.virtualObserver) {
            this.virtualObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.remove('is-virtualized');
                        // İçerik görünür olduğunda resmin yüklenmesini tetikleyebiliriz
                        const img = entry.target.querySelector('img');
                        if (img && img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                    } else {
                        // Ekrandan çok uzaklaşan kartların render maliyetini sıfırla
                        entry.target.classList.add('is-virtualized');
                    }
                });
            }, {
                root: null, // viewport
                rootMargin: '400px 0px', // Ekranın 400px altı/üstü tampon bölge (buffer)
                threshold: 0
            });
        }
        
        for (let i = 0; i < payload.length; i += chunkSize) {
            const chunk = payload.slice(i, i + chunkSize);
            const fragment = document.createDocumentFragment();

            chunk.forEach((item, chunkIndex) => {
                const globalIndex = i + chunkIndex;
                const card = document.createElement('a');
                card.href = item.url || item.detailUrl || '#';
                
                // Manyetik ve Reveal sınıfları enjekte edildi
                // FAZ 3.2: content-visibility çökmelerini engellemek için CSS sınıfına devrediyoruz
                card.className = 'bento-card-v6 santis-reveal santis-magnetic santis-drag santis-virtual-node';
                
                // Sinematik Dalga Efekti (Staggered Delay)
                card.style.transitionDelay = `${(globalIndex % 8) * 0.05}s`;

                if (globalIndex === 0 && (payload.length > 3)) {
                    card.classList.add('wide');
                }

                const title = item.content?.tr?.title || item.title || item.name || 'Santis Sovereign';
                const desc = item.content?.tr?.shortDesc || item.description || item.content?.tr?.tagline || '';
                const price = item.price_eur || (item.price && item.price.amount) || '';
                const imgTarget = item.image || item.img || (item.media && '/assets/img/cards/' + item.media.hero) || '/assets/img/cards/product-oil.webp';

                // FAZ 2.2: Lazy Loading ve Async Decoding standartları uygulandı
                // Resimler IntersectionObserver tarafından yüklenecek (data-src)
                card.innerHTML = `
                    <div class="magnetic-content" style="will-change: transform; height: 100%;">
                        <img class="bento-card-media" 
                             data-src="${imgTarget}" 
                             src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23111'/%3E%3C/svg%3E"
                             alt="${title}" 
                             loading="lazy" 
                             decoding="async" 
                             width="600" height="400">
                        <div class="bento-card-protector"></div>
                        <div class="bento-card-content">
                            <span class="bento-meta">${item.category === 'boutique' ? 'AL-GÖTÜR KONSEPT' : 'SANTIS RİTÜELİ'}</span>
                            <h3 class="bento-title">${title}</h3>
                            <p class="bento-desc">${desc}</p>
                        </div>
                        ${price ? `<div class="bento-price-tag">€${price}</div>` : ''}
                    </div>
                `;
                
                // DOM'a girdiği an Reveal tetikle
                setTimeout(() => card.classList.add('is-revealed'), 50);
                
                // Observer'a ekle
                this.virtualObserver.observe(card);
                
                fragment.appendChild(card);
            });

            this.container.appendChild(fragment);

            // Ana ipliğe nefes aldır (Inertial Scroll ve Kuantum İmleç donmaz)
            await yieldToMain();
        }

        console.log(`💎 [Omni-Orchestrator] ${payload.length} kart 0ms TBT ile (Chunking & Virtualization) aktarıldı.`);

        // Kinetik motorun hesaplamalarını güncelle
        setTimeout(() => {
            if (window.SovereignKineticEngine) {
                const wrapper = document.getElementById('sovereign-kinetic-wrapper');
                const footer = document.getElementById('footer-container');
                if (wrapper && footer && footer.parentNode !== wrapper) {
                    wrapper.appendChild(footer);
                }
                window.SovereignKineticEngine.updateHeight();
            }
        }, 100);
    }
}

// DOM yüklenince çalıştır
window.addEventListener('DOMContentLoaded', () => {
    window.SovereignBentoOrchestrator = new BentoOrchestrator();
});
