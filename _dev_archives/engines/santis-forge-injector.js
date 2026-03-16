import { SovereignDataSanitizer } from './santis-data-sanitizer.js';

/**
 * SANTIS OS - DIFFERENTIAL RENDER ENGINE V6
 * O(1) hızında Virtual Sack (Hayalet Çuval) ile Gerçek DOM'u karşılaştıran
 * ve efsanevi Bail-Out tekniğiyle VRAM katliamını önleyen Cerrah Modülü.
 */
export class SantisDiffEngine {
    static patch(container, virtualSack) {
        // 1. Kuantum Haritası (O(1) Map)
        const liveCardsMap = new Map();

        // Sadece zırhlı Sovereign kartlarını fihristle
        for (const liveCard of container.children) {
            if (liveCard.classList.contains('nv-rail-card')) {
                const key = liveCard.getAttribute('data-key');
                if (key) liveCardsMap.set(key, liveCard);
            }
        }

        // 2. Cerrahın Yeni Listeyi Taraması & Sıralaması (The Match, Bail-Out & Re-order)
        // virtualSack.children canlı bir koleksiyondur, sabit bir diziye çevirerek güvenle dönüyoruz
        const newVirtualCards = Array.from(virtualSack.children);

        for (const newVirtualCard of newVirtualCards) {
            const newKey = newVirtualCard.getAttribute('data-key');
            if (!newKey) continue;

            const oldLiveCard = liveCardsMap.get(newKey);

            if (!oldLiveCard) {
                // Kuantum Yaratılış: Haritada yoksa yepyeni bir karttır (Append)
                container.appendChild(newVirtualCard.cloneNode(true));
            } else {
                // Mühür Kıyaslaması (O(1) Hash Check)
                const oldHash = oldLiveCard.getAttribute('data-hash');
                const newHash = newVirtualCard.getAttribute('data-hash');

                if (oldHash !== newHash) {
                    // Mühür kırılmış! Görseli bozmadan içeriği ve aurayı güncelle (O(1) Patch)
                    oldLiveCard.innerHTML = newVirtualCard.innerHTML;
                    oldLiveCard.setAttribute('data-hash', newHash);
                    oldLiveCard.style.cssText = newVirtualCard.style.cssText;
                }

                // Kuantum Yer Değiştirmesi: DOM'u sarsmadan sıralamayı vizyona uydur ♟️
                // Element zaten DOM'da olduğu için appendChild onu silip yeniden yaratmaz, sadece en sona taşır.
                container.appendChild(oldLiveCard);

                // İşlemi başarıyla tamamlanan kartı 'Ölüm Listesi'nden (Map) kurtar
                liveCardsMap.delete(newKey);
            }
        }

        // 3. Kuantum İmhası (Purge) 🧹
        // Sırf Map'in içinde kaldılar diye, artık JSON Matrix'te varlıkları kalmamış "Hayalet" kartları DOM'dan sil
        liveCardsMap.forEach((ghostCard) => {
            ghostCard.remove();
        });
    }
}

/**
 * SANTIS OS - SOVEREIGN CARD FACTORY V6
 * Template Literal kullanılarak tek seferde HTML String'i oluşturan,
 * ve Kuantum Cerrahını besleyen Saf Fabrika.
 */
export class SovereignForgeInjector {
    static injectIntoRail(rawDataMatrix, railId) {
        if (!rawDataMatrix || !Array.isArray(rawDataMatrix)) {
            console.warn(`[Forge Injector] Invalid Data Matrix for rail: ${railId}`);
            return;
        }

        const railSection = document.querySelector(`section[data-rail-engine="true"][data-rail-id="${railId}"]`);
        if (!railSection) {
            console.warn(`[Forge Injector] Target Rail Not Found: ${railId}. Kuantum Mimarisi Eksik!`);
            return;
        }
        // Ana Sayfa Desteği: iç .rituals-container varsa onu, yoksa section'ın kendisini kullan
        const railEngine = railSection.querySelector('.rituals-container') || railSection;

        // 1. Zırhlandırma (Veri Arındırma & Hash Basma)
        const safeRituals = rawDataMatrix.map(raw => SovereignDataSanitizer.sanitizeRitual(raw));

        // 2. TEKİL METİN MATRİSİ (String Matrix - Saf Hız)
        const allCardsHTML = safeRituals.map(ritualDTO => this.forgeCardHTML(ritualDTO)).join('');

        // 3. HAYALET ÇUVAL (Virtual Sack)
        const virtualSack = document.createElement('div');
        virtualSack.innerHTML = allCardsHTML; // Temsili Parse 

        // --- QUANTUM MEDIA ARMOR (Zero-CLS) ---
        virtualSack.querySelectorAll('img').forEach(img => {
            img.setAttribute('width', '320');
            img.setAttribute('height', '427'); // Sovereign Aspect Ratio
            img.setAttribute('loading', 'lazy');
            img.setAttribute('decoding', 'async');
            if (img.src && !img.src.includes('.webp')) {
                console.warn(`⚠️ [Media Armor] Standardışı format tespit edildi: ${img.src}. WebP dönüşümü önerilir.`);
            }
        });

        // 4. CERRAHİ YAMALAMA (The Diff Patch)
        SantisDiffEngine.patch(railEngine, virtualSack);

        // Kuantum Zırhı: Eski önbelleğe (Cache) veya Tailwind'e yenik düşmemek için 
        // Lüks Boşlukları (Negative Space) doğrudan DOM'a inline mühürlüyoruz!
        // NOT: .rituals-container (ana sayfa) için sadece display/gap uygula; overflowX'e dokunma
        const isInnerContainer = railEngine !== railSection;
        railEngine.style.display = 'flex';
        railEngine.style.alignItems = 'center'; // Kuantum Cerrahı Şifası: Kartları dikey ezilmekten kurtar (Stretch baskısını kır!)
        // Her iki ray stili için de Kuantum Boşluğu zorunludur! (Lüks Nefes Payı)
        railEngine.style.gap = 'clamp(24px, 3vw, 48px)';

        if (!isInnerContainer) {
            // Doğrudan Ray: section'un kendisi (cilt-bakımı stili)
            railEngine.style.paddingInline = '5vw';
        }
        // overflowX'e dokunma — tailwind/css kontrol etsin

        console.log(`🦅 [Sovereign Cerrah] ${rawDataMatrix.length} kart '${railId}' rayına O(1) Diff Algorithm ile yamalandı.`);

        // 5. EVENT-DRIVEN ENTERPRISE (Module Isolation)
        document.dispatchEvent(new CustomEvent("santis:cards-rendered", {
            detail: { module: railId, count: rawDataMatrix.length }
        }));
    }

    static forgeCardHTML(ritualDTO) {
        // Template Literal ile Sessiz Lüks Mimarisi (Sovereign V6)
        const signatureClass = ritualDTO.is_signature ? 'is-santis-signature' : '';
        const armorLevel = ritualDTO.is_signature ? '50' : '10';
        const signatureBadge = ritualDTO.is_signature ? '<span class="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full z-30 shadow-[0_0_10px_rgba(212,175,55,0.2)]">Sovereign Ritual</span>' : '';

        // title first word logic exactly like the index page renderer
        const titleArr = ritualDTO.title ? ritualDTO.title.split(' ') : [''];
        const titleFirst = titleArr[0];
        const titleRest = titleArr.slice(1).join(' ');

        return `
        <div class="nv-rail-card ritual-card ${signatureClass} group relative w-[85vw] md:w-[480px] shrink-0 h-[650px] rounded-3xl overflow-hidden cursor-pointer block disable-hover-decoration" data-key="${ritualDTO.id}" data-hash="${ritualDTO.hash}" style="--card-aura: ${ritualDTO.aura_color}; display: block; box-sizing: border-box; background-color: #050505; z-index: ${armorLevel}; text-decoration: none;">
            ${signatureBadge}
            <div class="skeleton-layer absolute inset-0 bg-neutral-900 animate-pulse z-0 rounded-3xl"></div>
            <img src="${ritualDTO.image_url || '/assets/img/cards/massage.webp'}" alt="${ritualDTO.alt_text || 'Santis Ritual'}" width="320" height="427" loading="lazy" decoding="async" fetchpriority="low" onload="this.classList.remove('opacity-0', 'scale-110'); this.previousElementSibling.classList.add('hidden');" class="nv-rail-card-bg absolute inset-0 w-full h-full object-cover opacity-0 scale-110 group-hover:opacity-30 group-hover:scale-105 transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-10">
            
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
            
            <!-- İçerik Kalkanı -->
            <div class="nv-rail-card-content absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end h-full z-20">
                <div class="transform group-hover:-translate-y-56 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] z-10 w-full">
                    <span class="inline-block px-3 py-1 ${ritualDTO.is_signature ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]' : 'bg-white/5 border border-white/10 text-gray-300'} text-[9px] uppercase tracking-[4px] rounded-full mb-4">
                        ${ritualDTO.is_signature ? 'SOVEREIGN APEX' : 'RECOVERY LAB'}
                    </span>
                    <h2 class="nv-rail-card-title font-serif text-3xl md:text-4xl ${ritualDTO.is_signature ? 'text-white' : 'text-[#b5a489]'} tracking-wide mb-2 italic">
                        ${titleFirst} <span class="not-italic ${ritualDTO.is_signature ? 'text-[#D4AF37]' : 'text-white'}">${titleRest}</span>
                    </h2>
                    <p class="nv-rail-card-meta font-sans text-sm text-gray-400 font-light mb-4 transition-opacity duration-300 group-hover:opacity-0">
                        <span class="nv-meta-time">${ritualDTO.duration}</span> | <span class="nv-meta-price">${ritualDTO.price}</span>
                    </p>
                </div>
                
                <div class="absolute inset-x-8 bottom-8 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[600ms] ease-out z-20 delay-[200ms] pointer-events-none checkout-btn-wrapper">
                    <div class="flex flex-col gap-3 md:gap-4 border-t border-white/10 pt-6 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent">
                        <button onclick="event.preventDefault(); window.CheckoutVault?.open();" class="santis-intent-btn mt-4 w-full py-4 rounded-full bg-white text-black text-xs font-bold tracking-[2px] uppercase shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-[#D4AF37] transition-colors pointer-events-auto" data-sovereign-intent="true" style="pointer-events: auto !important; z-index: 10001 !important; cursor: pointer !important;">
                            Ritüeli Mühürle
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
}
