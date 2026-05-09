/**
 * 👑 SANTIS OS - SOVEREIGN BOUTIQUE V3.0
 * Modular Department Architecture + Intersection Observer + Ghost Interactivity
 */

class SovereignBoutique {
    constructor() {
        this.rootMatrix = document.getElementById('boutique-root-matrix');
        this.apiEndpoint = '/assets/data/boutique-matrix.json';
        this.departments = new Map();
        this.observer = null;
        this.vaultDebounce = false;

        this.categoryTitles = {
            'terapi-yaglari': 'Sovereign Terapi Yağları',
            'hamam-banyo': 'Hamam ve Arınma Ritüelleri',
            'ambiyans': 'Santis Signature Ambiyans'
        };

        if (this.rootMatrix) {
            this.init();
        }
    }

    async init() {
        try {
            console.log("🛍️ [Sovereign Boutique] Boot sequence initiated...");
            
            // 1. Fetch JSON Database
            const res = await fetch(this.apiEndpoint);
            if (!res.ok) throw new Error("Matrix Database Unavailable");
            const data = await res.json();
            
            // 2. Group by Category (Department Allocation)
            this.groupByCategory(data.products || []);
            
            // 3. Render Skeletons & Initialize Eye
            this.renderModularSkeletons();
            this.initIntersectionEye();

        } catch (error) {
            console.error("🛑 [Sovereign Boutique] Initialization Failed:", error);
            this.rootMatrix.innerHTML = `<p class="text-santis-gold text-center">Mağazaya şu an ulaşılamıyor. Lütfen resepsiyon ile görüşün.</p>`;
        }
    }

    groupByCategory(products) {
        products.forEach(p => {
            const cat = p.category || 'diger';
            if (!this.departments.has(cat)) {
                this.departments.set(cat, []);
            }
            this.departments.get(cat).push(p);
        });
    }

    renderModularSkeletons() {
        this.rootMatrix.innerHTML = '';
        this.departments.forEach((products, catKey) => {
            const friendlyName = this.categoryTitles[catKey] || catKey.replace('-', ' ').toUpperCase();
            
            const deptContainer = document.createElement('div');
            deptContainer.className = 'boutique-department-module';
            deptContainer.id = `dept-${catKey}`;
            deptContainer.dataset.category = catKey;
            
            // Inject header but leave grid empty for Hydration Phase
            deptContainer.innerHTML = `
                <div class="boutique-department-header">
                    <h2>${friendlyName}</h2>
                </div>
                <div class="boutique-grid" id="grid-${catKey}">
                    <!-- Skeleton Slots -->
                </div>
            `;
            
            this.rootMatrix.appendChild(deptContainer);
        });
    }

    initIntersectionEye() {
        // Observer with 500px prefetch root margin as requested by Kaptan
        const options = {
            root: null,
            rootMargin: '500px',
            threshold: 0.01
        };

        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const catKey = el.dataset.category;
                    
                    if (catKey && !el.dataset.hydrated) {
                        this.hydrateDepartment(catKey, el);
                        el.dataset.hydrated = 'true';
                        // Stop observing once hydrated to maintain O(1) ops
                        observer.unobserve(el);
                    }
                }
            });
        }, options);

        const modules = this.rootMatrix.querySelectorAll('.boutique-department-module');
        modules.forEach(m => this.observer.observe(m));
    }

    hydrateDepartment(catKey, deptContainer) {
        console.log(`💧 [Sovereign Boutique] JIT Hydrating: ${catKey}`);
        const products = this.departments.get(catKey);
        const grid = deptContainer.querySelector(`#grid-${catKey}`);
        
        if (!products || !grid) return;

        // Construct HTML for all products in this department
        let htmlBuffer = '';
        products.forEach(item => {
            const displayTitle = escapeHtml(item.title || 'Sovereign Selection');
            const imgTarget = escapeAttribute((item.image && item.image.length > 5) ? item.image : '/assets/img/cards/santis_card_massage_lux.webp');
            const productId = escapeAttribute(item.id || '');
            const productPrice = escapeAttribute(item.price || '');
            
            htmlBuffer += `
                <article class="boutique-card" data-product-id="${productId}">
                    <div class="boutique-img-wrapper">
                        ${item.badge ? `<span class="boutique-badge">${escapeHtml(item.badge)}</span>` : ''}
                        <img src="${imgTarget}" alt="${displayTitle}" loading="lazy" decoding="async">
                        
                        <!-- Ghost Interactivity Wrapper -->
                        <div class="boutique-ghost-cta-wrapper">
                            <button class="boutique-add-bag" data-id="${productId}" data-title="${displayTitle}" data-price="${productPrice}">Sovereign Çantaya Ekle</button>
                        </div>
                    </div>
                    
                    <div class="boutique-content">
                        <h3 class="boutique-title">${displayTitle}</h3>
                        <span class="boutique-meta">${escapeHtml(item.meta || '')}</span>
                        <p class="boutique-description">${escapeHtml(item.description || '')}</p>
                        <span class="boutique-price">${escapeHtml(item.price || 'Fiyat Alınız')}</span>
                    </div>
                </article>
            `;
        });

        grid.innerHTML = htmlBuffer;

        // Apply Ghost Interactivity Pattern (Bypass Tailwind/Native CSS issues)
        this.bindGhostInteractions(grid);
    }

    bindGhostInteractions(gridElement) {
        const cards = gridElement.querySelectorAll('.boutique-card');
        
        cards.forEach(card => {
            const imgWrapper = card.querySelector('.boutique-img-wrapper');
            const ctaWrapper = card.querySelector('.boutique-ghost-cta-wrapper');
            const addBtn = card.querySelector('.boutique-add-bag');

            // 1. Hover Dynamics (Hardware Accelerated)
            if (imgWrapper && ctaWrapper) {
                card.addEventListener('mouseenter', () => {
                    ctaWrapper.style.transform = 'translateY(0)';
                });
                card.addEventListener('mouseleave', () => {
                    ctaWrapper.style.transform = 'translateY(100%)';
                });
            }

            // 2. Sovereign Checkout Vault Bridge (with Debounce)
            if (addBtn) {
                addBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.vaultDebounce) return;
                    this.vaultDebounce = true;

                    const pTitle = addBtn.dataset.title;
                    const pPrice = addBtn.dataset.price;
                    console.log(`💎 [Boutique Bridge] Transferring to Vault: ${pTitle} (${pPrice})`);

                    // Trigger global Santis Modal logic
                    if (window.SovereignVault && typeof window.SovereignVault.open === 'function') {
                        window.SovereignVault.open({ isProduct: true, productTitle: pTitle });
                    } else if (typeof window.openReservationModal === 'function') {
                        // Fallback to legacy Reservation Modal
                        window.openReservationModal(pTitle + " (Sipariş Talebi)");
                    } else {
                        alert(`Ürün çantaya eklendi: ${pTitle}. İşlemi tamamlamak için Whatsapp hattımızla görüşebilirsiniz.`);
                    }

                    // Debounce release
                    setTimeout(() => { this.vaultDebounce = false; }, 1000);
                });
            }
        });
    }
}

// Auto-boot if not module blocked
document.addEventListener('DOMContentLoaded', () => {
    window.SantisBoutiqueEngine = new SovereignBoutique();
});

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
}
