// assets/js/service-detail-loader.js
// Handles loading details for Massage, Skincare, or JSON-based services
// Updated to use NV_MASSAGES (plural)

(async function () {
    const detailRoot = document.getElementById('serviceDetail');
    if (!detailRoot) return;

    // 1. Get Slug
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || params.get('id');

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

        // Map fields to UI
        const title = d.title; // TR
        const desc = d.desc;   // TR short desc
        const duration = d.duration || (d.durationMin + " dk");
        const price = d.price ? `${d.price}€` : "Fiyat sorunuz";
        const img = d.img || 'assets/img/placeholder.jpg';
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
    // Try finding in JS arrays first
    let found = findService(slug);
    if (found) {
        render(found);
    } else {
        // Fallback: Try fetching the old JSON if not found in JS arrays (legacy support)
        try {
            const res = await fetch('data/services_spa.json');
            if (res.ok) {
                const data = await res.json();
                // Simple search in data
                for (const [cat, services] of Object.entries(data)) {
                    const match = services.find(s => s.slug === slug);
                    if (match) {
                        // Adapt legacy JSON structure to new renderer
                        render({
                            type: 'legacy',
                            data: {
                                title: match.name?.tr,
                                desc: match.desc?.tr || match.content?.tr?.intro,
                                duration: match.duration,
                                img: 'assets/img/placeholder.jpg', // legacy often missed imgs
                                tags: [],
                                hotelSlugs: [] // legacy JSON didn't have this
                            }
                        });
                        return;
                    }
                }
            }
        } catch (e) { console.error(e); }

        renderNotFound();
    }

})();
