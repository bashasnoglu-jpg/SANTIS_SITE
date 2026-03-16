// assets/js/service-detail-loader.js

// Handles loading details for Massage, Skincare, or JSON-based services

// Updated to use NV_MASSAGES (plural)



(async function () {

    const detailRoot = document.getElementById('serviceDetail');

    if (!detailRoot) return;



    // 🛡️ Auto-Depth Helper

    const determineRoot = () => {

        if (window.SITE_ROOT) return window.SITE_ROOT;

        const depth = window.location.pathname.split('/').length - 2;

        return depth > 0 ? "../".repeat(depth) : "";

    };



    // 1. Get Slug

    const params = new URLSearchParams(window.location.search);

    const slug = params.get('slug') || params.get('id');

    // Seed PAGE_GROUP_ID early for SEO injectors (canonical/hreflang)
    if (slug && !window.PAGE_GROUP_ID) {
        window.PAGE_GROUP_ID = slug;
    }



    // Helper: Render Not Found

    const renderNotFound = () => {

        detailRoot.innerHTML = `

        <div style="text-align:center; padding:60px;">

          <h2 style="color:var(--accent); margin-bottom:16px;">Hizmet Bulunamadı</h2>

          <p style="color:var(--text-muted); margin-bottom:24px;">Aradığınız içerik ("${slug || ''}") bulunamadı.</p>

          <a href="/" style="color:var(--accent);">← Ana Sayfaya Dön</a>

        </div>`;

    };



    if (!slug) {

        renderNotFound();

        return;

    }



    // 2. Search Function

    function findService(slug) {

        // A) NV_MASSAGES

        if (window.NV_MASSAGES) {

            const m = window.NV_MASSAGES.find(x => (x.id === slug || x.slug === slug));

            if (m) return { type: 'massage', data: m };

        }

        // B) NV_SKINCARE

        if (window.NV_SKINCARE) {

            const s = window.NV_SKINCARE.find(x => (x.id === slug || x.slug === slug));

            if (s) return { type: 'skincare', data: s };

        }

        // C) NV_HAMMAM

        if (window.NV_HAMMAM) {

            const h = window.NV_HAMMAM.find(x => (x.id === slug || x.slug === slug));

            if (h) return { type: 'hammam', data: h };

        }

        return null;

    }



    // 3. Render Function

    function render(item) {

        const d = item.data;

        // Update PAGE_GROUP_ID with canonical group reference if available
        const groupId = d.group_id || d.group || d.id || d.slug || slug;
        if (groupId) {
            window.PAGE_GROUP_ID = groupId;
        }



        // Map fields to UI

        const title = d.title; // TR

        const desc = d.desc;   // TR short desc

        const duration = d.duration || (d.durationMin + " dk");

        const price = d.price ? `${d.price}€` : "Fiyat sorunuz";

        const img = d.img || '/assets/img/placeholder.webp';

        const tier = d.tier || 'STANDARD';



        // Tags/Highlights

        const tags = d.tags || [];

        const hotelSlugs = d.hotelSlugs || [];



        // Badge logic (popular/vip etc based on tags)

        let badgeHTML = '';

        if (tags.includes('premium') || tags.includes('signature')) {

            badgeHTML += `<span class="badge badge-premium">Signature</span>`;

        } else if (tags.includes('kids')) {

            badgeHTML += `<span class="badge badge-express">Kids</span>`;

        }



        // Build HTML

        const html = `

        <div class="detail-header">

            <div class="detail-visual" style="background-image: url('${img}');"></div>

            

            <div class="detail-badges">

                <span class="badge badge-duration">${duration}</span>

                ${badgeHTML}

                <span class="badge badge-natural">${tier}</span>

            </div>



            <h1 class="detail-title">${title}</h1>

            <p class="detail-desc">${desc}</p>

        </div>



        <div class="detail-section">

            <h3 class="section-title">Deneyim</h3>

            <p class="detail-desc">

                ${desc} Bu özel seans, ${tags.join(", ")} gibi odak noktalarıyla tasarlanmıştır.

                Uzman terapistlerimiz eşliğinde, kişisel ihtiyaçlarınıza göre uyarlanabilir.

            </p>

            <br>

            <ul class="section-list">

                <li><strong>Süre:</strong> ${duration}</li>

                <li><strong>Fiyat:</strong> ${price}</li>

                <li><strong>Uygunluk:</strong> ${(item.type === 'massage' || item.type === 'hammam') ? 'Santis Club Spa Otelleri' : 'Sadece Cilt Bakımı Üniteleri'}</li>

            </ul>

        </div>



        <!-- HOTEL AVAILABILITY -->

        ${hotelSlugs.length > 0 ? `

        <div class="detail-section">

             <h3 class="section-title">Bulunduğu Oteller</h3>

             <div class="nv-chips">

                ${hotelSlugs.map(h => `<span class="nv-pill" style="margin-right:8px; opacity:0.8;">${formatHotelName(h)}</span>`).join('')}

             </div>

        </div>

        ` : ''}



        <div class="cta-section">

            <a href="/booking.html?service=${encodeURIComponent(title)}" class="cta-button" onclick="sessionStorage.setItem('selectedService', '${title}')">

                📱 Rezervasyon Yap

            </a>

        </div>

        `;



        detailRoot.innerHTML = html;

        document.title = `${title} — Santis Club`;

    }



    function formatHotelName(slug) {

        if (slug === 'alba-royal') return 'Alba Royal';

        if (slug === 'alba-queen') return 'Alba Queen';

        if (slug === 'alba-resort') return 'Alba Resort';

        if (slug === 'iberostar-bellevue') return 'Iberostar Bellevue (Karadağ)';

        return slug;

    }



    // --- Execution ---

    // Helper: Wait for data-bridge to finish loading
    const waitForData = () => new Promise((resolve) => {
        // Already ready?
        if (window.NV_DATA_READY) { resolve(); return; }
        // Listen for signal
        window.addEventListener('product-data:ready', () => resolve(), { once: true });
        // Safety timeout — if signal never fires, proceed anyway
        setTimeout(resolve, 5000);
    });

    // Helper: Edge Resolver Fetch for O(1) performance
    const edgeResolverFetch = async (slugId) => {
        try {
            console.log(`[ServiceLoader] Fetching via Edge Resolver for slug: ${slugId}...`);
            const r = await fetch(`/api/v1/content/resolve/${slugId}?region=tr&locale=tr`);
            if (r.status === 304 || r.ok) {
                const data = await r.json();

                // Determine rough category based on data for rendering tweaks
                let typeCat = 'massage';
                const catStr = (data.categoryId || data.category || '').toLowerCase();
                if (catStr.includes('hammam') || catStr.includes('hamam')) typeCat = 'hammam';
                else if (catStr.includes('face') || catStr.includes('skin')) typeCat = 'skincare';

                return { type: typeCat, data: data };
            }
            return null;
        } catch (e) {
            console.error('[ServiceLoader] Edge Resolver fetch failed:', e);
            return null;
        }
    };

    // Step 1: Try Edge Resolver directly first for O(1) caching performance
    let found = await edgeResolverFetch(slug);

    // Step 2: Fallback to data-bridge signal and JS arrays if Edge Resolver 404s
    if (!found) {
        console.warn(`[ServiceLoader] Edge Resolver returned no data for "${slug}". Falling back to legacy catalog...`);
        await waitForData();

        // Try finding in JS arrays
        found = findService(slug);

        // If still not found, trigger legacy static fetch
        if (!found) {
            console.warn(`[ServiceLoader] Slug "${slug}" not found in arrays. Legacy fetch no longer supported natively here.`);
        }
    }

    // Step 4: Render or show not found
    if (found) {
        render(found);
    } else {
        console.warn(`[ServiceLoader] FINAL: "${slug}" not found in any source.`);
        renderNotFound();
    }

})();

