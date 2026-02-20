/**
 * SANTIS CATEGORY ENGINE v2.1 (Config-Driven UI)
 * Architecture: Single Source of Truth + Static Smart Filters
 * Last Updated: 03.02.2026
 */

(function () {
    const Engine = {
        config: {
            containerId: "nvList",
            bentoId: "bento-grid",
            searchId: "nvSearch",
            chipsId: "nvChips"
        },

        determineRoot() {
            if (window.SITE_ROOT) return window.SITE_ROOT;
            const depth = window.location.pathname.split('/').length - 2;
            return depth > 0 ? "../".repeat(depth) : "";
        },

        init(context) {
            console.log(`🎬 Engine Init [v2.1]: ${context}`);

            // 1. Locate Data Config (New V2 Structure)
            // context = 'massages', 'hammam' etc.
            // Map context to lowercase key for config lookup
            const categoryKey = context.toLowerCase();

            // 2. Get Filters & Data from Global Config
            // LEGACY MAPPER: Map 'MASSAGES' -> 'massage' for new config
            const configMap = {
                'massages': 'massage',
                'hammam': 'hammam',
                'skincare': 'skincare',
                'products': 'products' // Custom handling
            };

            const configKey = configMap[categoryKey] || categoryKey;

            this.filters = window.NV_SMART_FILTERS ? window.NV_SMART_FILTERS[configKey] : null;

            // 3. Load Data Source (Using Output of Data Bridge or Catalog Directly)
            // We still use the Global Variables populated by product-data.js Bridge for backward compat
            const dataSourceName = `NV_${context.toUpperCase()}`;
            this.data = window[dataSourceName] || [];

            console.log(`📊 Data Source: ${dataSourceName} (${this.data.length} items)`);

            // 4. Fallback if no specific config found (e.g. Products page might differ)
            if (!this.filters) {
                console.warn(`⚠️ No Smart Filter Config for: ${configKey}. Using basic 'All'.`);
                this.filters = [{ key: "all", label: "Tümü", icon: "✨" }];
            }

            // 5. DOM Elements
            this.container = document.getElementById(this.config.bentoId) || document.getElementById(this.config.containerId);
            this.isBento = !!document.getElementById(this.config.bentoId);
            this.searchInput = document.getElementById(this.config.searchId);
            this.chipsContainer = document.getElementById(this.config.chipsId);

            if (!this.container) {
                console.warn("Category Engine: Container missing.");
                return;
            }

            // 6. State
            this.state = {
                filterKey: "all", // Stores the active 'key' from Config
                query: ""
            };

            // 7. Bind & Render
            this.renderChips();
            this.applyState();
            this.bindEvents();
        },

        // --- CORE LOGIC (V2 High Performance) ---

        normalize(str) {
            return (str || "").toString().toLowerCase().trim();
        },

        applyState() {
            const q = this.normalize(this.state.query);
            const activeFilterObj = this.filters.find(f => f.key === this.state.filterKey);

            // 1. FILTERING
            let filtered = this.data.filter(item => {
                // A. Smart Filter Logic (Config Driven)
                // If key is 'all', skip check. Else run filterFn.
                if (activeFilterObj && activeFilterObj.key !== 'all') {
                    // Check if function exists (V2)
                    if (typeof activeFilterObj.filterFn === 'function') {
                        if (!activeFilterObj.filterFn(item)) return false;
                    }
                    // Fallback to Category match (Legacy behavior)
                    else {
                        // If no fn provided, assume key matches category/subcategory
                        if (item.category !== activeFilterObj.key && item.subcategory !== activeFilterObj.key) return false;
                    }
                }

                // B. Search Logic (Text Search)
                if (q) {
                    const haystack = [item.title, item.desc, item.tier, (item.tags || []).join(" ")].join(" ").toLowerCase();
                    if (!haystack.includes(q)) return false;
                }

                return true;
            });

            // 2. RENDER
            if (this.isBento) this.renderBento(filtered);
            else this.renderGrid(filtered);

            // 3. EFFECT
            setTimeout(() => this.bindMagneticCards(), 100);
        },

        // --- RENDERING ---

        renderChips() {
            if (!this.chipsContainer || !this.filters) return;

            this.chipsContainer.innerHTML = this.filters.map(f => {
                const isActive = this.state.filterKey === f.key ? "active" : "";
                return `<button class="nv-chip ${isActive}" data-key="${f.key}">
                            <span class="chip-icon">${f.icon}</span> 
                            ${f.label}
                        </button>`;
            }).join("");
        },

        renderGrid(items) {
            this.container.innerHTML = "";

            if (items.length === 0) {
                this.container.innerHTML = `<div class="nv-empty-state">Sonuç bulunamadı.</div>`;
                return;
            }

            // Check if we need Sectioned View (Catalog Mode)
            // Logic: If "all" is selected AND we have a defined CATEGORY ORDER global (Legacy Support)
            // We use the bridged globals: NV_MASSAGES_CATEGORY_ORDER etc.
            // But wait, the V2 System prefers flat lists filtered by tags. 
            // Let's keep the Sectioned View for "All" only if globals exist.

            // Determining Context from Data (heuristic)
            const isMassages = window.NV_MASSAGES && this.data === window.NV_MASSAGES;
            const orderGlobal = isMassages ? window.NV_MASSAGES_CATEGORY_ORDER : window.NV_HAMMAM_CATEGORY_ORDER;
            const labelGlobal = isMassages ? window.NV_MASSAGES_CATEGORY_LABELS : window.NV_HAMMAM_CATEGORY_LABELS;

            const showSections = (this.state.filterKey === "all" && orderGlobal && items.length > 5);

            if (showSections) {
                // SECTION RENDERER
                let html = "";
                orderGlobal.forEach(catKey => {
                    // Filter items that match this section key (subcategory or category)
                    const groupItems = items.filter(i => (i.subcategory === catKey || i.category === catKey));

                    if (groupItems.length > 0) {
                        const title = (labelGlobal && labelGlobal[catKey]) || catKey;
                        html += `
                        <div class="nv-catalog-section">
                            <div class="nv-section-header">
                                <h2 class="nv-section-title">${title}</h2>
                            </div>
                            <div class="nv-card-grid">
                                ${groupItems.map((item, idx) => this.buildCard(item, idx)).join('')}
                            </div>
                        </div>`;
                    }
                });
                this.container.innerHTML = html;

            } else {
                // FLAT LIST RENDERER
                this.container.innerHTML = `<div class="nv-card-grid">
                    ${items.map((item, idx) => this.buildCard(item, idx)).join('')}
                </div>`;
            }
        },

        renderBento(items) {
            if (items.length === 0) {
                this.container.innerHTML = `<div class="nv-empty-state">Sonuç bulunamadı.</div>`;
                return;
            }
            this.container.innerHTML = items.map((item, index) => {
                return this.buildBentoCard(item, this.getBentoClass(index), index);
            }).join('');
        },

        // --- HELPERS ---

        getPathPrefix() {
            if (window.SITE_ROOT) return window.SITE_ROOT;
            const depth = window.location.pathname.split('/').length - 2;
            return depth > 0 ? "../".repeat(depth) : "";
        },

        fixPath(path) {
            if (!path) return "";
            if (path.startsWith("http") || path.startsWith("//")) return path;
            // Remove leading slash if exists to avoid double slash
            const cleanPath = path.startsWith("/") ? path.substring(1) : path;
            return this.getPathPrefix() + cleanPath;
        },

        getBentoClass(index) {
            let bentoClass = "bento-box";
            const i = index % 10;
            if (index === 0) bentoClass = "bento-hero";
            else if (index === 1) bentoClass = "bento-tall";
            else if (i === 2 || i === 7) bentoClass = "bento-wide";
            else if (i === 5) bentoClass = "bento-tall";
            return bentoClass;
        },

        buildBentoCard(item, bentoClass, index) {
            // URL Generation (STATIC V5.5)
            const lang = (window.SITE_LANG || 'tr').toLowerCase();
            const cat = (item.categoryId || item.category || '').toLowerCase();
            let section = 'masajlar';
            if (cat.includes('hammam') || cat.includes('hamam')) section = 'hamam';
            else if (cat.includes('skin') || cat.includes('cilt') || cat.includes('face') || cat.includes('sothys')) section = 'cilt-bakimi';

            const slug = item.slug || item.id;
            const href = slug ? `/${lang}/${section}/${slug}.html` : `/tr/urunler/detay.html?product=${item.id}`;

            const imgPath = this.fixPath(item.img);

            return `
            <div class="bento-card ${bentoClass}" onclick="window.location='${href}'">
                <img class="bento-img" src="${imgPath}" loading="lazy" alt="${item.title}">
                <div class="bento-content">
                    <span class="bento-cat">${item.tier || 'SANTIS'}</span>
                    <h3 class="bento-title">${item.title}</h3>
                    <p class="bento-desc">${item.desc}</p>
                </div>
            </div>`;
        },

        buildCard(item, index) {
            // URL Generation (STATIC V5.5)
            const lang = (window.SITE_LANG || 'tr').toLowerCase();
            const cat = (item.categoryId || item.category || '').toLowerCase();
            let section = 'masajlar';
            if (cat.includes('hammam') || cat.includes('hamam')) section = 'hamam';
            else if (cat.includes('skin') || cat.includes('cilt') || cat.includes('face') || cat.includes('sothys')) section = 'cilt-bakimi';

            const slug = item.slug || item.id;
            const href = slug ? `/${lang}/${section}/${slug}.html` : `/tr/urunler/detay.html?product=${item.id}`;

            const imgPath = this.fixPath(item.img);

            const badge = item.tier || "";
            let badgeHTML = (badge === 'NEW' || badge === 'BEST' || badge === 'VIP')
                ? `<span class="badge ${badge.toLowerCase()}">${badge}</span>` : "";

            return `
            <div class="prod-card-v2 curtain-reveal" data-id="${item.id}" style="animation-delay: ${(index % 5) * 0.1}s;">
                <div class="prod-img-box">
                    ${badgeHTML}
                    <img src="${imgPath}" alt="${item.title}" loading="lazy">
                    <div class="quick-actions">
                        <button class="qa-btn">İncele</button>
                    </div>
                </div>
                <div class="prod-details">
                    <span class="prod-cat">${item.tier || 'SANTIS'}</span>
                    <a href="${href}" style="text-decoration:none; color:inherit;">
                        <h4>${item.title}</h4>
                    </a>
                    <p class="prod-desc">${item.desc}</p>
                    <div class="prod-bottom">
                        <span class="prod-price">${item.price ? item.price + ' €' : 'Bilgi Al'}</span>
                        <a href="${href}" class="prod-btn">İncele</a>
                    </div>
                </div>
            </div>`;
        },

        bindMagneticCards() {
            const cards = this.container.querySelectorAll('.prod-card-v2');
            cards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = ((y - centerY) / centerY) * -5; // Subtle
                    const rotateY = ((x - centerX) / centerX) * 5;
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                });
                card.addEventListener('mouseleave', () => {
                    card.style.transform = `perspective(1000px) rotateX(0) rotateY(0)`;
                });
            });
        },

        bindEvents() {
            if (this.chipsContainer) {
                this.chipsContainer.addEventListener("click", (e) => {
                    // Handle Button or Span click
                    const btn = e.target.closest('button');
                    if (btn) {
                        this.state.filterKey = btn.dataset.key;
                        this.renderChips();
                        this.applyState();
                    }
                });
            }

            if (this.searchInput) {
                this.searchInput.addEventListener("input", (e) => {
                    this.state.query = e.target.value;
                    this.applyState();
                });
            }
        }
    };

    // AUTO-INIT LOGIC
    document.addEventListener("DOMContentLoaded", () => {
        // WAIT for New Data Bridge Signal
        // If data is already ready, init immediately. Else wait for event.
        const start = () => {
            const path = window.location.pathname;
            if (path.includes("hammam") || path.includes("hamam")) Engine.init("HAMMAM");
            else if (path.includes("masaj")) Engine.init("MASSAGES");
            else if (path.includes("cilt")) Engine.init("SKINCARE");
            else if (path.includes("urunler")) Engine.init("PRODUCTS");
        };

        if (window.NV_DATA_READY) {
            start();
        } else {
            // Neuro-Sync Listener
            window.addEventListener('product-data:ready', () => {
                console.log("🧠 [CategoryEngine] Neuro-Sync Signal Received. Starting...");
                start();
            }, { once: true });
        }
    });

})();
