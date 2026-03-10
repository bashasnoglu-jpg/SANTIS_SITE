// STATIC_URL_MAP REMOVED - NOW USING DYNAMIC ROUTING
// All links are now generated via: /tr/urunler/detay.html?id={id}
const STATIC_URL_MAP = {};


/**
 * SANTIS CLUB - HOME PRODUCTS RENDERER (V3.0 - JSON FIRST)
 * Ana sayfadaki "The Digital Atelier" ve dinamik bölümleri yönetir.
 * Tamamen JSON tabanlıdır ve Live Sync uyumludur.
 */

// 1. SAFE HYDRATION BRIDGE (Neuro-Sync v3.1)
async function hydrateProductCatalog() {
    // A. Immediate Check
    if (window.__SANTIS_RAIL_READY__ && window.SovereignDataMatrix) {
        window.productCatalog = window.SovereignDataMatrix;
        return;
    }
    if (window.NV_DATA_READY && window.productCatalog && window.productCatalog.length > 0) {
        return;
    }

    // B. Wait for Signal
    return new Promise((resolve) => {
        const onReady = (e) => {
            console.log("🧠 [HomeProducts] Neuro-Sync Signal Received (Rail Ready).");
            if (e && e.detail) {
                window.productCatalog = e.detail; // Consume the global matrix
            } else if (window.SovereignDataMatrix) {
                window.productCatalog = window.SovereignDataMatrix;
            }
            resolve();
        };

        if (window.__SANTIS_RAIL_READY__ && window.SovereignDataMatrix) {
            onReady();
        } else if (window.NV_DATA_READY) {
            onReady();
        } else {
            // Our V10/V7 Sovereign Motoru dispatches this when real data is seeded
            document.addEventListener('santis:rail-ready', onReady, { once: true });
            document.addEventListener('nv-data-ready', onReady, { once: true });

            // D. Parallel Self-Fetch (Data Bridge yoksa kendi başına çeker)
            fetch('/assets/data/services.json')
                .then(r => r.json())
                .then(data => {
                    if (!window.__SANTIS_RAIL_READY__ && !window.NV_DATA_READY) {
                        window.productCatalog = data;
                        window.SovereignDataMatrix = data;
                        window.NV_PRODUCTS = data;
                        window.__SANTIS_RAIL_READY__ = true;
                        console.log('[HomeProducts] Self-fetch: ' + data.length + ' kayıt yüklendi.');
                        document.dispatchEvent(new CustomEvent('santis:rail-ready', { detail: data }));
                    }
                })
                .catch(() => { });

            // C. Safety Timeout
            setTimeout(() => {
                if (!window.NV_DATA_READY && !window.__SANTIS_RAIL_READY__) {
                    console.warn('⚠️ [HomeProducts] Neuro-Sync Signal Timeout. Processing aborted. Using fallback.');
                    resolve();
                }
            }, 6000); // 6 saniye (bir tık daha tolerans)
        }
    });
}

// 2. MAIN LOGIC (NEURAL BRIDGE)
window.loadHomeProducts = async () => {
    // PREVENT DOUBLE RENDER (FLICKERING FIX) - WITH SPA (VIEW TRANSITIONS) SUPPORT
    if (window.isProductCatalogRendered) {
        // ZIRH: Eğer SPA geçişi olduysa (yeni sayfa yüklendiği için eski gridler çöpe gitmiştir), 
        // DOM'daki yeni gridlerin içinin boş olup olmadığını kontrol et.
        const checkGrids = document.querySelectorAll(".nv-product-grid, #productsGrid, .product-grid-v2");
        let hasEmptyGrid = false;

        if (checkGrids.length > 0) {
            checkGrids.forEach(g => {
                if (g.children.length === 0) hasEmptyGrid = true;
            });
        }

        if (!hasEmptyGrid && checkGrids.length > 0) {
            console.log("🛡️ [HomeProducts] Bloklandı: Katalog zaten render edildi ve gridler dolu.");
            return;
        } else {
            console.log("🔄 [HomeProducts] SPA Transition algılandı: Render kilidi açıldı.");
            window.isProductCatalogRendered = false;
        }
    }

    // If DOM henüz tam yüklenmediyse bekle ve yeniden dene (erken tetiklenen olayları susturmak için)
    if (document.readyState !== 'complete' && !window.__hpDeferredOnce) {
        window.__hpDeferredOnce = true;
        setTimeout(() => window.loadHomeProducts(), 200);
        return;
    }

    // A. Ensure Data is Ready
    await hydrateProductCatalog();

    // B. Check Legacy Data
    if (typeof productCatalog === "undefined") {
        console.warn("[HomeProducts] productCatalog missing after hydration.");
        window.productCatalog = []; // Prevent crash
    }

    // B1. Align NV_PRODUCTS mirrors if empty
    if (!Array.isArray(window.NV_PRODUCTS) || window.NV_PRODUCTS.length === 0) {
        if (Array.isArray(window.productCatalog)) {
            window.NV_PRODUCTS = [...window.productCatalog];
        } else {
            window.NV_PRODUCTS = [];
        }
    }
    if (!Array.isArray(window.NV_PRODUCTS_ALL) || window.NV_PRODUCTS_ALL.length === 0) {
        window.NV_PRODUCTS_ALL = Array.isArray(window.productCatalog) ? [...window.productCatalog] : [];
    }

    // B2. Fallback: if still empty, hydrate from gallery-data.json to ensure cards render
    if (Array.isArray(window.productCatalog) && window.productCatalog.length === 0) {
        try {
            const gRes = await fetch('/assets/data/gallery-data.json?t=' + Date.now(), { cache: 'no-store' });
            if (gRes.ok) {
                const gData = await gRes.json();
                // Map gallery items into minimal product objects
                window.productCatalog = gData.slice(0, 8).map((g, idx) => ({
                    id: g.file + '_' + idx,
                    img: '/assets/img/gallery/' + g.file.replace(/\\s+/g, '%20'),
                    title: g.caption || g.category,
                    name: g.caption || 'Santis Experience',
                    category: g.category || 'gallery',
                    price: 'İncele',
                    slug: '#'
                }));
                console.warn("⚡ [HomeProducts] Gallery fallback used. Items:", window.productCatalog.length);
            }
        } catch (e) {
            console.warn("🟠 [HomeProducts] Gallery fallback failed:", e);
        }
    }

    // C. Load Admin Dynamic Data (Sections & Hero)
    try {
        const response = await fetch('/assets/data/home_data.json?t=' + Date.now());
        if (response.ok) {
            const homeData = await response.json();
            console.log("🟢 [HomeProducts] Dynamic Sections Loaded:", homeData);

            if (homeData.sections) {
                renderSection('grid-hammam', homeData.sections['grid-hammam']);
                renderSection('grid-massages', homeData.sections['grid-massages']);
                renderSection('grid-skincare', homeData.sections['grid-skincare']);

                // Hero logic could go here if needed
                if (homeData.sections.hero && homeData.sections.hero.items.length > 0) {
                    // updateHeroFromAdmin(homeData.sections.hero.items[0]); // Optional
                }
            }
        }
    } catch (e) {
        console.warn("🟠 [HomeProducts] Dynamic Data Load Failed:", e);
    }

    // D. Render Digital Atelier (Products)
    const path = (window.location.pathname || "").toLowerCase();

    // Ensure at least one target grid exists; also support legacy .product-grid-v2 only
    const collectGrids = () => {
        const els = document.querySelectorAll(".nv-product-grid, #productsGrid, .product-grid-v2");
        console.log("🔍 [HomeProducts] collectGrids found:", els.length);
        return Array.from(els);
    };
    let grids = collectGrids(); // dedupe

    // Pages where grid is expected (force injection if missing)
    // Homepage excluded — wireframe has no product grids, only category/product pages
    const forceGridPaths = [
        ...(window.SantisRouter ? SantisRouter.SUPPORTED_LANGS.flatMap(l => [
            SantisRouter.categoryPath('urunler', l),
            SantisRouter.categoryPath('masajlar', l),
            SantisRouter.categoryPath('hamam', l),
            SantisRouter.categoryPath('cilt-bakimi', l),
        ]) : [
            "/tr/urunler/index.html", "/tr/masajlar/index.html", "/tr/hamam/index.html", "/tr/cilt-bakimi/index.html",
            "/en/products/index.html", "/en/massages/index.html", "/en/hammam/index.html"
        ])
    ];
    const shouldForceGrid = forceGridPaths.some(p => path.endsWith(p));

    if (grids.length === 0 && shouldForceGrid) {
        // if DOM not fully ready, retry a few times before injecting fallback
        const retries = window.__hpGridRetry || 0;
        if (document.readyState !== 'complete' && retries < 3) {
            window.__hpGridRetry = retries + 1;
            console.warn(`⚠️ [HomeProducts] Grid not ready (attempt ${retries + 1}), retrying...`);
            window.isProductCatalogRendered = false;
            setTimeout(() => window.loadHomeProducts(), 300);
            return;
        }
        // Retry more times in case DOM is injected late (SSR/SPA fragments)
        for (let i = 0; i < 12 && grids.length === 0; i++) {
            await new Promise((res) => setTimeout(res, 120));
            grids = collectGrids();
        }
    }

    if (grids.length === 0) {
        if (shouldForceGrid) {
            const fallbackGrid = document.createElement("div");
            fallbackGrid.className = "product-grid-v2 nv-product-grid";
            fallbackGrid.id = "productsGrid";
            (document.querySelector("main") || document.body).appendChild(fallbackGrid);
            grids = [fallbackGrid];
            console.warn("⚠️ [HomeProducts] Target grid not found in DOM after retries. Injected fallback #productsGrid into page.");
        } else {
            console.warn("ℹ️ [HomeProducts] No grid on this page; renderer skipped.");
            return;
        }
    }

    grids.forEach((gridAtelier) => {
        // Journeys are handled separately below to avoid double rendering
        if (gridAtelier.id === 'grid-journeys') {
            return;
        }
        // D.1. Data Source Strategy
        let sourceData = window.productCatalog || [];

        console.log("ℹ️ [HomeProducts] Source lengths -> productCatalog:", Array.isArray(sourceData) ? sourceData.length : 'n/a',
            "NV_PRODUCTS:", Array.isArray(window.NV_PRODUCTS) ? window.NV_PRODUCTS.length : 'n/a');

        // Fallback: If JSON is empty, try Core Data Bridge (site_content.json via app.js)
        if (sourceData.length === 0 && typeof window.getSantisData === 'function') {
            sourceData = window.getSantisData();
            console.log("⚡ [HomeProducts] Bridge Active: Switched to getSantisData() source:", sourceData.length);
        }

        // Determine context from grid (attribute first, then id hint)
        let ctx = (gridAtelier.dataset.context || "").toLowerCase();
        const idHint = (gridAtelier.id || "").toLowerCase();
        if (!ctx) {
            // Check URL path as fallback
            const pathCat = window.location.pathname.toLowerCase();
            if (idHint.includes('hamam') || pathCat.includes('/hamam/')) ctx = 'hamam';
            else if (idHint.includes('masaj') || pathCat.includes('/masaj')) ctx = 'masaj';
            else if (idHint.includes('skin') || idHint.includes('cilt') || pathCat.includes('/cilt-bakimi/')) ctx = 'skin';
            else if (pathCat.includes('/urunler/') || pathCat.includes('/products/')) ctx = 'urunler';
            else ctx = 'product';
        }

        const normalizeCat = (item) => (item.category || item.cat || item.categoryId || '').toString().toLowerCase();
        const pickPool = (context) => {
            switch (context) {
                case 'journey':
                case 'journeys':
                    return sourceData.filter(it => {
                        const c = normalizeCat(it);
                        return c === 'wellness' || c.includes('journey');
                    });
                case 'hamam':
                case 'hammam':
                case 'ritual-hammam':
                    return sourceData.filter(it => {
                        const c = normalizeCat(it);
                        return c.includes('hammam') || c.startsWith('ritual-hammam');
                    });
                case 'masaj':
                case 'massage':
                    return sourceData.filter(it => {
                        const c = normalizeCat(it);
                        return c.startsWith('massage');
                    });
                case 'skin':
                case 'skincare':
                case 'cilt':
                    return sourceData.filter(it => {
                        const c = normalizeCat(it);
                        return c.startsWith('skincare') || c.startsWith('sothys');
                    });
                case 'urunler':
                case 'products':
                case 'product':
                    // Fetch physical product JSONs if not already present in sourceData
                    if (!window.__SANTIS_STORE_PRODUCTS_LOADED) {
                        try {
                            console.log("🛒 [HomeProducts] Loading physical store products...");
                            // We make synchronous-like requests using awaiting promises because this function is called from a loop it can't await easily,
                            // However, we can use a trick: pickPool is synchronous.
                            // The safest way is to trigger an async load and re-render.

                            Promise.all([
                                fetch('/assets/data/products-atelier.json').then(r => r.json()),
                                fetch('/assets/data/products-sothys.json').then(r => r.json())
                            ]).then(([atelierArgs, sothysArgs]) => {
                                const products = [...atelierArgs, ...sothysArgs];
                                products.forEach(p => window.productCatalog.push(p));
                                window.__SANTIS_STORE_PRODUCTS_LOADED = true;
                                console.log(`✅ [HomeProducts] Added ${products.length} physical products.`);
                                // Removed window.loadHomeProducts() recursion. Let the virtualizer handle the initial load, 
                                // and if it missed it, the next manual navigate will catch the loaded catalog.
                            }).catch(err => console.warn("🟠 [HomeProducts] Store products fail:", err));
                        } catch (e) { }
                    }

                    return sourceData.filter(it => {
                        const c = normalizeCat(it);
                        // Store page SHOULD NOT show hammam/massage/skincare services.
                        // It should only show physical products (e.g., product, cosmetic, merchandise, gift)
                        return !(
                            c.includes('hammam') ||
                            c.startsWith('ritual-') ||
                            c.startsWith('massage') ||
                            c === 'wellness' ||
                            c.includes('journey') ||
                            c.includes('skin') ||
                            c.includes('cilt') ||
                            c.includes('face') ||
                            c.startsWith('sothys-') ||
                            c === 'facesothys'
                        );
                    });
                default:
                    return sourceData;
            }
        };

        let workingData = pickPool(ctx) || [];

        // Optional limit via data-limit
        const limit = parseInt(gridAtelier.dataset.limit || '0', 10);
        const atelierItems = limit > 0 ? workingData.slice(0, limit) : workingData;

        console.log("ℹ️ [HomeProducts] Context:", { ctx, total: workingData.length, rendered: atelierItems.length });

        // 🚨 EMERGENCY FALLBACK: If absolutely no data, inject static test card
        if (atelierItems.length === 0 && shouldForceGrid) {
            console.warn("⚠️ [HomeProducts] No data found. Injecting emergency test card.");
            atelierItems.push({
                id: 'system-test-card',
                title: 'Santis System Check',
                name: 'System Check',
                category: 'Diagnostics',
                price: 'Loading...',
                img: '/assets/img/cards/santis_card_hammam_v1.webp',
                slug: '#'
            });
        } else if (atelierItems.length === 0) {
            console.warn("ℹ️ [HomeProducts] No data for this non-forced page; render skipped.");
            return;
        }

        // 🏷️ CATEGORY-GROUPED RENDERING (Massage & Skincare Pages)
        const isMassagePage = (ctx === 'masaj' || ctx === 'massage');
        const isSkincarePage = (ctx === 'skin' || ctx === 'skincare' || ctx === 'cilt');

        if (isMassagePage && atelierItems.length > 0) {
            // Category metadata for editorial sections
            const CATEGORY_META = [
                { id: 'massage-relaxation', title: 'Klasik Rahatlama', tagline: 'Zamansız dokunuşun huzuru', icon: '🤲' },
                { id: 'massage-sports', title: 'Spor & Derin Doku', tagline: 'Performansın ötesinde toparlanma', icon: '💪' },
                { id: 'massage-asian', title: 'Asya Terapileri', tagline: 'Doğu\'nun kadim şifa gelenekleri', icon: '🌏' },
                { id: 'massage-medical', title: 'Medikal & Terapötik', tagline: 'Bilimin dokunuşu', icon: '🩺' },
                { id: 'massage-regional', title: 'Bölgesel Terapiler', tagline: 'Tam hedefe odaklanma', icon: '🎯' },
                { id: 'massage-premium', title: 'Premium Ritüeller', tagline: 'Duyuların şöleni', icon: '✨' },
                { id: 'massage-couples', title: 'Çift Deneyimleri', tagline: 'Sevdiklerinizle paylaşılan anlar', icon: '💑' },
                { id: 'massage-kids', title: 'Kids & Aile', tagline: 'Küçük misafirler için özel dokunuş', icon: '👨‍👩‍👧' }
            ];

            // Group items by categoryId
            const groups = {};
            atelierItems.forEach(item => {
                const cat = item.categoryId || 'massage-relaxation';
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(item);
            });

            gridAtelier.innerHTML = '';
            gridAtelier.style.display = 'block'; // Override flex for sections

            // Render each category section in order
            CATEGORY_META.forEach(meta => {
                const items = groups[meta.id];
                if (!items || items.length === 0) return;

                // Section wrapper
                const section = document.createElement('section');
                section.className = 'nv-massage-category';
                section.id = `cat-${meta.id}`;
                section.dataset.category = meta.id;

                // Section header
                section.innerHTML = `
                    <div class="nv-cat-header">
                        <span class="nv-cat-icon">${meta.icon}</span>
                        <div>
                            <h2 class="nv-cat-title">${meta.title}</h2>
                            <p class="nv-cat-tagline">${meta.tagline}</p>
                        </div>
                    </div>
                `;

                // Card grid (Sovereign Array)
                const cardGrid = document.createElement('div');
                cardGrid.className = 'product-grid-v2 nv-product-grid nv-cat-grid';

                section.appendChild(cardGrid);
                gridAtelier.appendChild(section);

                // PHASE 11: SOVEREIGN CHUNKED RENDERER (Category Level)
                attachSovereignRenderer(items, cardGrid, ctx);
            });

            console.log(`📂 [HomeProducts] Massage categories rendered: ${Object.keys(groups).length} groups`);

            // 🏷️ CHIP FILTER ENGINE — Must run AFTER sections are created
            const chipContainer = document.getElementById('nvChips');
            if (chipContainer) {
                chipContainer.addEventListener('click', function (e) {
                    const chip = e.target.closest('.nv-chip');
                    if (!chip) return;

                    const catId = chip.getAttribute('data-target');
                    console.log('🏷️ [ChipFilter] Clicked:', catId);

                    // Update active chip
                    chipContainer.querySelectorAll('.nv-chip').forEach(c => c.classList.remove('is-active'));
                    chip.classList.add('is-active');

                    // Get all category sections (they exist now)
                    const catSections = gridAtelier.querySelectorAll('.nv-massage-category');

                    if (catId === 'all') {
                        catSections.forEach(s => { s.style.display = ''; });
                    } else {
                        catSections.forEach(s => {
                            if (s.dataset.category === catId) {
                                s.style.display = '';
                                setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                            } else {
                                s.style.display = 'none';
                            }
                        });
                    }
                });
                console.log('✅ [ChipFilter] Attached to #nvChips after section render');
            }
        } else if (isSkincarePage && atelierItems.length > 0) {
            // SKINCARE CATEGORY-GROUPED RENDERING
            const SKINCARE_META = [
                { id: 'skincare-basic', title: 'Temel Bakım', tagline: 'Cildinizin günlük ritüeli', icon: '🧴' },
                { id: 'skincare-purify', title: 'Arındırma', tagline: 'Derinlemesine temizlik ve detoks', icon: '✨' },
                { id: 'skincare-hydra', title: 'Nemlendirme', tagline: 'Yoğun nem ve bariyer onarımı', icon: '💧' },
                { id: 'skincare-antiage', title: 'Anti-Aging', tagline: 'Zamanı yavaşlatan protokoller', icon: '🔬' },
                { id: 'skincare-special', title: 'Özel Bakımlar', tagline: 'Premium ve kişiye özel ritüeller', icon: '💎' },
                { id: 'sothys-purifying', title: 'Sothys Arındırma', tagline: 'Sothys Paris profesyonel protokolü', icon: '🇫🇷' },
                { id: 'sothys-hydra', title: 'Sothys Nemlendirme', tagline: 'Sothys Hydra koleksiyonu', icon: '🇫🇷' },
                { id: 'sothys-antiage', title: 'Sothys Anti-Age', tagline: 'Sothys yaşlanma karşıtı ritüeller', icon: '🇫🇷' },
                { id: 'sothys-men', title: 'Sothys Erkek', tagline: 'Sothys erkek bakım serisi', icon: '🇫🇷' }
            ];

            const skinGroups = {};
            atelierItems.forEach(item => {
                const cat = item.categoryId || 'skincare-basic';
                if (!skinGroups[cat]) skinGroups[cat] = [];
                skinGroups[cat].push(item);
            });

            gridAtelier.innerHTML = '';
            gridAtelier.style.display = 'block';

            SKINCARE_META.forEach(meta => {
                const items = skinGroups[meta.id];
                if (!items || items.length === 0) return;

                const section = document.createElement('section');
                section.className = 'nv-massage-category';
                section.id = `cat-${meta.id}`;
                section.dataset.category = meta.id;

                section.innerHTML = `
                    <div class="nv-cat-header">
                        <span class="nv-cat-icon">${meta.icon}</span>
                        <div>
                            <h2 class="nv-cat-title">${meta.title}</h2>
                            <p class="nv-cat-tagline">${meta.tagline}</p>
                        </div>
                    </div>
                `;

                const cardGrid = document.createElement('div');
                cardGrid.className = 'product-grid-v2 nv-product-grid nv-cat-grid';

                section.appendChild(cardGrid);
                gridAtelier.appendChild(section);

                // PHASE 11: SOVEREIGN CHUNKED RENDERER (Category Level)
                attachSovereignRenderer(items, cardGrid, ctx);
            });

            console.log(`📂 [HomeProducts] Skincare categories rendered: ${Object.keys(skinGroups).length} groups`);

            // CHIP FILTER ENGINE for Skincare
            const skinChipContainer = document.getElementById('nvChips');
            if (skinChipContainer) {
                skinChipContainer.addEventListener('click', function (e) {
                    const chip = e.target.closest('.nv-chip');
                    if (!chip) return;

                    const catId = chip.getAttribute('data-target');
                    console.log('🏷️ [ChipFilter:Skin] Clicked:', catId);

                    skinChipContainer.querySelectorAll('.nv-chip').forEach(c => c.classList.remove('is-active'));
                    chip.classList.add('is-active');

                    const catSections = gridAtelier.querySelectorAll('.nv-massage-category');

                    if (catId === 'all') {
                        catSections.forEach(s => { s.style.display = ''; });
                    } else if (catId === 'sothys') {
                        // Show all sothys-* categories
                        catSections.forEach(s => {
                            s.style.display = s.dataset.category.startsWith('sothys') ? '' : 'none';
                        });
                    } else {
                        catSections.forEach(s => {
                            if (s.dataset.category === catId) {
                                s.style.display = '';
                                setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                            } else {
                                s.style.display = 'none';
                            }
                        });
                    }
                });
                console.log('✅ [ChipFilter:Skin] Attached to #nvChips after section render');
            }
        } else if (atelierItems.length > 0) {
            // General fallback mapped products (like hamam ones)
            attachSovereignRenderer(atelierItems, gridAtelier, ctx);
        }
    });

    // ── SOVEREIGN VIRTUALIZATION ENGINE (ULTRA-MEGA) ──
    function attachSovereignRenderer(dataset, container, context) {
        if (!dataset || dataset.length === 0) return;

        const CHUNK_SIZE = 12;
        let currentIndex = 0;
        let observer = null;

        function renderNextChunk() {
            const chunk = dataset.slice(currentIndex, currentIndex + CHUNK_SIZE);
            if (chunk.length === 0) return;

            // ZIRH 3: DocumentFragment (Main Thread Reflow Koruması)
            const fragment = document.createDocumentFragment();

            chunk.forEach((product, i) => {
                const globalIndex = currentIndex + i;
                renderCard(product, fragment, globalIndex, context);
            });

            container.appendChild(fragment);
            currentIndex += CHUNK_SIZE;

            // Nöbetçi (Observer) Güncellemesi
            if (currentIndex < dataset.length) {
                attachObserver();
            } else if (observer) {
                // ZIRH 2: Yolun Sonu (End-of-List) İnfazı
                observer.disconnect();
                console.log(`🛡️ [Virtualization] End of list reached (${dataset.length} items). Observer disconnected.`);
            }
        }

        function attachObserver() {
            // Eski nöbetçi varsa ZIRH 1 gereği (Memory Leak) öldür
            if (observer) observer.disconnect();

            const targetNode = container.lastElementChild;
            if (!targetNode) return;

            observer = new IntersectionObserver((entries, obs) => {
                if (entries[0].isIntersecting) {
                    obs.unobserve(targetNode); // Sadece hedeften ayrıl

                    // Kuantum Süzülüşü: Ghost Thread ile ana thread'i hiç yormadan birleştir
                    requestAnimationFrame(() => {
                        if (window.SantisIdle) {
                            SantisIdle.enqueue('RenderNextChunk', renderNextChunk);
                        } else {
                            renderNextChunk();
                        }
                    });
                }
            }, {
                rootMargin: '800px', // Ziyaretçi 800px yaklaştığında yükle
                threshold: 0.1
            });

            observer.observe(targetNode);
        }

        // İlk Porsiyon (LCP Kurtarıcı Paketi)
        renderNextChunk();
    }

    // E. Render Journeys (Static Services)
    const gridJourneys = document.getElementById("grid-journeys");
    if (gridJourneys) {
        const journeyItems = window.NV_JOURNEYS || [];
        gridJourneys.innerHTML = "";
        journeyItems.forEach((product, index) => {
            renderCard(product, gridJourneys, index);
        });
    }

    // Mark render complete only after grids were processed
    window.isProductCatalogRendered = true;

    // 💎 PHASE 44: Re-trigger Phantom Injector to map database assets to the newly created dynamic cards
    if (window.SantisOS && typeof window.SantisOS.ignitePhantomInjector === 'function') {
        setTimeout(() => window.SantisOS.ignitePhantomInjector(), 100);
    }
};

// 3. HELPER: RENDER ADMIN SECTION
function renderSection(gridId, sectionData) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    if (!sectionData || !sectionData.items || sectionData.items.length === 0) {
        // Keep initial loader or empty state if no items
        return;
    }

    grid.innerHTML = "";
    sectionData.items.forEach((item, index) => {
        // Map Admin Object -> Card Object
        const mockProduct = {
            id: item.link + "_" + index,
            img: item.image,
            title: item.title,
            name: item.title,
            category: item.subtitle,
            price: item.badge ? item.badge : "İncele",
            slug: item.link,
            desc: item.subtitle,
            is_admin_item: true
        };

        // Use standard renderer but with admin context check inside or pre-process
        const card = createCardElement(mockProduct, index, true);
        grid.appendChild(card);
    });
}

// 4. HELPER: CREATE CARD (Unified Tarot Logic V1.0)
function createCardElement(product, index, isAdminItem = false, ctx = "") {
    const cardWrapper = document.createElement("div");
    cardWrapper.className = "nv-card-wrapper";

    const card = document.createElement("a");
    card.className = "nv-card-tarot " + (product.layout_class || ""); // Phase 17: Tarot Class
    card.dataset.id = product.id;

    // URL Logic (STATIC V5.5)
    const slug = product.slug || product.id;
    let detailUrl = '#';

    // 1. Determine Language and Section
    const lang = (window.SITE_LANG || 'tr').toLowerCase();
    const cat = (product.categoryId || product.category || '').toLowerCase();
    let section = 'masajlar'; // Default fallback

    if (cat.includes('hammam') || cat.includes('hamam')) {
        section = (lang === 'en' || lang === 'de' || lang === 'fr' || lang === 'ru') ? 'hammam' : 'hamam';
    } else if (cat.includes('skin') || cat.includes('cilt') || cat.includes('face') || cat.includes('sothys')) {
        section = {
            'tr': 'cilt-bakimi',
            'en': 'skincare',
            'de': 'hautpflege',
            'fr': 'soins-visage',
            'ru': 'skincare'
        }[lang] || 'cilt-bakimi';
    } else {
        // Massage / Default
        section = {
            'tr': 'masajlar',
            'en': 'massages',
            'de': 'massagen',
            'fr': 'massages',
            'ru': 'massages'
        }[lang] || 'masajlar';
    }

    // 2. Construct Static URL
    // 2. Construct Static URL
    if (product.slug && product.slug !== '#') {
        detailUrl = `/${lang}/${section}/${product.slug}.html`;
    } else {
        // Fallback for missing/empty slugs
        console.warn(`⚠️ [Card] Missing slug for ${product.id}. Using legacy fallback.`);
        detailUrl = `/service-detail.html?id=${product.id}`;
    }

    if (product.match_score) detailUrl += `?score=${product.match_score}`; // Concierge Score

    card.href = detailUrl;

    // Image Normalization
    let imgPath = product.img || product.image || '/assets/img/cards/santis_card_hammam_v1.webp';
    if (!imgPath.startsWith('/') && !imgPath.startsWith('http')) imgPath = `/assets/img/cards/${imgPath}`;

    // Price Logic (Monk Tone: Hidden or Minimal)
    // We only show "Ritüeli Keşfet" (Discover Ritual) in the data loop, ignoring price for now unless critical.

    // CHAMELEON MODULE: Evaluate Persona
    const ghostScore = parseInt(sessionStorage.getItem('santis_ghost_score') || '0', 10);
    const isSovereign = ghostScore >= 85;

    if (isSovereign) {
        card.classList.add('is-sovereign');
    }

    const actionText = isSovereign ? "Ritüeli Keşfedin" : "RİTÜELİ KEŞFET";

    // REVENUE BRAIN: Dynamic Pricing
    let displayPrice = '';

    // Fiyat obje ise (örneğin { base: 60, currency: "€" } veya { tr: 1500, en: 60 }) 
    // bunu düzgün string formatına çevir
    let basePrice = product.price;
    if (typeof basePrice === 'object' && basePrice !== null) {
        // En yaygın fiyat propertylerini dene
        basePrice = basePrice.amount || basePrice.base || basePrice.tr || basePrice.en || basePrice.value || Object.values(basePrice)[0] || '';
    }

    if (basePrice && basePrice !== 'İncele' && basePrice !== 'Loading...') {
        // Core Logic: Yield Calculation
        const finalPrice = (window.santisRevenueBrain && typeof window.santisRevenueBrain.validateYield === 'function')
            ? window.santisRevenueBrain.validateYield(basePrice, basePrice)
            : basePrice;

        // Sayı olmayan metinsel fiyatları formatla
        const prefix = isNaN(finalPrice) ? '' : '€';
        displayPrice = `<span style="color:#D4AF37; font-weight:600; font-family:'Cinzel', serif;">${prefix}${finalPrice}</span>`;
    }

    const durationText = product.duration ? product.duration + ' DK' : 'SÜRESİZ';
    const metaHtml = displayPrice ? `${durationText} &nbsp;|&nbsp; ${displayPrice}` : durationText;

    // 🎨 CONTENT HTML (Tarot Structure)
    card.innerHTML = `
        <div class="card__image-wrapper">
            <img src="${imgPath}" alt="${product.title || product.name || 'Santis ritual'}" class="card__image" data-santis-slot="${product.slug || product.id}" loading="lazy" width="320" height="200" decoding="async">
            <span class="card__badge" style="background:rgba(0,0,0,0.8); border:none; text-transform:uppercase; letter-spacing:2px; font-size:9px;">
                ${product.category || product.cat || 'RITUAL'}
            </span>
        </div>
        
        <div class="card__content">
            <div>
                <h3 class="card__title">${product.title || product.name}</h3>
                <div class="card__meta">${metaHtml}</div>
                <p class="card__desc">${product.shortDesc || product.desc || product.subtitle || "Sessizliğe adım atın..."}</p>
            </div>
            
            <span class="card__action">${actionText}</span>
        </div>
    `;

    // 🏆 GİZLİ GÖREV: KASAYI ÜRÜNLER (GRID) SAYFASINA DA BAĞLAYIN
    const btnAction = card.querySelector('.card__action');
    if (btnAction) {
        btnAction.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // <a> kartının varsayılan link tetiklemesini durdurur
            if (window.SovereignVault) {
                console.log(`💎 [Grid] Kasaya Gönderiliyor: ${product.title || product.name}`);
                window.SovereignVault.open(product); // Ürünler sayfasından da Kasa açılsın!
            }
        });
    }

    // 🛡️ TRACK CLICK (Registry only)
    card.addEventListener('click', (e) => {
        // Eğer kasaya gidiyorsa (yukarıda durdurulur) bu link gezinmesi engellenmez, 
        // Ancak kartın herhangi bir *başka* yerine tıklanmışsa normal sayfaya gider.
        try {
            if (window.Registry) {
                window.Registry.track('view_service', {
                    id: product.id,
                    category: product.category,
                    title: product.title
                });
            }
        } catch (err) {
            console.warn('[Card] Registry error:', err);
        }
    });

    cardWrapper.appendChild(card);
    return cardWrapper;
}

// Legacy Alias
function renderCard(product, container, index, ctx = "") {
    // 🌍 LANGUAGE-AWARE NORMALIZATION
    // services.json stores titles in content.{lang}.title
    // Root-level 'name' is German (legacy). Extract correct language data.
    const lang = (window.SITE_LANG || 'tr').toLowerCase();
    const localized = (product.content && product.content[lang]) || (product.content && product.content['tr']) || {};

    // Build a normalized product for the card renderer
    const normalizedProduct = Object.assign({}, product, {
        title: localized.title || product.title || product.name || 'Hizmet',
        shortDesc: localized.shortDesc || product.shortDesc || product.desc || '',
        category: formatCategory(product.categoryId || product.category || product.cat || ''),
        img: product.img || product.image || (product.media && product.media.hero) || ''
    });

    const el = createCardElement(normalizedProduct, index, false, ctx);
    el.style.display = "block"; // Changed from flex since the wrapper is now a block container
    container.appendChild(el);
}

// Helper: Format categoryId into readable badge text
function formatCategory(catId) {
    if (!catId) return 'RITUAL';
    // "ritual-hammam" -> "HAMAM", "massage-classic" -> "MASAJ"
    const map = {
        'ritual-hammam': 'HAMAM',
        'massage-classic': 'KLASİK MASAJ',
        'massage-therapeutic': 'TERAPÖTİK MASAJ',
        'massage-specialty': 'ÖZEL MASAJ',
        'massage-couples': 'ÇİFT MASAJI',
        'massage-kids': 'KIDS & AİLE',
        'massage-relaxation': 'RAHATLAMA',
        'facial-sothys': 'CİLT BAKIMI',
        'journey': 'PAKET',
        'skincare': 'CİLT BAKIMI',
        'skincare-basic': 'TEMEL BAKIM',
        'skincare-antiage': 'ANTİ-AGİNG',
        'skincare-purify': 'ARINDIRMA',
        'skincare-hydra': 'NEMLENDİRME',
        'skincare-special': 'ÖZEL BAKIM',
        'sothys-purifying': 'SOTHYS',
        'sothys-hydra': 'SOTHYS',
        'sothys-antiage': 'SOTHYS',
        'sothys-men': 'SOTHYS'
    };
    return map[catId.toLowerCase()] || catId.replace(/[-_]/g, ' ').toUpperCase();
}

// Auto-Init (double hook for reliability)
document.addEventListener("DOMContentLoaded", window.loadHomeProducts);
// 5. ORACLE INTERFACE
window.renderSpotlight = function (product, reasoning) {
    const spotlightSection = document.querySelector('.nv-spotlight');
    if (!spotlightSection) return;

    console.log("🔦 [Spotlight] Updating visual based on Oracle Prophecy...");

    // Animate Out
    spotlightSection.style.opacity = '0';
    spotlightSection.style.transform = 'translateY(20px)';
    spotlightSection.style.transition = 'all 0.8s ease';

    setTimeout(() => {
        // Update Content
        const titleEl = spotlightSection.querySelector('.nv-editorial-title');
        const descEl = spotlightSection.querySelector('.text-muted');
        const kickerEl = spotlightSection.querySelector('.nv-kicker');
        const btnEl = spotlightSection.querySelector('.nv-btn');
        const imgEl = spotlightSection.querySelector('.nv-visual-col img');

        if (titleEl) titleEl.textContent = product.title || product.name;
        if (descEl) descEl.textContent = product.desc || product.subtitle || "Sizin için özel olarak seçilmiş bir deneyim.";
        if (kickerEl) kickerEl.textContent = `ÖNERİLEN: ${reasoning || 'SİZE ÖZEL'}`;
        if (btnEl) btnEl.href = product.slug ? `/service-detail.html?slug=${product.slug}` : (window.SantisRouter ? SantisRouter.localize(`/tr/urunler/detay.html?id=${product.id}`) : `/tr/urunler/detay.html?id=${product.id}`);

        if (imgEl) {
            imgEl.src = product.img || product.image;
            imgEl.alt = product.title;
        }

        // Animate In
        spotlightSection.style.opacity = '1';
        spotlightSection.style.transform = 'translateY(0)';
    }, 800);
};

// ORACLE INTERFACE END
