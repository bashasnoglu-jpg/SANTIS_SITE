import { SovereignForgeInjector } from './core/santis-forge-injector.js';


/**
 * SANTIS OS - SOVEREIGN RITUAL RENDERER V2 (Global Distribution Engine)
 * Kuantum Router Görevi: Hangi sayfada olduğumuzu (URL) anlar ve DataBridge'den
 * gelen devasa JSON okyanusunu (örn. window.NV_SKINCARE) parçalara bölerek
 * data-rail-engine Kuantum Raylarına doldurması için SovereignForgeInjector'a fırlatır.
 */
export class SovereignRitualRenderer {
    static ignite() {
        console.log("🦅 [Ritual Renderer] Sovereign Router Booting...");

        // 1. Kuantum Pusulası: Neredeyiz?
        const path = window.location.pathname.toLowerCase();

        if (path.includes('cilt-bakimi')) {
            this.routeSkincareMatrix();
        } else if (path.includes('masajlar')) {
            this.routeMassageMatrix();
        } else if (path.includes('hamam')) {
            this.routeHammamMatrix();
        } else if (path.includes('rituals') || path.includes('rituel')) {
            this.routeRitualsMatrix();
        } else {
            // Ana Sayfa
            this.routeIndexMatrix();
        }
    }

    /**
     * SADECE CİLT BAKIMI SAYFASI İÇİN YÖNLENDİRİCİ (PHASE 22)
     */
    static routeSkincareMatrix() {
        console.log("💉 [Ritual Renderer] Skincare Morph Routing Initiated.");

        // DataBridge bu veriyi daha önce API'den çekip Kuantum Hafızasına almış olmalı.
        const matrix = window.NV_SKINCARE;
        if (!matrix || matrix.length === 0) {
            console.error("🚨 [Sovereign Error] NV_SKINCARE matrix missing or empty from DataBridge!");
            return;
        }

        // Elimizdeki 64 birimlik Cilt Bakımı verisini, sayfamızdaki 3 farklı yatay raya bölüştürüyoruz.
        // Gerçek API verisinde category="sothys" gibi field'lar olabilir. 
        // Burada güçlü Sovereign estetiği için mantıksal dilimleme yapıyoruz.
        const sothysCollection = matrix.slice(0, Math.floor(matrix.length * 0.3)); // %30
        const antiAgeCollection = matrix.slice(Math.floor(matrix.length * 0.3), Math.floor(matrix.length * 0.7)); // %40
        const hydraCollection = matrix.slice(Math.floor(matrix.length * 0.7)); // %30

        // Kuantum Enjeksiyonunu Başlat (Phase 9 V5 Motoru ile)
        if (window.SovereignVirtualEngine) {
            window.SovereignVirtualEngine.create('section[data-rail-id="skincare_sothys"]', sothysCollection);
            window.SovereignVirtualEngine.create('section[data-rail-id="skincare_antiage"]', antiAgeCollection);
            window.SovereignVirtualEngine.create('section[data-rail-id="skincare_hydra"]', hydraCollection);
        } else {
            console.warn("⚠️ [Ritual Renderer] V5 Engine missing, falling back to V4 Forge.");
            SovereignForgeInjector.injectIntoRail(sothysCollection, 'skincare_sothys');
            SovereignForgeInjector.injectIntoRail(antiAgeCollection, 'skincare_antiage');
            SovereignForgeInjector.injectIntoRail(hydraCollection, 'skincare_hydra');
        }

        console.log("✅ [Ritual Renderer] 64 Skincare Cards successfully deployed across 3 Sovereign Rails.");
    }

    /** Masaj sayfası — tüm massage-* kategorileri render eder */
    static routeMassageMatrix() {
        console.log('💆 [Ritual Renderer] Massage Matrix Routing Initiated.');

        let massageData = window.NV_MASSAGE || [];
        if (massageData.length === 0 && window.SovereignDataMatrix) {
            massageData = window.SovereignDataMatrix.filter(item => {
                const cat = String(item.category || item.categoryId || '').trim().toLowerCase();
                return cat === 'massage' || cat.startsWith('massage-');
            });
            console.log(`🧩 [Ritual Renderer] SovereignDataMatrix'ten ${massageData.length} masaj kartı çekildi.`);
        }

        if (massageData.length === 0) {
            // SovereignDataMatrix henüz dolmadıysa — rail-ready bekle
            document.addEventListener('santis:rail-ready', (e) => {
                window.SovereignDataMatrix = e.detail;
                this.routeMassageMatrix();
            }, { once: true });
            console.warn('⏳ [Ritual Renderer] Masaj verisi bekleniyor...');
            return;
        }

        setTimeout(() => {
            const container = document.getElementById('santis-matrix-container');
            if (!container) { console.debug('💤 [Ritual Renderer] Bu sayfa Masaj cephesi değil.'); return; }

            if (window.SovereignVirtualEngine?.observer) window.SovereignVirtualEngine.observer.disconnect();

            container.style.cssText = 'display:flex;gap:1.5rem;overflow-x:auto;padding:1rem 0;scroll-snap-type:x mandatory;scrollbar-width:none;-ms-overflow-style:none;';
            container.innerHTML = '';

            massageData.forEach((item, i) => {
                const card = document.createElement('article');
                card.className = 'ritual-card';
                card.style.cssText = 'min-width:280px;scroll-snap-align:start;flex-shrink:0;';
                card.innerHTML = `
                    <img src="${item.image || '/assets/img/cards/santis_card_massage_lux.webp'}"
                         alt="${item.title || item.name}" loading="lazy" decoding="async"
                         width="280" height="350" style="width:100%;height:350px;object-fit:cover;border-radius:4px;">
                    <div style="padding:.75rem 0">
                        <h3 style="font-size:.9rem;color:#fff;margin-bottom:.25rem">${item.title || item.name}</h3>
                        <span style="color:#D4AF37;font-size:.8rem">${item.price_eur ? '€' + item.price_eur : 'VIP'}</span>
                    </div>`;
                setTimeout(() => container.appendChild(card), i * 30);
            });
            console.log(`✅ [Ritual Renderer] ${massageData.length} masaj kartı render edildi.`);
        }, 150);
    }

    static routeHammamMatrix() {
        console.log("🫧 [Ritual Renderer] Hammam Matrix Routing Initiated.");

        // NV_HAMMAM yoksa SovereignDataMatrix'ten hammam kategorisini filtrele
        let hammamData = window.NV_HAMMAM || [];
        if (hammamData.length === 0 && window.SovereignDataMatrix) {
            hammamData = window.SovereignDataMatrix.filter(item => {
                // trim() ile gizli boşlukları, toLowerCase() ile büyük/küçük harf sorunlarını yok et
                const cat = String(item.category || item.categoryId || '').trim().toLowerCase();
                return cat.includes('hammam') || cat.includes('hamam');
            });
            console.log(`🧩 [Ritual Renderer] NV_HAMMAM boş, SovereignDataMatrix'ten ${hammamData.length} hamam kartı çekildi.`);
        }

        if (hammamData.length === 0) {
            console.error("🚨 [Sovereign Error] Hamam verisi bulunamadı!");
            return;
        }

        // ⏱️ V7 engine bootMatrix'ten hemen SONRA kurulur ve container'ı temizler.
        // 150ms gecikmeyle V7 kurulumundan sonra biz render ederiz ve kazanırız.
        setTimeout(() => {
            const container = document.getElementById('santis-matrix-container');
            if (!container) {
                console.debug('💤 [Ritual Renderer] Bu sayfa Rituals cephesi değil. Motor uyku modunda.');
                return;
            }

            // V7 engine varsa durdur (IntersectionObserver, scroll vb. temizle)
            if (window.SovereignVirtualEngine && window.SovereignVirtualEngine.observer) {
                window.SovereignVirtualEngine.observer.disconnect();
            }

            container.style.cssText = 'display:flex;gap:1.5rem;overflow-x:auto;padding:1rem 0;scroll-snap-type:x mandatory;scrollbar-width:none;-ms-overflow-style:none;';
            container.innerHTML = '';

            hammamData.forEach(item => {
                const title = item.title || item.name || item.slug || 'Hamam Ritüeli';
                const img = item.image || '/assets/img/cards/santis_card_hammam_v1.webp';
                const price = item.price_eur ? `€${item.price_eur}` : (item.price || 'VIP');
                const url = item.url || item.slug ? `/tr/hamam/${item.slug}.html` : '#';
                const card = document.createElement('a');
                card.href = url;
                card.style.cssText = 'flex:0 0 300px;scroll-snap-align:start;position:relative;height:420px;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);display:block;text-decoration:none;cursor:pointer;';
                card.innerHTML = `
                    <img src="${img}" alt="${title}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;" loading="lazy">
                    <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.1) 60%);"></div>
                    <div style="position:absolute;bottom:0;left:0;right:0;padding:1.5rem;">
                        <p style="color:#D4AF37;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:0.25rem;">${(item.category || 'Hammam').toUpperCase()}</p>
                        <h3 style="color:white;font-family:serif;font-size:1.1rem;line-height:1.3;margin-bottom:0.5rem;">${title}</h3>
                        <span style="color:#D4AF37;font-size:0.85rem;font-weight:500;">${price}</span>
                    </div>
                `;
                container.appendChild(card);
            });
            console.log(`✅ [Ritual Renderer] ${hammamData.length} Hammam kartı #santis-matrix-container'a enjekte edildi.`);
        }, 150);
    }


    /**
     * RİTÜELLER SAYFASI YÖNLENDİRİCİSİ (Tüm Raylar: Signatures, Hammam, Therapies)
     */
    static routeRitualsMatrix() {
        console.log("👑 [Ritual Renderer] Rituals Matrix Routing Initiated.");

        // Sovereign Signatures aslında Wellness / Journeys olarak DataBridge'den giriyor
        const signaturesData = window.NV_JOURNEYS || [];
        const hammamData = window.NV_HAMMAM || [];
        const therapiesData = window.NV_MASSAGES || [];

        if (window.SovereignVirtualEngine) {
            if (signaturesData.length > 0) window.SovereignVirtualEngine.create('section[data-rail-id="rail-signatures"] .rituals-container', signaturesData);
            if (hammamData.length > 0) window.SovereignVirtualEngine.create('section[data-rail-id="rail-hammam"] .rituals-container', hammamData);
            if (therapiesData.length > 0) window.SovereignVirtualEngine.create('section[data-rail-id="rail-therapies"] .rituals-container', therapiesData);
        } else {
            if (signaturesData.length > 0) SovereignForgeInjector.injectIntoRail(signaturesData, 'rail-signatures');
            if (hammamData.length > 0) SovereignForgeInjector.injectIntoRail(hammamData, 'rail-hammam');
            if (therapiesData.length > 0) SovereignForgeInjector.injectIntoRail(therapiesData, 'rail-therapies');
        }

        console.log(`✅ [Ritual Renderer] Rituals Page: ${signaturesData.length} Signatures + ${hammamData.length} Hammam + ${therapiesData.length} Therapies cards injected.`);
    }

    /**
     * ANA SAYFA YÖNLENDİRİCİSİ
     * tr/index.html'deki 2 Sovereign Rayını Hammam ve Masaj verileriyle besler.
     */
    static routeIndexMatrix() {
        console.log("🏠 [Ritual Renderer] Ana Sayfa Sovereign Matrix Başlatılıyor...");

        // NV_HAMMAM / NV_MASSAGES neuro-sync'ten GEÇ gelir → SovereignDataMatrix'ten filtrele
        let hammamData = window.NV_HAMMAM || [];
        let massageData = window.NV_MASSAGES || [];

        if ((hammamData.length === 0 || massageData.length === 0) && window.SovereignDataMatrix) {
            const all = window.SovereignDataMatrix;
            if (hammamData.length === 0) {
                hammamData = all.filter(i => {
                    const c = String(i.category || i.categoryId || '').trim().toLowerCase();
                    return c.includes('hammam') || c.includes('hamam');
                });
            }
            if (massageData.length === 0) {
                massageData = all.filter(i => {
                    const c = String(i.category || i.categoryId || '').trim().toLowerCase();
                    return c.includes('massage') || c.includes('masaj');
                });
            }
            console.log(`🧩 [Renderer] SovereignDataMatrix'ten: ${hammamData.length} Hammam + ${massageData.length} Masaj`);
        }

        if (hammamData.length === 0 && massageData.length === 0) {
            console.warn("🚨 [Renderer] Ana sayfa için hiç veri bulunamadı!");
            return;
        }

        // V7 motoru ana sayfada kendi containerlarını zaten yönetiyor — ona bırak
        if (window.SovereignVirtualEngine) {
            if (hammamData.length > 0) window.SovereignVirtualEngine.create('section[data-rail-id="rail-hammam"] .rituals-container', hammamData.slice(0, 10));
            if (massageData.length > 0) window.SovereignVirtualEngine.create('section[data-rail-id="rail-therapies"] .rituals-container', massageData.slice(0, 10));
        } else {
            if (hammamData.length > 0) SovereignForgeInjector.injectIntoRail(hammamData.slice(0, 10), 'rail-hammam');
            if (massageData.length > 0) SovereignForgeInjector.injectIntoRail(massageData.slice(0, 10), 'rail-therapies');
        }

        console.log(`✅ [Ritual Renderer] Ana Sayfa: ${Math.min(hammamData.length, 10)} Hammam + ${Math.min(massageData.length, 10)} Masaj kartı enjekte edildi.`);
    }
}

// ---------------------------------------------------------
// AUTO-IGNITION: DataBridge veriyi indirdiği an Kuantum Tuvalini doldurur.
// 'santis:rail-ready' = DataBridge'in gerçekten fırlattığı olay adı
// ---------------------------------------------------------
function igniteRenderer() {
    SovereignRitualRenderer.ignite();
}

// Eğer DataBridge zaten çalışmışsa hemen ateşle
if (window.__SANTIS_RAIL_READY__) {
    igniteRenderer();
} else {
    // DataBridge henüz hazır değil, olayı bekle
    document.addEventListener('santis:rail-ready', igniteRenderer, { once: true });
    // Eski sistemler için fallback
    window.addEventListener('product-data:ready', igniteRenderer, { once: true });
}


