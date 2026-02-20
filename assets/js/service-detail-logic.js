/**
 * SANTIS — Service Detail Logic (CSP-Safe)
 * Extracted from service-detail.html inline script.
 * Handles: data loading, item binding, SEO injection, WhatsApp link,
 *          rich content, sensory atmosphere, soul note, audio guide.
 */
document.addEventListener("DOMContentLoaded", function () {

    // 1. Load Components
    if (typeof loadComp === "function") {
        if (document.getElementById("navbar-container")) loadComp("/components/navbar.html", "navbar-container");
        if (document.getElementById("footer-container")) loadComp("/components/footer.html", "footer-container");
    }

    // 2. Parse URL
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    var slug = params.get('slug') || params.get('s');

    // Auto-detect from filename if no params
    if (!id && !slug) {
        var path = window.location.pathname;
        // ignore index.html or empty paths
        if (path.split('/').pop() !== 'index.html' && path.split('/').pop() !== '') {
            slug = path.split('/').pop().replace('.html', '');
        }
    }

    // ═══════════════════════════════════════════════════
    // DATA READY GATE — Wait for data-bridge.js async fetch
    // ═══════════════════════════════════════════════════
    function initDetailPage() {
        if (!window.productCatalog || window.productCatalog.length === 0) {
            fetch('/assets/data/services.json?t=' + Date.now())
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    window.productCatalog = data;
                    initDetailPage(); // Retry with data
                })
                .catch(function (e) {
                    setText('cin-title', "Hizmet Bulunamadı");
                    setText('cin-desc', "Veri yüklenemedi. Lütfen sayfayı yenileyin.");
                });
            return;
        }

        // 3. Find Item
        var item = null;
        var searchId = window.SERVICE_ID || window.PAGE_GROUP_ID || id || slug;
        if (searchId) {
            item = window.productCatalog.find(function (p) { return p.id == searchId || p.slug == searchId; });
            // Fallback: case-insensitive
            if (!item) {
                var lower = searchId.toLowerCase();
                item = window.productCatalog.find(function (p) {
                    return (p.id && p.id.toLowerCase() === lower) ||
                        (p.slug && p.slug.toLowerCase() === lower);
                });
            }
            // Fallback: partial match
            if (!item) {
                var lower2 = searchId.toLowerCase();
                item = window.productCatalog.find(function (p) {
                    return (p.slug && (p.slug.toLowerCase().includes(lower2) || lower2.includes(p.slug.toLowerCase()))) ||
                        (p.id && (p.id.toLowerCase().includes(lower2) || lower2.includes(p.id.toLowerCase())));
                });
            }
        }

        // 4. Bind Data or 404
        if (!item) {
            setText('cin-title', "Hizmet Bulunamadı");
            setText('cin-desc', 'Aranan: "' + searchId + '" — ' + window.productCatalog.length + ' hizmet içinde bulunamadı.');
            return;
        }

        // --- DATA NORMALIZATION (Adapter Pattern) ---
        var lang = document.documentElement.lang || 'tr';
        // Fallback checks for content availability
        var content = {};
        if (item.content) {
            if (item.content[lang]) content = item.content[lang];
            else if (item.content['en']) content = item.content['en']; // fallback to EN
            else if (item.content['tr']) content = item.content['tr']; // fallback to TR
        }

        // UI DICTIONARY
        var ui = {
            tr: { duration: 'Süre', price: 'Fiyat', book: 'REZERVASYON YAP', back: 'KOLEKSİYONA DÖN', listen: 'Ritüeli Dinle', listening: 'Dinleniyor...', ideal: 'Kimler İçin?' },
            en: { duration: 'Duration', price: 'Price', book: 'BOOK NOW', back: 'BACK TO COLLECTION', listen: 'Listen Ritual', listening: 'Playing...', ideal: 'Ideal For?' },
            de: { duration: 'Dauer', price: 'Preis', book: 'JETZT BUCHEN', back: 'ZURÜCK', listen: 'Ritual Hören', listening: 'Spielt...', ideal: 'Ideal Für?' },
            fr: { duration: 'Durée', price: 'Prix', book: 'RÉSERVER', back: 'RETOUR', listen: 'Écouter', listening: 'Lecture...', ideal: 'Idéal Pour?' },
            ru: { duration: 'Длительность', price: 'Цена', book: 'ЗАБРОНИРОВАТЬ', back: 'НАZAД', listen: 'Слушать', listening: 'Играет...', ideal: 'Идеально для?' }
        };
        var t = ui[lang] || ui['en'];

        // Apply UI Labels
        var durationLabel = document.querySelector('.cin-meta-box:nth-child(1) .cin-label');
        if (durationLabel) durationLabel.innerText = t.duration;
        var priceLabel = document.querySelector('.cin-meta-box:nth-child(2) .cin-label');
        if (priceLabel) priceLabel.innerText = t.price;
        var bookBtn = document.getElementById('btn-whatsapp');
        if (bookBtn) bookBtn.innerText = t.book;
        var backBtn = document.querySelector('.cin-actions .cin-btn:not(.primary)');
        if (backBtn) backBtn.innerText = t.back;

        var title = content.title || item.name;
        var badge = item.tier || (item.tags && item.tags.length > 0 ? item.tags[0] : 'Santis Spa Series');
        var desc = content.intro || content.shortDesc || item.desc || "Detaylar hazırlanıyor...";
        var steps = content.steps || (item.details ? item.details.steps : null) || [];
        var effects = content.effects || (item.details ? item.details.effects : null) || '';
        var visualSrc = (item.media ? item.media.hero : null) || item.img || '/assets/img/hero-general.webp';
        var soulNote = item.soulNote || null;
        var audioGuide = item.audioGuide || null;

        // Registry Tracking (Phase 25)
        if (window.Registry) {
            window.Registry.track('view_service', {
                id: item.id,
                title: title,
                category: item.categoryId || item.category
            });
        }

        // --- SEO & META INJECTION ---
        document.title = title + ' • Santis Club';

        var metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = "description";
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = desc;

        var canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = "canonical";
            document.head.appendChild(canonical);
        }
        var baseUrl = window.location.href.split('?')[0];
        canonical.href = baseUrl + '?slug=' + (slug || id);

        var schemaScript = document.querySelector('script#ld-json-service');
        if (!schemaScript) {
            schemaScript = document.createElement('script');
            schemaScript.id = "ld-json-service";
            schemaScript.type = "application/ld+json";
            document.head.appendChild(schemaScript);
        }
        var schemaData = {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": title,
            "description": desc,
            "provider": {
                "@type": "Spa",
                "name": "Santis Club",
                "image": "https://santis-club.com/assets/img/logo-santis.png",
                "priceRange": "$$$"
            },
            "image": "https://santis-club.com/" + visualSrc,
            "url": window.location.href
        };
        if (item.price) {
            schemaData.offers = {
                "@type": "Offer",
                "priceCurrency": (item.price && item.price.currency === '€') ? 'EUR' : 'TRY',
                "price": (item.price && item.price.amount) ? item.price.amount : (item.price || 0),
                "availability": "https://schema.org/InStock"
            };
        }
        schemaScript.text = JSON.stringify(schemaData);

        // BINDING
        setText('cin-title', title);
        setText('cin-subtitle', badge.toUpperCase());
        setText('cin-desc', desc);

        var catName = (typeof getCatName === 'function') ? getCatName(item.categoryId || item.cat) : (item.categoryId || item.cat);
        setText('bread-cat', catName);

        // --- SOUL NOTE (Phase 16) ---
        if (soulNote) {
            var titleEl = document.getElementById('cin-desc');
            var soulEl = document.createElement('div');
            soulEl.className = 'cin-soul-note';
            soulEl.style.cssText = "margin-top:20px;padding-left:15px;border-left:2px solid var(--gold-primary,#d4af37);color:#888;font-style:italic;font-family:'Cinzel',serif;font-size:0.95rem;line-height:1.6;";
            soulEl.innerHTML = '<strong style="display:block;font-size:0.8rem;color:#666;font-family:\'Inter\',sans-serif;font-style:normal;margin-bottom:5px;text-transform:uppercase;letter-spacing:1px;">' + t.ideal + '</strong> ' + soulNote;
            if (titleEl && titleEl.parentNode) {
                titleEl.parentNode.insertBefore(soulEl, titleEl.nextSibling);
            }
        }

        // --- SENSORY ENGINE ---
        if (window.Atmosphere && item.sensory_dna) {
            var atmos = new Atmosphere();
            atmos.applyAtmosphere(item.sensory_dna);
        } else if (item.cultural_world) {
            document.body.classList.add('world-' + item.cultural_world);
        } else {
            document.body.classList.add('world-standard');
        }

        // Meta
        setText('val-benefit', content.idealFor || (item.details ? item.details.idealFor : null) || item.benefit || 'Genel Rahatlama');
        setText('val-usage', content.signature || item.usage || 'Standart Uygulama');
        setText('val-duration', (item.duration || 50) + " Dk");

        // Image
        var imgEl = document.getElementById('cin-img');
        if (imgEl) {
            var src = visualSrc;
            if (!src.includes('assets/') && !src.includes('http')) {
                src = '/assets/img/cards/' + src;
            }
            var loader = new Image();
            loader.onload = function () { imgEl.src = src; imgEl.style.opacity = 1; };
            loader.onerror = function () {
                var altSrc = src.replace('/img/cards/', '/img/products/');
                var loader2 = new Image();
                loader2.onload = function () { imgEl.src = altSrc; imgEl.style.opacity = 1; };
                loader2.onerror = function () {
                    imgEl.src = window.location.origin + '/assets/img/hero-general.webp';
                    imgEl.style.opacity = 1;
                };
                loader2.src = altSrc;
            };
            loader.src = src;
        }

        // Booking Action
        var btn = document.getElementById('btn-whatsapp');
        if (btn) {
            // Updated to use Booking Wizard (Phase 16)
            btn.onclick = function (e) {
                e.preventDefault();
                if (window.BOOKING_WIZARD) {
                    window.BOOKING_WIZARD.open(title);
                } else {
                    // Fallback if wizard not loaded
                    var msg = 'Merhaba, ' + title + ' için rezervasyon oluşturmak istiyorum.';
                    window.open('https://wa.me/905348350169?text=' + encodeURIComponent(msg), '_blank');
                }
            };
            btn.href = "javascript:void(0)";
        }

        // Audio Guide (Phase 17)
        if (audioGuide) {
            var actions = document.querySelector('.cin-actions');
            var audioBtn = document.createElement('button');
            audioBtn.className = 'cin-btn';
            audioBtn.style.cssText = "border-color:#d4af37;color:#d4af37;margin-right:15px;display:inline-flex;align-items:center;gap:8px;";
            audioBtn.innerHTML = '<span>' + t.listen + '</span> 🎧';
            audioBtn.onclick = function () {
                var audio = new Audio(audioGuide);
                audio.play().catch(function () { alert("Ses dosyası henüz hazır değil. (Demo)"); });
                audioBtn.innerHTML = '<span>' + t.listening + '</span> 🔊';
                audio.onended = function () { audioBtn.innerHTML = '<span>' + t.listen + '</span> 🎧'; };
            };
            if (actions) actions.insertBefore(audioBtn, actions.firstChild);
        }

        // Rich Content
        if (steps.length > 0 || effects) {
            var richHtml = '';
            if (steps.length > 0) {
                richHtml += '<div class="cin-rich-section"><h3 class="cin-rich-title">Ritüel Adımları</h3><ul class="cin-rich-steps">' +
                    steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>';
            }
            if (effects) {
                richHtml += '<div class="cin-rich-section"><h3 class="cin-rich-title">Etkileri</h3><p class="cin-rich-text">' + effects + '</p></div>';
            }
            var metaGrid = document.querySelector('.cin-meta-grid');
            var contentStage = document.querySelector('.cin-content-stage');
            if (richHtml && metaGrid && contentStage && !document.querySelector('.cin-rich-container')) {
                var container = document.createElement('div');
                container.className = 'cin-rich-container';
                container.innerHTML = richHtml;
                contentStage.insertBefore(container, metaGrid);
            }
        }
    } // end initDetailPage

    // ═══════════════════════════════════════════════════
    // DATA READY GATE: Wait for data-bridge.js
    // ═══════════════════════════════════════════════════
    if (window.NV_DATA_READY && window.productCatalog && window.productCatalog.length > 0) {
        initDetailPage();
    } else {
        var resolved = false;
        var onDataReady = function () {
            if (resolved) return;
            resolved = true;
            initDetailPage();
        };
        window.addEventListener('product-data:ready', onDataReady, { once: true });
        setTimeout(function () {
            if (!resolved) { resolved = true; initDetailPage(); }
        }, 5000);
    }
});

function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.innerText = text || '';
}
