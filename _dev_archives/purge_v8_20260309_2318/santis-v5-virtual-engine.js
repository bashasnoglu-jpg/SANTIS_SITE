console.log("%c🚀 [V10.3 ENGINE] NÜKLEER ZIRH DEVREDE! (Eğer bunu görüyorsan eski cache silinmiştir)", "color: #00ff00; font-size: 16px; font-weight: bold; background: #000; padding: 10px;");
/**
 * ========================================================================
 * SOVEREIGN OS v10.2 - LAYER 8: PURE DOM FACTORY (VIRTUAL ENGINE)
 * ========================================================================
 * Architecture: God-Tier Inline Armor, Mouse Wheel Hijacker, Lenis Bypass
 */

class SovereignVirtualEngine {
    constructor() {
        this.poolSize = window.innerWidth > 1024 ? 18 : 12;
        this.physicalNodes = new Map();
        this.handleGlobalClick = this.handleGlobalClick.bind(this);
    }

    groupByCategory(pureData) {
        return pureData.reduce((acc, item) => {
            if (item.type !== 'service') return acc;
            const key = item.category || 'Sovereign Ritüelleri';
            (acc[key] = acc[key] || []).push(item);
            return acc;
        }, {});
    }

    injectTitleHTML(titleElement, text) {
        if (!text || String(text) === 'undefined' || String(text) === 'null') text = 'Sovereign Ritüel';
        const words = String(text).split(' ');
        const first = words.shift();
        titleElement.innerHTML = '';
        const em = document.createElement('em');
        em.className = 'italic font-light pr-1 text-white/90';
        em.textContent = first;
        titleElement.appendChild(em);
        if (words.length > 0) titleElement.appendChild(document.createTextNode(' ' + words.join(' ')));
    }

    // 🛡️ 1. TANRI MODU (GOD-MODE) KART FABRİKASI: Boyutlar ASLA ezilemez!
    buildPureDOMCard(item) {
        const card = document.createElement("a");
        card.className = `nv-rail-card ritual-card ${item.aura} group snap-center`;
        card.href = item.url || "javascript:void(0)";
        card.dataset.id = item.id;

        // 💎 SİHİR 1: CSS Dosyalarını Bypass Et (Satır içi 320px Mührü)
        card.style.cssText = "flex: 0 0 320px !important; width: 320px !important; min-width: 320px !important; max-width: 320px !important; height: 400px !important; border-radius: 12px !important; position: relative !important; display: block !important; overflow: hidden !important; background-color: #080808 !important; transform: translateZ(0) !important; cursor: pointer !important; text-decoration: none !important;";

        const img = document.createElement("img");
        img.className = "transition-transform duration-[1.5s] ease-out group-hover:scale-105";
        img.src = item.image;
        img.alt = item.title;
        img.loading = "lazy";
        // Görseli arka plana çivile (z-10)
        img.style.cssText = "position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; z-index: 10 !important; margin: 0 !important; padding: 0 !important;";

        const overlay = document.createElement("div");
        overlay.className = "transition-opacity duration-500 opacity-80 group-hover:opacity-100 pointer-events-none";
        // Lüks Siyah Karartmayı ortaya çivile (z-15) - Sisi azalttık (0-60% arası)
        overlay.style.cssText = "position: absolute !important; inset: 0 !important; z-index: 15 !important; background: linear-gradient(to top, rgba(4,4,4,0.95) 0%, rgba(4,4,4,0.6) 30%, transparent 60%) !important;";

        const content = document.createElement("div");
        content.className = "pointer-events-none";
        // Yazıları En Üste çivile (z-20) ve aşağı it
        content.style.cssText = "position: absolute !important; inset: 0 !important; z-index: 20 !important; display: flex !important; flex-direction: column !important; justify-content: flex-end !important; padding: 1.5rem !important;";

        const badge = document.createElement("span");
        badge.className = "text-[0.65rem] tracking-[0.2em] mb-3 text-[#D4AF37] font-mono uppercase opacity-90";
        badge.style.cssText = "position: relative !important; z-index: 21 !important;";
        badge.textContent = item.badge;

        const title = document.createElement("h2");
        title.className = "text-2xl text-white font-serif mb-2 leading-tight";
        title.style.cssText = "position: relative !important; z-index: 21 !important;";
        this.injectTitleHTML(title, item.title);

        const meta = document.createElement("div");
        meta.className = "flex items-center space-x-2 text-xs text-white/60 tracking-wider font-mono mb-4";
        meta.style.cssText = "position: relative !important; z-index: 21 !important;";

        const durationSpan = document.createElement("span");
        durationSpan.textContent = item.duration;

        const divider = document.createElement("span");
        divider.className = `text-[10px] text-${item.aura}/50`;
        divider.textContent = "|";

        const priceSpan = document.createElement("span");
        priceSpan.className = "price-roller font-medium";
        priceSpan.textContent = `€${item.price_eur}`;

        meta.append(durationSpan, divider, priceSpan);

        const btnWrapper = document.createElement("div");
        btnWrapper.className = "opacity-0 translate-y-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-hover:translate-y-0";
        btnWrapper.style.cssText = "position: absolute !important; bottom: 1.5rem !important; left: 1.5rem !important; right: 1.5rem !important; z-index: 40 !important; pointer-events: auto !important;";

        const btn = document.createElement("button");
        btn.className = "w-full py-3 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold tracking-widest uppercase transition-colors hover:bg-[#D4AF37] hover:text-black backdrop-blur-sm cursor-pointer";
        btn.textContent = "RİTÜELİ MÜHÜRLE";
        btnWrapper.appendChild(btn);

        content.append(badge, title, meta, btnWrapper);
        card.append(img, overlay, content);

        card.__santisBinds = { img, badge, title, duration: durationSpan, price: priceSpan };

        return card;
    }

    // 🛡️ 2. RAY ORKESTRATÖRÜ: LENIS KİLİDİ VE YATAY KAYDIRMA SİHRİ
    renderMatrix(containerId, pureData) {
        const container = document.querySelector(containerId);
        if (!container) return;

        const groupedData = this.groupByCategory(pureData);

        // 💎 SİHİR 4: KUANTUM YÜKSEKLİK KİLİDİ (Sıfır CLS)
        // Her kategori rayı yaklaşık 550px yer kaplar. Sayfa kaymasını önlemek için alanı rezerve et.
        const categoryCount = Object.keys(groupedData).length;
        const reservedHeight = categoryCount > 0 ? (categoryCount * 550) : 500;

        container.className = 'w-full relative z-20';
        container.style.minHeight = `${reservedHeight}px`;
        container.innerHTML = '';
        this.physicalNodes.clear();

        container.removeEventListener('click', this.handleGlobalClick);
        container.addEventListener('click', this.handleGlobalClick);

        const fragment = document.createDocumentFragment();

        const LUXURY_DICTIONARY = {
            "journey": "Sovereign Immersive Journeys",
            "ritual hammam": "Geleneksel Hamam Ritüelleri",
            "massage": "Sovereign İmza Masajlar",
            "massage relaxation": "Klasik Rahatlama Terapileri",
            "massage premium": "Premium & Signature Serisi",
            "massage asian": "Uzakdoğu & Asya Ritüelleri",
            "massage sports": "Derin Doku & Spor Terapileri",
            "massage medical": "Medikal & Terapötik Dokunuşlar",
            "massage regional": "Bölgesel Odaklı Terapiler",
            "massage couples": "Çiftlere Özel Ritüeller",
            "massage kids": "Çocuk & Aile Masajları",
            "sothys antiage": "Sothys Anti-Aging Koleksiyonu",
            "sothys hydra": "Sothys Nem & Işıltı Bakımları",
            "sothys purifying": "Sothys Detoks & Arınma Bakımları",
            "sothys men": "Sothys Homme (Erkek Bakımı)",
            "skincare antiage": "Premium Anti-Aging Ritüelleri",
            "skincare hydra": "Derin Nem Terapileri",
            "skincare purify": "Derinlemesine Arınma Bakımları",
            "skincare basic": "Klasik Cilt Bakımı"
        };

        Object.entries(groupedData).forEach(([categoryName, services]) => {
            if (!categoryName || categoryName === 'undefined') return;

            const section = document.createElement('section');
            section.className = 'santis-rail-section';
            section.style.cssText = "margin-bottom: clamp(4rem, 8vw, 8rem) !important; width: 100% !important; display: block !important;";

            const header = document.createElement('div');
            header.className = 'santis-rail-header';
            header.style.cssText = "display: flex !important; align-items: center !important; gap: 1.5rem !important; padding: 0 max(1.5rem, calc((100vw - 1400px) / 2)) !important; margin-bottom: 2rem !important;";

            const rawKey = String(categoryName).toLowerCase().trim();
            let displayTitle = LUXURY_DICTIONARY[rawKey] || LUXURY_DICTIONARY[rawKey.replace(/-/g, ' ')] || categoryName;

            if (displayTitle === categoryName) {
                displayTitle = displayTitle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }

            header.innerHTML = `
                <h2 class="text-3xl md:text-4xl font-serif text-white tracking-wide">${displayTitle}</h2>
                <div style="height: 1px; flex-grow: 1; background: linear-gradient(to right, rgba(212,175,55,0.3), transparent);"></div>
            `;

            const track = document.createElement('div');
            track.className = 'santis-rail-track';
            track.dataset.category = categoryName;

            // 💎 SİHİR 2: LENIS BYPASS (Lenis'e "Buraya Dokunma" emri verir)
            track.setAttribute('data-lenis-prevent', 'true');

            // RAY İÇİN SATIR İÇİ ZIRH: Yatay dizilimi ve kaydırma çubuğunu zorunlu kılar!
            track.style.cssText = "display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; gap: 1.5rem !important; overflow-x: auto !important; overflow-y: hidden !important; scroll-snap-type: x mandatory !important; padding: 2.5rem max(env(safe-area-inset-left, 1.5rem), calc((100vw - 1400px) / 2)) !important; margin: -2.5rem 0 !important; width: 100% !important; scrollbar-width: none !important; -webkit-overflow-scrolling: touch !important; pointer-events: auto !important;";

            // 💎 SİHİR 3: LENIS SUİKASTÇİSİ (MOUSE WHEEL HIJACKER V3)
            track.style.overscrollBehaviorX = 'contain'; // Trackpad ile sayfanın geri gitmesini önler

            track.addEventListener('wheel', (e) => {
                const isVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);

                if (isVertical) {
                    // Sayfa sonuna gelip gelmediğimizi hesapla (Math.ceil ile hassasiyet sorunu çözüldü)
                    const atLeftEnd = track.scrollLeft <= 0 && e.deltaY < 0;
                    const atRightEnd = Math.ceil(track.scrollLeft + track.clientWidth) >= track.scrollWidth && e.deltaY > 0;

                    if (!atLeftEnd && !atRightEnd) {
                        e.preventDefault(); // Varsayılan dikey kaydırmayı durdur
                        e.stopPropagation(); // 🛡️ NÜKLEER KALKAN: Olayın Lenis'e ulaşmasını ENGELLER!
                        e.stopImmediatePropagation(); // Diğer tüm scriptleri susturur

                        // Farenin gücünü yatay kaydırmaya aktar (Hızı artırdık: x2.0)
                        track.scrollLeft += e.deltaY * 2.0;
                    }
                }
            }, { passive: false, capture: true }); // 🛡️ CAPTURE TRUE: Hareketi Lenis'ten ÖNCE biz yakalarız!

            // 💎 SİHİR 3.5: FAREYLE SÜRÜKLE (MOUSE DRAG) MANTIĞI
            let isDown = false;
            let startX;
            let scrollLeft;

            track.addEventListener('mousedown', (e) => {
                isDown = true;
                startX = e.pageX - track.offsetLeft;
                scrollLeft = track.scrollLeft;
                // Kaydırırken takılmayı önlemek için snap özelliğini kapat
                track.style.scrollSnapType = 'none';
                track.style.cursor = 'grabbing';
            });

            const resetDragParams = () => {
                isDown = false;
                track.style.scrollSnapType = 'x mandatory';
                track.style.cursor = 'default';
            };

            track.addEventListener('mouseleave', resetDragParams);
            track.addEventListener('mouseup', resetDragParams);

            track.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - track.offsetLeft;
                const walk = (x - startX) * 1.5; // Momentum Çarpanı
                track.scrollLeft = scrollLeft - walk;
            });

            services.forEach(item => {
                const card = this.buildPureDOMCard(item);
                track.appendChild(card);
                this.physicalNodes.set(item.id, card);
            });

            section.append(header, track);
            fragment.appendChild(section);
        });

        container.appendChild(fragment);

        if (window.initGhostBuffer) window.initGhostBuffer(container);
    }

    handleGlobalClick(e) {
        const btn = e.target.closest('button');
        const card = e.target.closest('.nv-rail-card');
        if (!card) return;
        if (btn) {
            e.preventDefault();
            console.log(`🛒 [V10 Engine] Checkout Yönlendiriliyor: ${card.dataset.id}`);
            const title = card.__santisBinds?.title?.textContent || 'Sovereign Ritüel';
            const priceText = card.__santisBinds?.price?.textContent || '0';
            const priceEur = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || 0;
            if (window.CheckoutVault) {
                window.CheckoutVault.openAvailabilityMatrix(card.dataset.id, title, priceEur);
            }
        }
    }

    onStoreMutation(action, payload) {
        if (!payload || !payload.id) return;
        const activeCard = this.physicalNodes.get(payload.id);

        if (action === 'UPDATE' && activeCard && activeCard.__santisBinds) {
            const binds = activeCard.__santisBinds;
            binds.price.textContent = `€${payload.price_eur}`;
            binds.duration.textContent = payload.duration;
            binds.badge.textContent = payload.badge;
            if (binds.img.src !== payload.image) binds.img.src = payload.image;
            this.injectTitleHTML(binds.title, payload.title);
        }
        else if (action === 'PATCH_PRICE' && activeCard && activeCard.__santisBinds) {
            const binds = activeCard.__santisBinds;
            // 💎 DEV MÜHENDİSLİK: 0 CLS, Sadece textContent değişimi
            binds.price.textContent = `€${payload.price_eur}`;

            // Görsel Geri Bildirim: Hafif altın rengi flaş (Quiet Luxury effect)
            binds.price.style.transition = 'color 0.4s ease, text-shadow 0.4s ease';
            binds.price.style.color = '#fffbe6';
            binds.price.style.textShadow = '0 0 10px rgba(212, 175, 55, 0.5)';
            setTimeout(() => {
                binds.price.style.color = '';
                binds.price.style.textShadow = '';
            }, 800);
        }
        else if (action === 'DELETE' && activeCard) {
            activeCard.classList.add('santis-card-deleted');
            setTimeout(() => {
                activeCard.remove();
                this.physicalNodes.delete(payload.id);
            }, 400);
        }
        else if (action === 'ADD') {
            const track = document.querySelector(`.santis-rail-track[data-category="${payload.category}"]`);
            if (track) {
                const newCard = this.buildPureDOMCard(payload);
                newCard.classList.add('santis-card-enter');
                track.appendChild(newCard);
                this.physicalNodes.set(payload.id, newCard);
            }
        }
    }
}

// Global'e çıkart
window.SovereignVirtualEngine = new SovereignVirtualEngine();

// 🔄 GERİYE DÖNÜK UYUMLULUK ALIASI
// Eski kodlar .create() çağırıyorsa renderMatrix'e yönlendir
window.SovereignVirtualEngine.create = function (containerId, data) {
    return this.renderMatrix(containerId, data);
};
