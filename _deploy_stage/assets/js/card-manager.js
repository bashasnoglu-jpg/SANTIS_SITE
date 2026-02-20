/**

 * SANTIS CARD MANAGER & QUICK VIEW SYSTEM v1.0

 * Handles "Quick View" modal logic for standardized cards (.prod-card-v2) * SANTIS CARD MANAGER (Effects & Interaction)

 * Requires: assets/css/modules/cards.css

 * Data Source: window.productCatalog (from product-data.js) OR fallback data

 */



document.addEventListener("DOMContentLoaded", () => {

    initQuickView();

    // 🧠 Neuro-Sync Listener (Debug/Refresh)
    window.addEventListener('product-data:ready', (e) => {
        console.log(`🧠 [CardManager] Catalog Refreshed: ${e.detail ? e.detail.count : '?'} items`);
    });

});



function initQuickView() {

    // 1. INJECT MODAL HTML IF MISSING

    if (!document.getElementById('qv-overlay')) {

        const modalHTML = `

        <div id="qv-overlay" class="qv-overlay">

            <div class="qv-modal">

                <button class="qv-close" id="qv-close">&times;</button>

                <div class="qv-content">

                    <div class="qv-image">

                        <img id="qv-img" src="" alt="">

                        <span id="qv-badge" class="badge"></span>

                    </div>

                    <div class="qv-details">

                        <span class="prod-cat" id="qv-cat">CATEGORY</span>

                        <h2 id="qv-title">Product Title</h2>

                        <p class="qv-desc" id="qv-desc">Description goes here...</p>

                        

                        <div class="qv-meta">

                            <div class="qv-benefit" id="qv-benefit-row">

                                <strong>Fayda:</strong> <span id="qv-benefit">--</span>

                            </div>

                            <div class="qv-use" id="qv-use-row">

                                <strong>Kullanım:</strong> <span id="qv-use">--</span>

                            </div>

                            <div class="qv-dur" id="qv-dur-row" style="display:none;">

                                <strong>Süre:</strong> <span id="qv-dur">--</span>

                            </div>

                        </div>



                        <div class="prod-bottom">

                            <span class="prod-price" id="qv-price">--</span>

                            <a id="qv-btn" href="#" target="_blank" class="nv-btn nv-btn-primary">WhatsApp Sipariş</a>

                        </div>

                    </div>

                </div>

            </div>

        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

    }



    // 2. SETUP EVENT LISTENERS

    const qvOverlay = document.getElementById('qv-overlay');

    const qvClose = document.getElementById('qv-close');



    const closeQv = () => {

        qvOverlay.classList.remove('active');

        document.body.style.overflow = '';

    };



    if (qvClose) qvClose.addEventListener('click', closeQv);



    if (qvOverlay) {

        qvOverlay.addEventListener('click', (e) => {

            if (e.target === qvOverlay) closeQv();

        });

    }


    // LISTENER DELEGATION FOR ALL GRIDS
    document.body.addEventListener('click', (e) => {
        // Whole-card click opens detail link (preferred "İncele")
        const card = e.target.closest('.prod-card-v2');
        if (card && !e.target.classList.contains('qa-btn') && !e.target.closest('a')) {
            const detailBtn = card.querySelector('.prod-btn');
            if (detailBtn && detailBtn.href) {
                e.preventDefault();
                window.location.href = detailBtn.href;
                return;
            }
        }

        if (e.target.classList.contains('qa-btn')) {
            const card = e.target.closest('.prod-card-v2');
            if (!card) return;


            const pid = card.dataset.id;



            // Try to find in global catalog first

            let item = null;



            // 1. PRODUCTS

            if (window.productCatalog) {

                item = window.productCatalog.find(p => p.id == pid || p.id == parseInt(pid));

            }



            // 2. SERVICES (HAMMAM, MASSAGE, SKINCARE)

            if (!item) {

                const sources = [window.NV_HAMMAM, window.NV_MASSAGES, window.NV_SKINCARE];

                for (const source of sources) {

                    if (Array.isArray(source)) {

                        // ROBUST ID CHECK: Compare as strings

                        item = source.find(s => String(s.id) === String(pid) || (s.slug && s.slug === pid));

                        if (item) break;

                    }

                }

            }





            if (!item) {

                console.warn("Card Manager: Item not found:", pid);

                return;

            }



            console.log("Card Manager: Opening Quick View for", item);

            openQv(item);

        }

    });

}



function openQv(p) {

    const qvOverlay = document.getElementById('qv-overlay');



    // IMAGE HANDLING (Handle both filename-only and full-path)

    let finalSrc = "";

    if (p.img && (p.img.startsWith('/assets') || p.img.startsWith('http'))) {

        finalSrc = p.img;

    } else if (p.img) {

        finalSrc = `/assets/img/cards/${p.img}`;

    }

    document.getElementById('qv-img').src = finalSrc;



    // TEXT

    document.getElementById('qv-title').innerText = p.name ? (p.name.tr || p.name) : "Başlık Yok";

    document.getElementById('qv-cat').innerText = (typeof getCatName === 'function') ? getCatName(p.cat) : p.cat;

    document.getElementById('qv-desc').innerText = p.desc ? (p.desc.tr || p.desc) : "";

    document.getElementById('qv-price').innerText = p.price || "Fiyat Sorunuz";



    // META FIELDS (Handle Product vs Service differences)

    const benefitEl = document.getElementById('qv-benefit');

    const useEl = document.getElementById('qv-use');

    const durEl = document.getElementById('qv-dur');



    // Reset displays

    document.getElementById('qv-benefit-row').style.display = 'block';

    document.getElementById('qv-use-row').style.display = 'block';

    document.getElementById('qv-dur-row').style.display = 'none';



    if (p.benefit) {

        benefitEl.innerText = p.benefit;

    } else {

        document.getElementById('qv-benefit-row').style.display = 'none';

    }



    if (p.usage) {

        useEl.innerText = p.usage;

    } else {

        document.getElementById('qv-use-row').style.display = 'none';

    }



    if (p.duration || p.durationMin) {

        document.getElementById('qv-dur-row').style.display = 'block';

        durEl.innerText = (p.duration || p.durationMin) + " dk";

    }



    // BADGE

    const badgeEl = document.getElementById('qv-badge');

    if (p.badge) {

        badgeEl.innerText = p.badge;

        badgeEl.className = `badge ${p.badge === 'NEW' ? 'new' : 'best'}`;

        badgeEl.style.display = 'block';

    } else {

        badgeEl.style.display = 'none';

    }



    // BUTTON

    const btn = document.getElementById('qv-btn');

    const msg = encodeURIComponent(`${p.name || ''} hakkında bilgi almak istiyorum.`);

    btn.href = `https://wa.me/905348350169?text=${msg}`;

    btn.innerText = (p.cat && p.cat.includes('mass')) ? "Rezervasyon Yap" : "WhatsApp Sipariş";



    // SHOW

    qvOverlay.classList.add('active');

    document.body.style.overflow = 'hidden';

}

