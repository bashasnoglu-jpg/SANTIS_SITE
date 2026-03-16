/**
 * 🎯 THE QUANTUM DETAIL ASSISTANT (product-loader.js)
 * Linkleri yakalar, iksiri bulur ve Sovereign Odayı aydınlatır.
 * v1.0 — 2026-03-09 | Santis Ultra Card Engine V8 ekosistemi
 */
const QuantumDetailAssistant = {

    async init() {
        console.log('⚡ [Quantum Assistant] Sovereign Detay Odası Uyanıyor...');

        const params = new URLSearchParams(window.location.search);
        const rawId = params.get('id') || params.get('slug') || '';

        // Bilet yoksa Mağazaya yönlendir
        if (!rawId) {
            return window.location.href = '/tr/urunler/index.html';
        }

        // ID temizliği — .webp .jpg .html uzantılarını temizle
        const targetId = rawId
            .replace(/\.(webp|jpg|jpeg|png|html)$/i, '')
            .toLowerCase()
            .trim();

        // Önceden global cache var mı? (V8 engine zaten çekmiş olabilir)
        const cached = window.SovereignDataMatrix || window.productCatalog || null;
        if (cached && cached.length) {
            const product = this._find(cached, targetId);
            if (product) return this.render(product);
        }

        // Cache yoksa direkt fetch
        try {
            const res = await fetch('/assets/data/services.json?v=' + Date.now());
            const data = await res.json();

            // Cache'e yaz (V8 ekosistemle uyumluluk)
            window.SovereignDataMatrix = data;

            const product = this._find(data, targetId);
            if (product) this.render(product);
            else this.renderError(targetId);

        } catch (err) {
            console.error('🚨 [Quantum Assistant] Veri çekilemedi:', err);
            this.renderError('bağlantı hatası');
        }
    },

    /** Fuzzy Arama — ID, Slug veya Görsel adından eşleşme */
    _find(data, targetId) {
        return data.find(p => {
            const pId = (p.id || '').toLowerCase().trim();
            const pSlug = (p.slug || '').toLowerCase().trim();
            const pImage = (p.image || '').toLowerCase();

            if (pId === targetId || pSlug === targetId) return true; // kesin
            if (targetId.length > 4 && pImage.includes(targetId)) return true; // görsel adı
            if (pId && targetId.includes(pId) && pId.length > 4) return true; // kısmi
            return false;
        });
    },

    render(p) {
        const title = p.title || p.name || 'Sovereign Özel İksir';
        const price = parseFloat(p.price_eur || 0);
        const imgUrl = (p.image && p.image.length > 5)
            ? p.image
            : '/assets/img/cards/santis_card_massage_lux.webp';

        // SEO: sayfa başlığı
        document.title = title + ' | Santis Club';

        // Gizli SEO h1
        const seoH1 = document.getElementById('detail-title-seo');
        if (seoH1) seoH1.textContent = title + ' — Santis Club Sovereign Ritüeli';

        // DOM doldurma
        const titleEl = document.getElementById('detail-title');
        const catEl = document.getElementById('detail-category');
        const descEl = document.getElementById('detail-desc');
        const priceEl = document.getElementById('detail-price');
        const imgEl = document.getElementById('detail-image');

        if (titleEl) titleEl.textContent = title;
        if (catEl) catEl.textContent = (p.category || 'Sovereign Koleksiyon')
            .replace(/-/g, ' ').toUpperCase();
        if (descEl) descEl.innerHTML = p.description
            || 'Bu eşsiz ritüel hakkında detaylı bilgi için Sovereign uzmanlarımızla iletişime geçin.';
        if (priceEl) priceEl.textContent = price > 0 ? '€' + price : 'VIP';
        if (imgEl) {
            imgEl.src = imgUrl;
            imgEl.alt = title;
        }

        // Işıkları Yak — opacity: 0 → 1
        const stage = document.getElementById('nv-dynamic-content');
        if (stage) requestAnimationFrame(() => { stage.style.opacity = '1'; });

        // Rezerve Et butonu
        const btn = document.getElementById('detail-vault-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                const item = { ...p, price_eur: price, title, image: imgUrl, isProduct: true };
                if (window.SovereignVault) return window.SovereignVault.open(item);
                if (window.CheckoutVault) return window.CheckoutVault.open(item);
                if (window.BoutiqueQuickView) return window.BoutiqueQuickView.open(item);
                // Son fallback: WhatsApp
                const wa = 'https://wa.me/905348350169?text=' +
                    encodeURIComponent('Merhaba, ' + title + ' ritüeli hakkında bilgi almak istiyorum.');
                window.open(wa, '_blank');
            });
        }

        console.log('[Quantum Assistant] ✅ Sovereign Odası aydınlatıldı:', title);
    },

    renderError(targetId) {
        document.title = 'Kayıp Formül | Santis Club';
        const stage = document.getElementById('nv-dynamic-content');
        if (!stage) return;
        stage.innerHTML = [
            '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem">',
            '  <div>',
            '    <div style="width:64px;height:64px;border:1px solid rgba(255,255,255,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:1.5rem">🗝️</div>',
            '    <h1 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:2rem;margin-bottom:1rem">Gizli Formül Aranıyor</h1>',
            '    <p style="color:#888;margin-bottom:2rem">Aradığınız ritüel (' + targetId + ') Sovereign kasasında güncellenmektedir.</p>',
            '    <a href="/tr/urunler/index.html" style="display:inline-block;padding:.875rem 2.5rem;border:1px solid rgba(255,255,255,.15);color:#fff;text-decoration:none;font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;transition:all .3s" ',
            '       onmouseover="this.style.borderColor=\'#D4AF37\';this.style.color=\'#D4AF37\'" ',
            '       onmouseout="this.style.borderColor=\'rgba(255,255,255,.15)\';this.style.color=\'#fff\'">MAĞAZAYA DÖN</a>',
            '  </div>',
            '</div>'
        ].join('');
        stage.style.opacity = '1';
    }
};

document.addEventListener('DOMContentLoaded', () => QuantumDetailAssistant.init());
