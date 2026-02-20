/**
 * SANTIS CATEGORY ENGINE v1.1 (Tier 2 + Bento Groups)
 * Unifies Hamam & Massage UI Logic + Cinematic Cards + Bento Sections
 */

(function () {
    const SANTIS_PREFIX = "NV_";

    const Engine = {
        config: {
            containerId: "nvList", // Default
            bentoId: "bento-grid", // NEW: Bento Target
            searchId: "nvSearch",
            chipsId: "nvChips",
            showPrice: false
        },

        init(context) {
            console.log(`🎬 Category Engine Init: ${context}`);

            // 1. Data Source Determination
            const dataKey = `${SANTIS_PREFIX}${context.toUpperCase()}`;
            const labelsKey = `${dataKey}_CATEGORY_LABELS`;
            const orderKey = `${dataKey}_CATEGORY_ORDER`;

            this.data = window[dataKey] || [];
            this.labels = window[labelsKey] || {};
            this.order = window[orderKey] || ["all"]; // 'all' is default

            // 2. DOM Elements (Auto-detect Bento)
            this.container = document.getElementById(this.config.bentoId) || document.getElementById(this.config.containerId);
            this.isBento = !!document.getElementById(this.config.bentoId); // Flag

            this.searchInput = document.getElementById(this.config.searchId);
            this.chipsContainer = document.getElementById(this.config.chipsId);

            if (!this.container) {
                console.warn("Category Engine: Container not found.");
                return;
            }

            // 3. State
            this.state = {
                filter: "all",
                query: ""
            };

            // 4. Bind & Render
            this.renderChips();
            this.applyState();
            this.bindEvents();
        },

        // --- Logic ---

        normalize(str) {
            return (str || "").toString().toLowerCase().trim();
        },

        applyState() {
            const q = this.normalize(this.state.query);

            let filtered = this.data.filter(item => {
                // Filter Logic
                if (this.state.filter !== "all" && item.category !== this.state.filter) return false;

                // Search Logic
                if (!q) return true;
                const haystack = [item.title, item.desc, item.tier, (item.tags || []).join(" ")].join(" ").toLowerCase();
                return haystack.includes(q);
            });

            this.renderGrid(filtered);
        },

        // --- Rendering ---

        renderChips() {
            if (!this.chipsContainer) return;

            this.chipsContainer.innerHTML = this.order.map(key => {
                const label = this.labels[key] || (key === "all" ? "Tümü" : key);
                const isActive = this.state.filter === key ? "active" : "";
                return `<button class="nv-chip ${isActive}" data-key="${key}">${label}</button>`;
            }).join("");
        },

        renderGrid(items) {
            // 1. Clear Container
            this.container.innerHTML = "";

            if (items.length === 0) {
                this.container.innerHTML = `<div style="text-align:center; padding:40px; color:#666;">Sonuç bulunamadı.</div>`;
                return;
            }

            // 2. CHECK: Catalog Mode (Grouped View)
            // Condition: Filter is 'all' AND we have an Order defined AND we have processed at least one group
            const isCatalogMode = (this.state.filter === "all" && this.order && this.order.length > 0 && this.order[0] !== "all");

            if (isCatalogMode) {
                // RENDER GROUPS
                let html = "";

                this.order.forEach(catKey => {
                    const groupItems = items.filter(i => i.category === catKey);

                    if (groupItems.length > 0) {
                        const title = this.labels[catKey] || catKey;

                        if (this.isBento) {
                            // --- BENTO GROUP ---
                            // 1. Header (Span 12)
                            html += `
                            <div class="bento-header" style="grid-column: span 12; margin-top: 60px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                                <h2 style="font-family:'Playfair Display', serif; font-size:32px; color:#fff; letter-spacing:1px; margin:0;">
                                    ${title}
                                </h2>
                            </div>
                            `;
                            // 2. Items (Reset Pattern per Group)
                            html += groupItems.map((item, idx) => this.buildBentoCard(item, this.getBentoClass(idx), idx)).join('');

                        } else {
                            // --- STANDARD CARD GROUP ---
                            html += `
                            <div class="nv-catalog-section" style="margin-bottom:60px;">
                                <div class="nv-section-header" style="text-align:center; margin-bottom:30px; position:relative;">
                                    <h2 class="nv-section-title" style="font-size:24px; letter-spacing:2px; text-transform:uppercase; display:inline-block; padding-bottom:10px; border-bottom:1px solid var(--gold); color:#fff;">
                                        ${title}
                                    </h2>
                                </div>
                                <div class="nv-card-grid">
                                    ${groupItems.map((item, idx) => this.buildCard(item, idx)).join('')}
                                </div>
                            </div>
                            `;
                        }
                    }
                });

                this.container.innerHTML = html;

            } else {
                // 3. RENDER FLAT GRID (Filtered View)
                if (this.isBento) {
                    this.renderBento(items);
                } else {
                    this.container.innerHTML = `<div class="nv-card-grid">
                        ${items.map((item, idx) => this.buildCard(item, idx)).join('')}
                    </div>`;
                }
            }

            // 4. APPLY 3D MAGNETIC EFFECTS
            setTimeout(() => this.bindMagneticCards(), 100);
        },

        // --- NEW: BENTO RENDERER ---
        renderBento(items) {
            console.log("🍱 Rendering Bento Grid (Flat)...");
            this.container.innerHTML = items.map((item, index) => {
                return this.buildBentoCard(item, this.getBentoClass(index), index);
            }).join('');
        },

        getBentoClass(index) {
            // PATTERN LOGIC
            // 0: Hero (8x2) - 1: Tall (4x2)
            // 2: Wide (8x1) - 3: Box (4x1)
            let bentoClass = "bento-box";
            const i = index % 10;

            if (index === 0) bentoClass = "bento-hero";
            else if (index === 1) bentoClass = "bento-tall";
            else if (i === 2 || i === 7) bentoClass = "bento-wide";
            else if (i === 5) bentoClass = "bento-tall";

            return bentoClass;
        },

        buildBentoCard(item, bentoClass, index) {
            const root = window.SITE_ROOT || '';
            // New URL Logic: Prefer Slug if exists, else ID
            const urlParam = item.slug ? `slug=${item.slug}` : `id=${item.id}`;

            // DYNAMIC DESTINATION: Use generic service-detail.html instead of hardcoded masajlar
            const href = `${root}service-detail.html?${urlParam}`;

            return `
            <div class="bento-card ${bentoClass}" onclick="window.location='${href}'">
                <img class="bento-img" src="${item.img}" loading="lazy" alt="${item.title}">
                <div class="bento-content">
                    <span class="bento-cat">${item.tier || 'SANTIS'}</span>
                    <h3 class="bento-title">${item.title}</h3>
                    <p class="bento-desc">${item.desc}</p>
                </div>
            </div>
            `;
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

                    // Max tilt: 8deg
                    const rotateX = ((y - centerY) / centerY) * -8;
                    const rotateY = ((x - centerX) / centerX) * 8;

                    // Apply Transform
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

                    // Glare Effect (Optional, via CSS var)
                    card.style.setProperty('--card-mouse-x', `${x}px`);
                    card.style.setProperty('--card-mouse-y', `${y}px`);
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
                });
            });
        },

        buildCard(item, index) {
            // UNIFIED CARD V3 (Compatible with modules/cards.css)
            const root = window.SITE_ROOT || '';
            // New URL Logic: Prefer Slug if exists, else ID
            const urlParam = item.slug ? `slug=${item.slug}` : `id=${item.id}`;
            const href = `${root}service-detail.html?${urlParam}`;

            const delay = (index % 5) * 0.1;
            const badge = item.tier || ""; // Assuming tier holds badge info like 'NEW'

            let badgeHTML = "";
            if (badge === 'NEW' || badge === 'BEST' || badge === 'VIP') {
                badgeHTML = `<span class="badge ${badge === 'NEW' ? 'new' : 'best'}">${badge}</span>`;
            }

            return `
            <div class="prod-card-v2 curtain-reveal" data-id="${item.id}" style="animation-delay: ${delay}s;">
                <div class="prod-img-box">
                    ${badgeHTML}
                    <img src="${item.img}" alt="${item.title}" loading="lazy">
                    <div class="quick-actions">
                        <button class="qa-btn">Hızlı Bakış</button>
                    </div>
                </div>
                <div class="prod-details">
                    <span class="prod-cat">${item.tier || 'SANTIS'}</span>
                    <h4>${item.title}</h4>
                    <p class="prod-desc">${item.desc}</p>
                    <div class="prod-bottom">
                        <span class="prod-price">${item.price ? item.price + ' €' : 'Bilgi Al'}</span>
                        <a href="${href}" class="prod-btn">İncele</a>
                    </div>
                </div>
            </div>
            `;
        } // End buildCard

        , bindEvents() {
            // Chips
            if (this.chipsContainer) {
                this.chipsContainer.addEventListener("click", (e) => {
                    if (e.target.tagName === "BUTTON") {
                        this.state.filter = e.target.dataset.key;
                        this.renderChips(); // Re-render to update active state
                        this.applyState();
                    }
                });
            }

            // Search
            if (this.searchInput) {
                this.searchInput.addEventListener("input", (e) => {
                    this.state.query = e.target.value;
                    this.applyState();
                });
            }
        }
    };

    // Auto Init based on URL
    document.addEventListener("DOMContentLoaded", async () => {
        // Wait for data if loader exists
        if (window.NV_DATA_READY_PROMISE) {
            await window.NV_DATA_READY_PROMISE;
        }

        const path = window.location.pathname;
        if (path.includes("hammam") || path.includes("hamam")) Engine.init("HAMMAM");
        else if (path.includes("masaj")) Engine.init("MASSAGES");
        else if (path.includes("cilt")) Engine.init("SKINCARE");
        else if (path.includes("urunler")) Engine.init("PRODUCTS");
    });

})();
