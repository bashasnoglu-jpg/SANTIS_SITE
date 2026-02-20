/* ==========================================================================
   SANTIS MEDIA LIBRARY (Client-Side Asset Manager)
   ========================================================================== */

function escapeAttr(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const MediaLibrary = {
    registry: [],
    knownImages: new Set(),

    async init() {
        await this.loadRegistry();
        await this.scanProductUsage();
        this.render();
    },

    async loadRegistry() {
        try {
            const res = await fetch('../assets/data/media-registry.json?t=' + Date.now());
            if (res.ok) {
                this.registry = await res.json();
                this.registry.forEach(img => this.knownImages.add(img));
            }
        } catch (e) {
            console.warn("Media Registry not found, starting fresh.");
            this.registry = [];
        }
    },

    async scanProductUsage() {
        // Collect images currently in use by products
        const sources = [
            '/assets/data/products-sothys.json',
            '/assets/data/products-atelier.json'
        ];

        for (const src of sources) {
            try {
                const res = await fetch(src + '?t=' + Date.now());
                if (res.ok) {
                    const data = await res.json();
                    data.forEach(p => {
                        if (p.image) this.knownImages.add(p.image);
                    });
                }
            } catch (e) {
                console.error("Scan Error:", src, e);
            }
        }

        // Add Default Placeholders
        this.knownImages.add('/assets/img/placeholder.png');
        this.knownImages.add('/assets/img/luxury-placeholder.png');
    },

    render() {
        const grid = document.getElementById('media-grid');
        if (!grid) return;

        grid.innerHTML = '';
        const list = Array.from(this.knownImages).sort();

        list.forEach(img => {
            const card = document.createElement('div');
            card.className = 'media-card';
            card.style.cssText = "background:rgba(255,255,255,0.05); border:1px solid #333; border-radius:8px; overflow:hidden; position:relative; group";

            card.innerHTML = `
                <div style="height:120px; background:#000; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    <img src="${img.startsWith('/') ? img : '/' + img}" style="width:100%; height:100%; object-fit:cover; opacity:0.8; transition:opacity 0.3s;" data-fallback-src="/assets/img/placeholder.png">
                </div>
                <div style="padding:10px;">
                    <div style="font-size:10px; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeAttr(img)}">${img}</div>
                    <button class="btn-os sm" data-action="media-select" data-path="${escapeAttr(img)}" style="width:100%; margin-top:8px; border-color:#444;">Kopyala / Seç</button>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    async registerNew(path) {
        if (!path) return;

        // Clean path (remove leading slash or ../)
        let cleanPath = path.replace(/^(\.\.\/|\/)/, '');

        if (!this.knownImages.has(cleanPath)) {
            this.knownImages.add(cleanPath);
            this.registry.push(cleanPath);

            // Save to server (simulated via bridge)
            await bridgeSave('assets/data/media-registry.json', JSON.stringify(this.registry, null, 4));

            this.render();
            showToast("✅ Görsel Kaydedildi");
        } else {
            showToast("⚠️ Görsel zaten listede");
        }
    },

    select(path) {
        // If Modal is Open, put it there
        const inpImg = document.getElementById('inp-img');
        if (inpImg && document.getElementById('product-modal').classList.contains('active')) {
            inpImg.value = path;
            // Trigger change for preview
            inpImg.dispatchEvent(new Event('change'));
            inpImg.dispatchEvent(new Event('input'));
            showToast("✅ Görsel Seçildi");
        } else {
            // Copy to Clipboard
            navigator.clipboard.writeText(path).then(() => {
                showToast("📋 Kopyalandı");
            });
        }
    }
};

// Auto-Init if on Media View (or typically called by app.js)
// But app.js will load it.
