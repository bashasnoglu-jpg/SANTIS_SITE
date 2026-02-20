// STATIC_URL_MAP REMOVED - NOW USING DYNAMIC ROUTING
// All links are now generated via: /tr/urunler/detay.html?id={id}
const STATIC_URL_MAP = {};


/**
 * SANTIS CLUB - HOME PRODUCTS RENDERER (V3.0 - JSON FIRST)
 * Ana sayfadaki "The Digital Atelier" ve dinamik bölümleri yönetir.
 * Tamamen JSON tabanlıdır ve Live Sync uyumludur.
 */

// 1. SAFE HYDRATION BRIDGE
// 1. SAFE HYDRATION BRIDGE (Neuro-Sync v3.0)
async function hydrateProductCatalog() {
    // A. Immediate Check (Did we miss the event?)
    if (window.NV_DATA_READY && window.productCatalog && window.productCatalog.length > 0) {
        return;
    }

    // B. Wait for Signal
    return new Promise((resolve) => {
        const onReady = () => {
            console.log("🧠 [HomeProducts] Neuro-Sync Signal Received.");
            resolve();
        };

        if (window.NV_DATA_READY) {
            onReady();
        } else {
            window.addEventListener('product-data:ready', onReady, { once: true });

            // C. Safety Timeout (Fallback only if signal dies)
            setTimeout(() => {
                if (!window.NV_DATA_READY) {
                    console.warn('⚠️ [HomeProducts] Neuro-Sync Signal Timeout. Proceeding/Fetching manually...');
                    resolve();
                }
            }, 4000);
        }
    });
}

// 2. MAIN LOGIC (NEURAL BRIDGE)
window.loadHomeProducts = async () => {
    // PREVENT DOUBLE RENDER (FLICKERING FIX)
    if (window.isProductCatalogRendered) {
        console.log("🛡️ [HomeProducts] Bloklandı: Katalog zaten render edildi.");
        return;
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
            if (idHint.includes('hamam')) ctx = 'hamam';
            else if (idHint.includes('masaj')) ctx = 'masaj';
            else if (idHint.includes('skin') || idHint.includes('cilt')) ctx = 'skin';
            else ctx = 'product';
        }

        const normalizeCat = (item) => (item.category || item.cat || item.categoryId || '').toString().toLowerCase();
        const pickPool = (context) => {
            switch (context) {
                case 'journey':
                case 'journeys':
                    return (Array.isArray(window.NV_JOURNEYS) && window.NV_JOURNEYS.length) ? window.NV_JOURNEYS : sourceData.filter(it => normalizeCat(it).includes('journey'));
                case 'hamam':
                case 'hammam':
                case 'ritual-hammam':
                    return (Array.isArray(window.NV_HAMMAM) && window.NV_HAMMAM.length) ? window.NV_HAMMAM : sourceData.filter(it => normalizeCat(it).includes('hammam'));
                case 'masaj':
                case 'massage':
                    return (Array.isArray(window.NV_MASSAGES) && window.NV_MASSAGES.length) ? window.NV_MASSAGES : sourceData.filter(it => normalizeCat(it).includes('massage') || normalizeCat(it).includes('masaj'));
                case 'skin':
                case 'skincare':
                case 'cilt':
                    return (Array.isArray(window.NV_SKINCARE) && window.NV_SKINCARE.length) ? window.NV_SKINCARE : sourceData.filter(it => normalizeCat(it).includes('skin') || normalizeCat(it).includes('cilt') || normalizeCat(it).includes('face') || normalizeCat(it).includes('sothys'));
                default:
                    if (Array.isArray(window.NV_PRODUCTS_ALL) && window.NV_PRODUCTS_ALL.length) return window.NV_PRODUCTS_ALL;
                    if (Array.isArray(window.NV_PRODUCTS) && window.NV_PRODUCTS.length) return window.NV_PRODUCTS;
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

                // Card grid
                const cardGrid = document.createElement('div');
                cardGrid.className = 'product-grid-v2 nv-product-grid nv-cat-grid';

                items.forEach((product, i) => {
                    renderCard(product, cardGrid, i, ctx);
                });

                section.appendChild(cardGrid);
                gridAtelier.appendChild(section);
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

                items.forEach((product, i) => {
                    renderCard(product, cardGrid, i, ctx);
                });

                section.appendChild(cardGrid);
                gridAtelier.appendChild(section);
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
        } else {
            // Standard flat rendering for other pages
            atelierItems.forEach((product, index) => {
                renderCard(product, gridAtelier, index, ctx);
            });
        }
    });

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
    if (product.slug) {
        detailUrl = `/${lang}/${section}/${product.slug}.html`;
    } else {
        // Fallback for missing slugs (should verify these exist or fix JSON)
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

    // 🎨 CONTENT HTML (Tarot Structure)
    card.innerHTML = `
        <div class="card__image-wrapper">
            <img src="${imgPath}" alt="${product.title}" class="card__image" loading="lazy">
            <span class="card__badge" style="background:rgba(0,0,0,0.8); border:none; text-transform:uppercase; letter-spacing:2px; font-size:9px;">
                ${product.category || product.cat || 'RITUAL'}
            </span>
        </div>
        
        <div class="card__content">
            <div>
                <h3 class="card__title">${product.title || product.name}</h3>
                <div class="card__meta">${product.duration ? product.duration + ' DK' : 'SÜRESİZ'}</div>
                <p class="card__desc">${product.shortDesc || product.desc || product.subtitle || "Sessizliğe adım atın..."}</p>
            </div>
            
            <span class="card__action">RİTÜELİ KEŞFET</span>
        </div>
    `;

    // 🛡️ TRACK CLICK (Registry only — let native <a> handle navigation)
    card.addEventListener('click', () => {
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

    return card;
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
    el.style.display = "flex"; // Flex necessary for Tarot layout
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

// ═══════════════════════════════════════════════════════════════════════
// BODY-LEVEL CARD CLICK DELEGATION (Last Resort Navigation)
// Catches ALL clicks on .nv-card-tarot cards via body delegation
// ═══════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', (e) => {
        const card = e.target.closest('a.nv-card-tarot');
        if (!card) return;

        const href = card.getAttribute('href');
        console.log('🃏 [CardDelegation] Card clicked! href:', href);

        if (href && href !== '#' && href !== '') {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = href;
        }
    }, true); // CAPTURE PHASE — fires BEFORE any other handler

    console.log('🃏 [CardDelegation] Body-level card click handler installed (capture phase)');
});
