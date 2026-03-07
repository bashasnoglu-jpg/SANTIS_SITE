/**
 * 🌍 [SANTIS_OMEGA_ENGINE] Phase 68 + Ritual Renderer V1.0
 * Zero Paint Blocking, rIC Chunking, Dynamic Slug Routing, Global Checkout Trigger
 */

// --- 1. rIC Polyfill (Safari Koruması) ---
window.requestIdleCallback = window.requestIdleCallback || function (cb) {
    const start = Date.now();
    return setTimeout(() => {
        cb({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
        });
    }, 1);
};
window.cancelIdleCallback = window.cancelIdleCallback || function (id) {
    clearTimeout(id);
};

// --- 2. Global Sovereign Checkout Wrapper ---
window.triggerSovereignCheckout = function (cardId, event) {
    // Parent elementin onclick (yönlendirme) eventini durdur
    if (event) event.stopPropagation();

    const card = document.getElementById(cardId);
    if (!card) return console.warn('🚨 [Checkout] Kuantum Hedefi Bulunamadı:', cardId);

    const ritualId = card.dataset.slug || 'default-slug';
    console.log(`💎 [Vault] Mühürleme Başlatıldı: ${ritualId}`);

    // Modal UI'ı tetikle (rAF korumalı)
    if (window.CheckoutVault && typeof window.CheckoutVault.openAvailabilityMatrix === 'function') {
        window.CheckoutVault.openAvailabilityMatrix(ritualId);
    } else {
        console.warn('⚠️ [Checkout] CheckoutVault henüz yüklenmedi veya başlatılamadı.');
    }
};

// --- 3. Başlatıcılar ---
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('product-data:ready', renderRituals);
    if (window.NV_DATA_READY) renderRituals();
});

// --- 4. Asenkron Render Motoru (Ultra-Mega Router) ---
function renderRituals() {
    if (window.__ritualRendered) return;
    window.__ritualRendered = true;

    console.log("⚡ [Ritual Engine] Sovereign UI Render Başlıyor (ASYNC MODE)...");

    const path = window.location.pathname.toLowerCase();

    // 1. ANA SAYFA (index.html) - Karma Gösterim (Sadece ilk 10'lar)
    if (path === '/' || path.includes('/index.html') && !path.includes('/hamam/') && !path.includes('/masajlar/') && !path.includes('/cilt-bakimi/')) {
        const hammamContainer = document.querySelector('[data-rail-id="rail-hammam"] .rituals-container');
        if (hammamContainer && window.NV_HAMMAM?.length > 0) {
            hammamContainer.innerHTML = '';
            asyncRenderChunked(window.NV_HAMMAM.slice(0, 10), hammamContainer, 'hammam', false);
        }

        const therapyContainer = document.querySelector('[data-rail-id="rail-therapies"] .rituals-container');
        if (therapyContainer && window.NV_MASSAGES?.length > 0) {
            therapyContainer.innerHTML = '';
            asyncRenderChunked(window.NV_MASSAGES.slice(0, 10), therapyContainer, 'therapy', true);
        }
        return;
    }

    // 2. KATEGORİ SAYFALARI (Dinamik Enjeksiyon)
    // Sadece o kategorinin verisini hedef container'a basar. Tüm listeyi (slice olmadan) basabilir.
    const categoryContainer = document.querySelector('.rituals-container');
    if (!categoryContainer) return; // Rail Container yoksa işlemi sonlandır

    categoryContainer.innerHTML = '';

    if (path.includes('/hamam')) {
        console.log("🛁 [Ritual Router] Hamam sayfası tespit edildi.");
        if (window.NV_HAMMAM?.length > 0) asyncRenderChunked(window.NV_HAMMAM, categoryContainer, 'hammam', false);
    }
    else if (path.includes('/masajlar')) {
        console.log("💆 [Ritual Router] Masajlar sayfası tespit edildi.");
        if (window.NV_MASSAGES?.length > 0) asyncRenderChunked(window.NV_MASSAGES, categoryContainer, 'therapy', true);
    }
    else if (path.includes('/cilt-bakimi')) {
        console.log("✨ [Ritual Router] Cilt Bakımı sayfası tespit edildi.");
        if (window.NV_SKINCARE?.length > 0) asyncRenderChunked(window.NV_SKINCARE, categoryContainer, 'skincare', false);
    }
}

function asyncRenderChunked(rawItems, container, type, isTherapy = false) {
    let index = 0;
    const chunkSize = 3;
    const seenSlugs = new Set();

    // Veri Tekilleştirme (Deduplication)
    const items = rawItems.filter(item => {
        const slug = item.slug || `ritual-${item.id}`;
        if (seenSlugs.has(slug)) return false;
        seenSlugs.add(slug);
        return true;
    });

    function renderNextChunk(deadline) {
        const fragment = document.createDocumentFragment();
        let chunkProcessed = 0;

        while (index < items.length && chunkProcessed < chunkSize && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
            const svc = items[index];
            const lang = document.documentElement.lang || 'tr';

            const parseStr = (field) => typeof field === 'object' && field !== null ? (field[lang] || field.tr || field.en || field.de || '') : (field || '');
            const parseNum = (field) => typeof field === 'object' && field !== null ? (field.eur || field.EUR || field.try || field.TRY || 0) : (parseFloat(field) || 0);

            const svcName = parseStr(svc.name) || parseStr(svc.title) || (isTherapy ? 'Sovereign Massage' : 'Sovereign Hammam');
            const descTxt = parseStr(svc.description) || parseStr(svc.short_desc) || (isTherapy ? 'Kas sistemini restore eden dokunuşlar.' : 'Geleneksel arınma ritüeli.');

            let basePrice = parseNum(svc.price);
            const priceVal = basePrice > 0 ? basePrice : (isTherapy ? 110 : 90);
            const discountPrice = Math.floor(priceVal * 0.85);

            const card = document.createElement('div');
            card.className = "ritual-card group relative w-[85vw] sm:w-[380px] md:w-[420px] lg:w-[480px] shrink-0 h-[550px] md:h-[650px] rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing mr-8 select-none pointer-events-auto";
            card.id = `${type}-card-${index}`;
            card.dataset.slug = svc.slug || `ritual-${svc.id}`;
            card.dataset.price = priceVal; // Neuro-Tracker için fiyat datası
            card.style.backgroundColor = "#050505";
            card.style.willChange = "transform, opacity";

            // Kart Tıklaması: Sadece butona TIKLANMADIYSA detay sayfasına git
            card.onclick = (e) => {
                if (!e.target.closest('button')) {
                    window.location.href = `/service-detail.html?slug=${card.dataset.slug}`;
                }
            };

            const imgSrc = parseStr(svc.image) || parseStr(svc.hero_image) || (isTherapy ? "/assets/img/cards/massage.webp" : "/assets/img/cards/hammam.webp");
            const parsedDuration = parseStr(svc.duration);
            const durationTxt = parsedDuration ? parsedDuration + ' MIN' : (isTherapy ? 'SOVEREIGN MASSAGE' : 'SOVEREIGN RITUAL');

            card.innerHTML = `
                <div class="skeleton-layer absolute inset-0 bg-neutral-900 animate-pulse z-0 rounded-3xl"></div>
                <img data-cms-slot="${type}-img-${svc.id}" src="${imgSrc}" alt="${svcName}" loading="lazy" decoding="async" draggable="false" onload="this.classList.remove('opacity-0', 'scale-110'); this.previousElementSibling.classList.add('hidden');" class="absolute inset-0 w-full h-full object-cover opacity-0 scale-110 group-hover:opacity-40 group-hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
                <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10 pointer-events-none"></div>
                
                <div class="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col justify-end h-full z-20 pointer-events-none">
                    
                    <div class="transform group-hover:-translate-y-24 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-10 w-full">
                        <span class="inline-block px-3 py-1 bg-${isTherapy ? 'white/10' : '[#b5a489]/10'} border border-${isTherapy ? 'white/20' : '[#b5a489]/30'} text-${isTherapy ? 'white' : '[#b5a489]'} text-[9px] uppercase tracking-[4px] rounded-full mb-3 md:mb-4 pointer-events-auto">${durationTxt}</span>
                        <h2 class="font-serif text-3xl md:text-4xl text-white tracking-wide mb-2 pointer-events-auto">${svcName}</h2>
                        
                        <div class="relative h-auto min-h-[40px] mb-4">
                            <p class="font-sans text-xs md:text-sm text-gray-400 font-light transition-opacity duration-300 group-hover:opacity-0 absolute inset-0 pointer-events-auto">${descTxt}</p>
                        </div>
                        
                        <div class="flex items-center justify-between pointer-events-auto">
                            <div class="flex items-baseline gap-3">
                                <div class="text-3xl font-serif text-${isTherapy ? 'white' : '[#b5a489]'} h-[40px] overflow-hidden relative flex items-start">
                                    <div class="price-roller-track flex flex-col transition-transform duration-[800ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] popup-price-track transform translate-y-0 group-hover:-translate-y-1/2">
                                        <span class="h-[40px] flex items-center shrink-0 leading-none price">${priceVal}€</span>
                                        <span class="h-[40px] flex items-center shrink-0 leading-none text-${isTherapy ? 'white' : '[#b5a489]'} drop-shadow-[0_0_15px_rgba(${isTherapy ? '255,255,255' : '181,164,137'},0.6)]">${discountPrice}€</span>
                                    </div>
                                </div>
                                <span class="text-xs text-gray-500 line-through original-price transition-opacity duration-500 opacity-0 group-hover:opacity-100">${priceVal}€</span>
                            </div>
                        </div>
                    </div>

                    <div class="absolute inset-x-6 md:inset-x-8 bottom-6 md:bottom-8 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[600ms] ease-out z-30 delay-[100ms] pointer-events-none checkout-btn-wrapper">
                        <div class="flex flex-col border-t border-white/10 pt-4 md:pt-6">
                            <button class="w-full h-12 md:h-14 rounded-full bg-white text-black text-xs font-bold tracking-[2px] uppercase shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-[#D4AF37] transition-colors pointer-events-auto flex items-center justify-center cursor-pointer" onclick="window.triggerSovereignCheckout('${card.id}', event); document.getElementById('sticky-title_${svc.id}').innerText='${svcName.replace(/'/g, "\\'")}'; document.getElementById('sticky-price_${svc.id}').innerText='${priceVal}€';">
                                Ritüeli Mühürle
                            </button>
                        </div>
                    </div>

                </div>
                <!-- Gizli data alanları (triggerSovereignCheckout için scoped ID) -->
                <div id="sticky-title_${svc.id}" class="hidden">${svcName}</div>
                <div id="sticky-price_${svc.id}" class="hidden">${priceVal}€</div>
            `;
            fragment.appendChild(card);
            index++;
            chunkProcessed++;
        }

        requestAnimationFrame(() => {
            container.appendChild(fragment);

            if (index < items.length) {
                requestIdleCallback(renderNextChunk);
            } else {
                console.log("🏁 [Ritual Engine] Tüm kartlar render edildi.");
                if (typeof window.initSovereignRails === 'function') {
                    window.initSovereignRails(); // Phase 97 Race Condition Fix
                }
                if (typeof SovereignCardEngine !== 'undefined') SovereignCardEngine.init();
                if (typeof initSovereignLayout === 'function') initSovereignLayout();
                if (typeof initSovereignPrefetch === 'function') initSovereignPrefetch();
            }
        });
    }

    requestIdleCallback(renderNextChunk);
}
