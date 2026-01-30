/**
 * SANTIS CATEGORY ENGINE v1.0 (Tier 2)
 * Unifies Hamam & Massage UI Logic + Cinematic Cards
 */

(function () {
    const SANTIS_PREFIX = "NV_";

    const Engine = {
        config: {
            containerId: "nvList",
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

            // 2. DOM Elements
            this.container = document.getElementById(this.config.containerId);
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
                    // Filter items for this category
                    const groupItems = items.filter(i => i.category === catKey);

                    if (groupItems.length > 0) {
                        const title = this.labels[catKey] || catKey;

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
                });

                this.container.innerHTML = html;

            } else {
                // 3. RENDER FLAT GRID (Filtered View)
                this.container.innerHTML = `<div class="nv-card-grid">
                    ${items.map((item, idx) => this.buildCard(item, idx)).join('')}
                </div>`;
            }

            // 4. APPLY 3D MAGNETIC EFFECTS
            setTimeout(() => this.bindMagneticCards(), 100);
        },

        bindMagneticCards() {
            const cards = this.container.querySelectorAll('.nv-card-service');

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
            // Tier 2: Cinematic Service Card
            const slug = item.slug || item.id; // Fallback to id if slug missing
            const href = `/service-detail.html?slug=${slug}`;
            const delay = (index % 5) * 0.1; // Stagger

            return `
            <a href="${href}" class="nv-card-service curtain-reveal" style="animation-delay: ${delay}s; display:block; text-decoration:none;">
                <div class="nv-service-img-box">
                    <img src="${item.img}" alt="${item.title}" loading="lazy">
                    <div class="nv-service-overlay">
                        <span class="nv-btn nv-btn-sm nv-btn-outline">Ritüeli İncele</span>
                    </div>
                </div>
                <div class="nv-service-info">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-size:12px; letter-spacing:1px; color:var(--gold); text-transform:uppercase;">${item.tier || 'SANTIS'}</span>
                        <span style="font-size:12px; color:rgba(255,255,255,0.6);">${item.duration}</span>
                    </div>
                    <h3 class="nv-title" style="font-size:22px; margin-bottom:10px;">${item.title}</h3>
                    <p class="nv-text" style="font-size:14px; line-height:1.6; color:rgba(255,255,255,0.7); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                        ${item.desc}
                    </p>
                </div>
            </a>
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
    });

})();
