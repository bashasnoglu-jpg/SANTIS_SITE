/**
 * SANTIS V5: THE FACTORY (Page Generation Engine)
 * Tek şablondan sonsuz sayfa üreten javascript motoru.
 */

class PageFactory {
    constructor() {
        this.apiBase = "/api/content";
        this.contentStage = document.getElementById("nv-dynamic-content");
        this.loader = document.getElementById("nv-page-loader");
    }

    async init() {
        // 1. URL'den slug'ı al
        const slug = this.getPseudoSlug();
        console.log(`🏭 Factory Started for: ${slug}`);

        if (!slug) {
            this.render404();
            return;
        }

        // 2. Veriyi Çek
        const data = await this.fetchProductData(slug);

        if (data) {

            // 3. Sayfayı İnşa Et
            this.renderPage(data);
            this.updateSEO(data);


            // FAZ 3: BRAIN ACTIVATION
            // await this.renderRecommendations(data);

            this.updateSEO(data);


            // FAZ 3: BRAIN ACTIVATION
            // await this.renderRecommendations(data);

            this.revealPage();
        } else {
            this.render404();
        }
    }

    getPseudoSlug() {
        // URL simülasyonu: ?product=aromaterapi-masaji
        const urlParams = new URLSearchParams(window.location.search);
        let slug = urlParams.get('product');
        return this.resolveSlug(slug);
    }

    resolveSlug(slug) {
        // 🛡️ URL ALIAS & FALLBACK SYSTEM
        const aliases = {
            'osmanli-ritueli': 'osmanli-hamam-gelenegi',
            'roman-bath': 'kese-ve-kopuk-masaji',
            'wabi-sabi': 'anti-stress-masaji',    // Fallback: Zen/Simplicity
            'thai-massage': 'kombine-masaj',      // Fallback: Includes Thai techniques
            'ayurveda-shirodhara': 'aromaterapi-masaji' // Fallback
        };
        return aliases[slug] || slug;
    }

    async fetchProductData(slug) {
        // A) Local fallback first for known pseudo items or offline use
        await this.ensureLocalCatalog();
        const localData = this.findLocalProduct(slug);
        if (localData) {
            console.log("🟢 [Factory] Local product matched:", slug);
            return localData;
        }

        // B) Remote fetch (API)
        try {
            const response = await fetch(`${this.apiBase}/products/${slug}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error("Factory Data Error:", error);
            return null;
        }
    }

    async ensureLocalCatalog() {
        // 1. Check if data is already ready
        if (window.NV_DATA_READY || (Array.isArray(window.productCatalog) && window.productCatalog.length > 0)) {
            return;
        }

        // 2. Wait for the Event (Neuro-Sync)
        return new Promise((resolve) => {
            const onReady = () => {
                console.log("🏭 [Factory] Data Ready Signal Received.");
                resolve();
            };

            window.addEventListener('product-data:ready', onReady, { once: true });

            // 3. Safety Timeout (Fallback)
            setTimeout(() => {
                if (!window.NV_DATA_READY) {
                    console.warn("🏭 [Factory] Data Check Timeout. Proceeding anyway.");
                    resolve();
                }
            }, 2000); // 2s max wait
        });
    }

    findLocalProduct(slug) {
        if (slug === "system-test-card") {
            return this.normalizeProduct({
                id: "system-test-card",
                slug: "system-test-card",
                title: "Santis System Check",
                name: "System Check",
                category: "Diagnostics",
                duration: 0,
                price: { amount: "", currency: "₺" },
                media: { hero: "/assets/img/cards/santis_card_hammam_v1.webp" },
                content: { tr: { shortDesc: "Test kartı" } }
            });
        }

        const pools = [
            window.NV_PRODUCTS_ALL,
            window.NV_PRODUCTS,
            window.productCatalog
        ].filter(Array.isArray);

        console.log("ℹ️ [Factory] Local pools sizes", {
            NV_PRODUCTS_ALL: Array.isArray(window.NV_PRODUCTS_ALL) ? window.NV_PRODUCTS_ALL.length : 0,
            NV_PRODUCTS: Array.isArray(window.NV_PRODUCTS) ? window.NV_PRODUCTS.length : 0,
            productCatalog: Array.isArray(window.productCatalog) ? window.productCatalog.length : 0
        });

        for (const pool of pools) {
            const hit = pool.find(
                (item) =>
                    item.slug === slug ||
                    item.id === slug
            );
            if (hit) return this.normalizeProduct(hit);
        }
        return null;
    }

    normalizeProduct(item) {
        const title = item.content?.tr?.title || item.title || item.name || "Santis Deneyimi";
        const shortDesc = item.content?.tr?.shortDesc || item.shortDesc || item.desc || "";
        const longDesc = item.content?.tr?.fullDesc || item.long_description || item.description || shortDesc;
        const category = item.category || item.categoryId || "Santis";
        const duration = item.duration || item.time || "";

        // Price normalizer
        let priceObj = { amount: "", currency: "₺" };
        if (typeof item.price === "object" && item.price !== null) {
            priceObj = {
                amount: item.price.amount || "",
                currency: item.price.currency || "₺"
            };
        } else if (item.price) {
            priceObj = { amount: item.price, currency: "₺" };
        }

        let cover =
            item.media?.cover ||
            item.media?.hero ||
            item.img ||
            item.image ||
            "/assets/img/cards/santis_card_hammam_v1.webp";

        // Normalize cover path
        if (cover.startsWith("/assets/")) {
            cover = "/" + cover;
        } else if (!cover.startsWith("/") && !cover.startsWith("http")) {
            cover = `/assets/img/cards/${cover}`;
        }

        return {
            id: item.id || item.slug,
            slug: item.slug || item.id,
            title,
            short_description: shortDesc,
            long_description: longDesc,
            category,
            duration,
            price: priceObj,
            moods: item.moods || item.tags || [],
            media: { cover },
            seo: {
                title,
                description: shortDesc || "Santis Club deneyimi"
            }
        };
    }

    renderPage(data) {
        // ATOMIC DESIGN BLOCKS

        const html = `
        <section class="nv-hero-split">
            <div class="nv-hero-visual">
                <img src="${data.media.cover}" 
                     alt="${data.title}" 
                     class="nv-hero-img"
                     fetchpriority="high">
            </div>
            
            <div class="nv-hero-content">
                <div class="nv-breadcrumbs">
                    <a href="${window.SantisRouter ? SantisRouter.localize('/tr/') : '/tr/'}">${window.SantisRouter && SantisRouter.detectLang() === 'en' ? 'Home' : 'Ana Sayfa'}</a> / 
                    <a href="${window.SantisRouter ? SantisRouter.localize('/tr/urunler/') : '/tr/urunler/'}">${window.SantisRouter && SantisRouter.detectLang() === 'en' ? 'PRODUCTS' : 'ÜRÜNLER'}</a> / 
                    <span>${data.title}</span>
                </div>

                <div class="nv-header-block">
                    <span class="nv-badge">${data.category.toUpperCase()}</span>
                    <h1 class="nv-title">${data.title}</h1>
                    <div class="nv-separator"></div>
                    <div class="nv-desc">${data.long_description || data.short_description}</div>
                </div>

                <div class="nv-details-grid">
                    <div class="nv-detail-item">
                        <span class="nv-label">Süre</span>
                        <span class="nv-value">${data.duration} Dakika</span>
                    </div>
                    <div class="nv-detail-item">
                        <span class="nv-label">Fiyat</span>
                        <span class="nv-value">${data.price.amount} ${data.price.currency}</span>
                    </div>
                     <div class="nv-detail-item">
                        <span class="nv-label">Mood</span>
                        <span class="nv-value">${data.moods ? data.moods.join(", ") : "Relax"}</span>
                    </div>
                </div>

                <div class="nv-actions">
                    <a href="https://wa.me/905348350169?text=Rezervasyon: ${data.title}" target="_blank" class="nv-btn nv-btn-primary">
                        Rezervasyon Yap
                    </a>
                </div>
            </div>
        </section>
        `;


        this.contentStage.innerHTML = html;
    }

    // --- FAZ 3: THE BRAIN (Recommendation Engine) ---
    async renderRecommendations(currentProduct) {
        try {
            // Tüm ürünleri çek (Gerçek hayatta backend filter kullanılır)
            const response = await fetch(`${this.apiBase}/products`);
            const allProducts = await response.json();

            if (!allProducts || allProducts.length === 0) return;

            // ALGORİTMA: Mood Match & Kategori
            const recommendations = allProducts
                .filter(p => p.id !== currentProduct.id) // Kendini hariç tut
                .map(p => {
                    let score = 0;
                    // Kural 1: Aynı Kategori (+5 Puan)
                    if (p.category === currentProduct.category) score += 5;

                    // Kural 2: Ortak Mood (+3 Puan)
                    if (p.moods && currentProduct.moods) {
                        const commonMoods = p.moods.filter(m => currentProduct.moods.includes(m));
                        score += commonMoods.length * 3;
                    }

                    return { product: p, score: score };
                })
                .sort((a, b) => b.score - a.score) // Puana göre sırala
                .slice(0, 3); // İlk 3'ü al

            if (recommendations.length > 0) {
                this.appendRecommendationSection(recommendations.map(r => r.product));
            }

        } catch (e) {
            console.warn("Brain Error:", e);
        }
    }

    appendRecommendationSection(products) {
        let cardsHtml = products.map(p => `
            <a href="?product=${p.slug}" class="nv-rec-card">
                <div class="nv-rec-img">
                    <img src="${p.media.cover}" alt="${p.title}" loading="lazy">
                </div>
                <div class="nv-rec-info">
                    <h4>${p.title}</h4>
                    <span>${p.price.amount} ${p.price.currency}</span>
                </div>
            </a>
        `).join("");

        const sectionHtml = `
            <section class="nv-recommendations">
                <div class="nv-rec-header">
                    <h3>Bunları da Sevebilirsiniz</h3>
                </div>
                <div class="nv-rec-grid">
                    ${cardsHtml}
                </div>
            </section>
        `;

        this.contentStage.insertAdjacentHTML('beforeend', sectionHtml);
    }

    updateSEO(data) {
        document.title = data.seo.title;
        document.querySelector('meta[name="description"]').setAttribute("content", data.seo.description);
    }

    revealPage() {
        this.loader.style.display = 'none';
        this.contentStage.style.opacity = 1;
    }

    render404() {
        this.loader.style.display = 'none';
        this.contentStage.innerHTML = "<h1>404 - Ürün Bulunamadı</h1>";
        this.contentStage.style.opacity = 1;
    }
}
