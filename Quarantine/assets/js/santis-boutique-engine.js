/**
 * 🟡 CEPHE 2: SOVEREIGN BOUTIQUE CORE (O-1 ENGINE V5.0)
 * Data Purifier | Intersection Observer | JIT DOM Injection | Anti-Thrash GC Bypass
 */

const SovereignBoutiqueCore = {
    init(data) {
        this.container = document.getElementById('santis-boutique-grid');
        if (!this.container) return;

        // 🛡️ THE DATA PURIFIER — Front-End veri kirliliğini yok et + deduplicate
        const seen = new Map();
        (Array.isArray(data) ? data : []).forEach(item => {
            const safeId = (item.id || item.slug || '').trim() || `unknown-${Math.random().toString(36).substr(2, 9)}`;
            const rawCat = (item.category || item.categoryId || 'Sovereign Özel Koleksiyon').toString().trim();
            const cleanCat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();
            seen.set(safeId, {
                ...item,
                id: safeId,
                category: cleanCat,
                title: item.title || (item.content?.tr?.title) || item.name || item.slug || 'Gizli Sovereign Formülü',
                price_eur: parseFloat(item.price_eur || item.price?.amount || item.price || 0),
                image: item.image || (item.media?.hero ? `/assets/img/cards/${item.media.hero}` : null) || '/assets/img/cards/santis_card_massage_lux.webp'
            });
        });
        this.products = [...seen.values()];

        this.grouped = this.groupByCategory(this.products);
        this.renderedModules = new Set();

        // 🧠 PHANTOM CART
        this.phantomCart = {
            D_vip: 0.0,
            M_surge: 1.0,
            calculatePrice(basePrice) {
                if (!basePrice || basePrice <= 0) return 0;
                return (basePrice * (1 - this.D_vip) * this.M_surge).toFixed(2);
            },
            getScarcity(item) {
                return item.stock || Math.floor(Math.random() * 4) + 2;
            }
        };

        this.buildSkeletonSockets();
        this.setupQuantumObserver();
        this.bindFilters();
        console.log(`🛍️ [Boutique V5] ${this.products.length} İksir → ${Object.keys(this.grouped).length} Departman kuruldu.`);
    },

    groupByCategory(items) {
        return items.reduce((acc, item) => {
            const cat = item.category;
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});
    },

    // 💀 SKELETON SOCKETS
    buildSkeletonSockets() {
        this.container.innerHTML = '';
        Object.keys(this.grouped).forEach((catName, index) => {
            const items = this.grouped[catName];
            const estimatedH = window.innerWidth < 768 ? 520 : (Math.ceil(items.length / 4) * 450) + 100;

            const socket = document.createElement('section');
            socket.className = 'boutique-module-socket w-full opacity-0 transition-opacity duration-1000 ease-out mb-16';
            socket.dataset.category = catName;
            socket.style.minHeight = `${estimatedH}px`;

            socket.innerHTML = `
                <div class="flex items-center gap-6 mb-8 px-4 md:px-0">
                    <h2 class="text-3xl md:text-4xl font-serif text-white tracking-wide">${catName}</h2>
                    <div class="h-px bg-gradient-to-r from-[#D4AF37]/50 to-transparent flex-1"></div>
                    <span class="text-[#D4AF37] text-[10px] tracking-[0.2em] uppercase font-bold whitespace-nowrap">${items.length} İKSİR</span>
                </div>
                <div class="module-grid boutique-slider-container w-full transition-opacity duration-500"></div>
            `;
            this.container.appendChild(socket);
            requestAnimationFrame(() => setTimeout(() => socket.classList.remove('opacity-0'), index * 100));
        });
    },

    // 👁️ INTERSECTION OBSERVER
    setupQuantumObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const cat = entry.target.dataset.category;
                if (entry.isIntersecting) {
                    if (!this.renderedModules.has(cat)) this.injectModuleDOM(entry.target, cat);
                } else {
                    const r = entry.boundingClientRect;
                    if ((r.top > window.innerHeight + 800 || r.bottom < -800) && this.renderedModules.has(cat)) {
                        this.purgeModuleDOM(entry.target, cat);
                    }
                }
            });
        }, { rootMargin: '600px 0px', threshold: 0 });

        document.querySelectorAll('.boutique-module-socket').forEach(s => this.observer.observe(s));
    },

    // 🎛️ KUANTUM FİLTRE MOTORU
    bindFilters() {
        const filterBtns = document.querySelectorAll('.boutique-filter');
        if (!filterBtns.length) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filterVal = e.currentTarget.getAttribute('data-filter').toLowerCase();

                // Lüks buton animasyonu
                filterBtns.forEach(b => {
                    b.classList.remove('active', 'bg-[#D4AF37]/10', 'border-[#D4AF37]', 'text-[#D4AF37]', 'shadow-[0_0_15px_rgba(212,175,55,0.2)]');
                    b.classList.add('border-white/20', 'text-white');
                });
                e.currentTarget.classList.remove('border-white/20', 'text-white');
                e.currentTarget.classList.add('active', 'bg-[#D4AF37]/10', 'border-[#D4AF37]', 'text-[#D4AF37]', 'shadow-[0_0_15px_rgba(212,175,55,0.2)]');

                // Socket göster/gizle — Soft-Match (exact veya alt-kategori)
                document.querySelectorAll('.boutique-module-socket').forEach(socket => {
                    const cat = (socket.dataset.category || '').toLowerCase().trim();
                    const target = filterVal.toLowerCase().trim();
                    // 'all' → hepsi | tam eşleşme | alt-kategori (skincare-hydra)
                    const match = target === 'all' || cat === target || cat.startsWith(target + '-');
                    if (match) {
                        socket.style.display = 'block';
                        requestAnimationFrame(() => setTimeout(() => socket.style.opacity = '1', 50));
                    } else {
                        socket.style.opacity = '0';
                        setTimeout(() => { if (socket.style.opacity === '0') socket.style.display = 'none'; }, 500);
                    }
                });

                console.log(`🎛️ [Filter] "${filterVal}" uygulandı.`);
            });
        });
        console.log('🎛️ [Boutique Core] Kuantum Filtreler Ağa Bağlandı.');
    },

    // ⚡ JIT INJECTION
    injectModuleDOM(targetSocket, categoryName) {
        if (this.renderedModules.has(categoryName)) return;
        console.log(`⚡ [O-1 V5] JIT: [${categoryName}]`);

        const grid = targetSocket.querySelector('.module-grid');
        grid.innerHTML = '';
        grid.style.opacity = '0';

        const fragment = document.createDocumentFragment();
        (this.grouped[categoryName] || []).forEach((item, index) => {
            const displayPrice = item.price_eur > 0
                ? this.phantomCart.calculatePrice(item.price_eur) : 'VIP';

            const card = document.createElement('article');
            card.className = 'boutique-slider-item group flex flex-col cursor-pointer translate-y-8 opacity-0 transition-all duration-700 ease-out';

            card.innerHTML = `
                <div style="position:relative;width:100%;aspect-ratio:4/5;overflow:hidden;border-radius:4px;
                     border:1px solid rgba(255,255,255,0.05);transform:translateZ(0);"
                     class="bg-[#050505] mb-5 transition-colors duration-500 group-hover:border-[#D4AF37]/40 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    <div class="absolute inset-0 bg-gradient-to-br from-[#0a0a09] to-[#1a1a18] animate-pulse z-0 transition-opacity duration-700"></div>
                    <img src="${item.image}" alt="${item.title}" loading="lazy"
                         onload="this.previousElementSibling.style.opacity='0';this.classList.remove('opacity-0');"
                         style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:1;"
                         class="transform transition-transform duration-[2s] group-hover:scale-105 opacity-0">
                    <div class="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors duration-700 pointer-events-none z-10"></div>
                    <div class="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-20 will-change-transform">
                        <button class="add-to-vault-btn w-full bg-white/10 backdrop-blur-xl border border-white/20
                               text-white font-medium text-[10px] tracking-[0.2em] uppercase py-4
                               hover:bg-white hover:text-black transition-all duration-300">
                            Sovereign Çantaya Ekle
                        </button>
                    </div>
                </div>
                <div class="px-2 flex-1 flex flex-col justify-between text-center pointer-events-none">
                    <h3 class="text-lg font-serif text-white mb-2 group-hover:text-[#D4AF37] transition-colors line-clamp-2">${item.title}</h3>
                    <div class="mt-2">
                        <span class="text-[#D4AF37] font-medium tracking-widest text-sm border-b border-[#D4AF37]/30 pb-1">
                            ${displayPrice !== 'VIP' ? '€' + displayPrice : displayPrice}
                        </span>
                    </div>
                </div>
            `;

            setTimeout(() => card.classList.remove('opacity-0', 'translate-y-8'), (index % 8) * 50);

            const pData = { ...item, price_eur: displayPrice, isProduct: true };
            card.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                if (e.target.closest('.add-to-vault-btn') && window.SovereignVault) {
                    window.SovereignVault.open(pData);
                } else if (window.BoutiqueQuickView) {
                    window.BoutiqueQuickView.open(pData);
                }
            };
            fragment.appendChild(card);
        });

        grid.appendChild(fragment);
        this.renderedModules.add(categoryName);
        requestAnimationFrame(() => { grid.style.opacity = '1'; });
    },

    // 🌑 GC BYPASS
    purgeModuleDOM(targetSocket, categoryName) {
        const grid = targetSocket.querySelector('.module-grid');
        if (!targetSocket.dataset.lockHeight) {
            targetSocket.dataset.lockHeight = targetSocket.offsetHeight;
        }
        targetSocket.style.minHeight = `${targetSocket.dataset.lockHeight}px`;
        grid.innerHTML = '';
        this.renderedModules.delete(categoryName);
        console.log(`🌑 [GC] [${categoryName}] DOM → RAM`);
    }
};

// ── BOOT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('sovereign:omega-strike', (e) => {
        if (window.SovereignBoutiqueCore && e.detail?.discount_percent) {
            window.SovereignBoutiqueCore.phantomCart.D_vip = e.detail.discount_percent / 100;
        }
    });

    const boot = (data) => {
        SovereignBoutiqueCore.init(Array.isArray(data) ? data : []);
        window.SovereignBoutiqueCore = SovereignBoutiqueCore;
    };

    if (window.__SANTIS_RAIL_READY__ && window.SovereignDataMatrix) {
        boot(window.SovereignDataMatrix);
    } else {
        document.addEventListener('santis:rail-ready', (e) => boot(e.detail), { once: true });
        setTimeout(() => {
            if (!window.SovereignBoutiqueCore?.products?.length) {
                fetch('/assets/data/services.json')
                    .then(r => r.json()).then(boot).catch(() => { });
            }
        }, 1500);
    }
});
