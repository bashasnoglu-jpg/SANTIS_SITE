/**
 * SANTIS OS • SOVEREIGN RENDERER (INTERCONNECTED)
 */
export class SovereignRenderer {
    constructor(endpoint) {
        this.endpoint = endpoint;
        this.container = document.getElementById('santis-massage-matrix');
    }

    async ignite() {
        console.log("[Forge Injector] DataBridge 118 üzerinden Sovereign Matrix çekiliyor...");

        try {
            const response = await fetch(this.endpoint);
            const data = await response.json();

            // 1. Global State'i Güncelle (Sistem Masajları Tanısın)
            if (!window.Santis) window.Santis = {};
            if (!window.Santis.State) window.Santis.State = {};
            window.Santis.State.Massages = data.categories;

            // 2. DOM Enjeksiyonu
            this.renderMatrix(data.categories);

            // 3. Sistemler Arası El Sıkışma (Interconnectivity)
            this.handshake();
        } catch (error) {
            console.error("[Forge Injector] Matrix Data Fetched Failed:", error);
        }
    }

    renderMatrix(categories) {
        if (!this.container) return;
        this.container.innerHTML = ''; // Temiz bölge

        categories.forEach(category => {
            // Rail (Hat) İskeleti
            const section = document.createElement('section');
            section.className = 'rituals-section relative w-full pt-12 pb-24 overflow-hidden group/slider';
            section.setAttribute('data-rail-engine', 'true');
            section.setAttribute('data-rail-id', category.tier);

            const titleArr = category.title.split(' ');
            const titleFirst = titleArr[0];
            const titleRest = titleArr.slice(1).join(' ');

            const titleHTML = `
                <div class="px-6 md:px-[max(1.5rem,calc((100vw-1400px)/2))] mb-12 flex flex-col md:flex-row md:items-end justify-between z-20 relative">
                    <div class="mb-6 md:mb-0">
                        <span class="text-[#D4AF37] text-[10px] sm:text-xs uppercase tracking-[4px] font-bold">SOVEREIGN PROTOCOL</span>
                        <h2 class="text-3xl md:text-5xl text-white font-serif mt-2 italic">${titleFirst} <span class="not-italic text-gray-400">${titleRest}</span></h2>
                    </div>
                </div>
            `;

            // Kartları Üret
            const cardsHTML = category.services.map(service => {
                const signatureClass = service.is_signature ? 'is-santis-signature' : '';
                const armorLevel = service.is_signature ? '50' : '10';
                const signatureBadge = service.is_signature ? '<span class="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full z-30 shadow-[0_0_10px_rgba(212,175,55,0.2)]">Sovereign Ritual</span>' : '';

                return `
                    <a href="/service-detail.html?id=${service.id}" class="ritual-card ${signatureClass} group relative w-[85vw] md:w-[480px] shrink-0 snap-start h-[650px] rounded-3xl overflow-hidden cursor-pointer block disable-hover-decoration" style="display: block; box-sizing: border-box; background-color: #050505; z-index: ${armorLevel}; text-decoration: none;" data-id="${service.id}" data-aura="${service.aura}">
                        <div class="skeleton-layer absolute inset-0 bg-neutral-900 animate-pulse z-0 rounded-3xl"></div>
                        <img src="${service.image || '/assets/img/cards/massage.webp'}" alt="${service.title}" width="320" height="427" loading="lazy" decoding="async" onload="this.classList.remove('opacity-0', 'scale-110'); this.previousElementSibling.classList.add('hidden');" class="absolute inset-0 w-full h-full object-cover opacity-0 scale-110 group-hover:opacity-30 group-hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-10" />
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
                        
                        <div class="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end h-full z-20">
                            <div class="transform group-hover:-translate-y-56 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-10 w-full">
                                <span class="inline-block px-3 py-1 ${service.is_signature ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]' : 'bg-white/5 border border-white/10 text-gray-300'} text-[9px] uppercase tracking-[4px] rounded-full mb-4">
                                    ${service.is_signature ? 'SOVEREIGN APEX' : 'RECOVERY LAB'}
                                </span>
                                <h2 class="font-serif text-3xl md:text-4xl ${service.is_signature ? 'text-white' : 'text-[#b5a489]'} tracking-wide mb-2 italic">
                                    ${service.title.split(' ')[0]} <span class="not-italic ${service.is_signature ? 'text-[#D4AF37]' : 'text-white'}">${service.title.split(' ').slice(1).join(' ')}</span>
                                </h2>
                                <p class="font-sans text-sm text-gray-400 font-light mb-4 transition-opacity duration-300 group-hover:opacity-0">${service.duration} | €${service.price_eur}</p>
                            </div>
                            
                            <div class="absolute inset-x-8 bottom-8 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[600ms] ease-out z-20 delay-[200ms] pointer-events-none checkout-btn-wrapper">
                                <div class="flex flex-col gap-3 md:gap-4 border-t border-white/10 pt-6 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent">
                                    <button onclick="event.preventDefault(); window.CheckoutVault?.open();" class="santis-intent-btn mt-4 w-full py-4 rounded-full bg-white text-black text-xs font-bold tracking-[2px] uppercase shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-[#D4AF37] transition-colors pointer-events-auto" data-base-price="${service.price_eur}" data-floor-price="${service.fomo_limit}" style="pointer-events: auto !important; z-index: 10001 !important; cursor: pointer !important;">
                                        Ritüeli Mühürle
                                    </button>
                                </div>
                            </div>
                        </div>
                    </a>
                `;
            }).join('');

            section.innerHTML = `
                ${titleHTML}
                <div class="santis-rail-container rituals-container rail-track scrollbar-hide flex overflow-x-auto flex-nowrap w-full pb-16 pt-4 px-6 md:px-[max(1.5rem,calc((100vw-1400px)/2))] gap-8 cursor-grab active:cursor-grabbing relative z-20" data-lenis-prevent="true" style="scroll-padding-left: max(1.5rem, calc((100vw - 1400px) / 2)); scrollbar-width: none; touch-action: pan-x pan-y pinch-zoom;">
                    ${cardsHTML}
                </div>
                <div class="px-6 md:px-[max(1.5rem,calc((100vw-1400px)/2))] mt-6 mb-8 flex items-center justify-center relative z-20 w-full">
                    <div class="flex items-center gap-6 slider-controls" style="z-index: 50 !important;">
                        <button class="slider-prev w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-[#D4AF37] hover:text-black transition-all" style="z-index: 51 !important; pointer-events: auto !important;">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <div class="rail-dots flex items-center gap-3"></div>
                        <button class="slider-next w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-[#D4AF37] hover:text-black transition-all" style="z-index: 51 !important; pointer-events: auto !important;">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    </div>
                </div>
            `;

            this.container.appendChild(section);
        });
    }

    handshake() {
        console.log("[Forge Injector] Handshake başlatılıyor: Kineti-Core, Sentinel, Vault ve Forge.");
        // Sentinel'e Yeni Rayları Bildir (Performans İzleme Başlasın)
        if (window.Santis && window.Santis.Sentinel) {
            window.Santis.Sentinel.registerNewRails('.santis-rail-container');
        }

        // CheckoutVault'u Yeni Butonlara Kilitlet
        if (window.Santis && window.Santis.CheckoutVault) {
            window.Santis.CheckoutVault.bindMatrix('.santis-intent-btn');
        }

        // Ghost Forge'u Ateşle (Shader'lar Başlasın)
        if (window.Santis && window.Santis.Forge) {
            window.Santis.Forge.igniteVisibleCards();
        }

        // Arm Kineti-Core natively since we didn't decouple it yet (we will fire SantisRail globally)
        if (typeof window.initOmniScroll === "function") {
            window.initOmniScroll();
        } else {
            // Trigger the standard event that SantisRail Engine listens to
            document.dispatchEvent(new Event('santis:cards-rendered'));
            console.log("[Forge Injector] SantisRail initialization triggered via santis:cards-rendered event.");
        }
    }
}
