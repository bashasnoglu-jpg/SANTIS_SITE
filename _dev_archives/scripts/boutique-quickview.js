/**
 * 🎯 HEDEF A: SOVEREIGN QUICK VIEW (GLASSMORPHISM CAPSULE)
 * Zero-Routing | 3D Entrance | Dynamic Scarcity (Cephe 3)
 */

window.BoutiqueQuickView = {
    open(item) {
        if (document.getElementById('santis-quickview-modal')) return;

        // 🟢 CEPHE 3: Dinamik Kıtlık
        let stock = 10;
        if (window.SovereignBoutiqueCore) {
            stock = window.SovereignBoutiqueCore.phantomCart.getScarcity(item);
        } else {
            stock = item.stock || Math.floor(Math.random() * 4) + 2;
        }

        const scarcityHtml = stock <= 4
            ? `<div style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;margin-bottom:20px;
               border:1px solid rgba(239,68,68,0.3);background:rgba(127,29,29,0.2);border-radius:4px;">
               <span style="width:8px;height:8px;border-radius:50%;background:#ef4444;animation:pulse 2s infinite;"></span>
               <span style="color:#f87171;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
                   Son ${stock} Adet — Kıtlık Modu
               </span></div>`
            : `<div style="display:inline-block;padding:4px 12px;margin-bottom:20px;
               border:1px solid rgba(212,175,55,0.3);color:#D4AF37;font-size:10px;
               letter-spacing:0.2em;text-transform:uppercase;">Stokta Mevcut</div>`;

        const title = item.title || item.name || item.slug || 'Sovereign İksir';
        const imgUrl = (item.image && item.image.length > 5)
            ? item.image : '/assets/img/cards/santis_card_massage_lux.webp';
        const price = item.price_eur || item.price?.amount || 'VIP';
        const category = item.category || item.categoryId || 'Signature Collection';
        const desc = item.description
            || (item.content?.tr?.shortDesc)
            || "Santis Club'ın gizli laboratuvarlarında, nadir botanikler ve saf minerallerle formüle edilmiş bu imza koleksiyon, cildinizin Kuantum frekansını yeniler ve zamana meydan okur.";

        const priceStr = (typeof price === 'number' || (typeof price === 'string' && !price.includes('€') && price !== 'VIP'))
            ? `€${price}` : price;

        const modal = document.createElement('div');
        modal.id = 'santis-quickview-modal';
        modal.style.cssText = `
            position:fixed;inset:0;z-index:99999;
            display:flex;align-items:center;justify-content:center;padding:1rem;
            opacity:0;transition:opacity 0.4s ease;
        `;

        const isMobile = window.innerWidth < 768;

        modal.innerHTML = `
            <div id="qv-backdrop" style="position:absolute;inset:0;background:rgba(5,5,5,0.85);
                 backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);cursor:pointer;"></div>

            <div id="qv-content" style="
                position:relative;width:100%;max-width:900px;background:#0a0a09;
                border:1px solid rgba(212,175,55,0.2);border-radius:12px;
                box-shadow:0 0 100px rgba(0,0,0,0.95),0 0 40px rgba(212,175,55,0.05);
                display:flex;flex-direction:${isMobile ? 'column' : 'row'};overflow:hidden;
                transform:scale(0.94) translateY(24px);
                transition:all 0.5s cubic-bezier(0.16,1,0.3,1);max-height:90vh;">

                <!-- CLOSE -->
                <button id="qv-close" style="position:absolute;top:1rem;right:1rem;z-index:10;
                    padding:0.5rem;color:#6b7280;background:rgba(0,0,0,0.6);
                    border-radius:50%;border:none;cursor:pointer;transition:color 0.2s;"
                    onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#6b7280'">
                    <svg style="width:20px;height:20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>

                <!-- IMAGE -->
                ${!isMobile ? `
                <div style="width:50%;position:relative;min-height:480px;background:#000;overflow:hidden;flex-shrink:0;">
                    <img src="${imgUrl}" alt="${title}"
                         style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">
                    <div style="position:absolute;inset:0;background:linear-gradient(to right,transparent,#0a0a09);"></div>
                </div>` : ''}

                <!-- DETAILS -->
                <div style="flex:1;padding:${isMobile ? '2rem 1.5rem' : '3rem 2.5rem'};
                     display:flex;flex-direction:column;justify-content:center;overflow-y:auto;">
                    ${scarcityHtml}
                    <p style="font-size:10px;letter-spacing:0.3em;color:#D4AF37;text-transform:uppercase;
                       margin-bottom:0.5rem;font-weight:600;">${category}</p>
                    <h2 style="font-size:${isMobile ? '1.5rem' : '2rem'};font-family:serif;color:#fff;
                       line-height:1.2;margin-bottom:1rem;">${title}</h2>
                    <p style="color:#9ca3af;font-size:0.875rem;line-height:1.7;margin-bottom:2rem;font-weight:300;">
                        ${desc}
                    </p>
                    <div style="margin-top:auto;">
                        <div style="font-size:1.5rem;color:#D4AF37;font-weight:500;letter-spacing:0.05em;
                             margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,0.06);">
                            ${priceStr}
                        </div>
                        <button id="qv-vault-btn" style="
                            width:100%;background:linear-gradient(135deg,#D4AF37,#AA8A2A);color:#000;
                            font-weight:700;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;
                            padding:1.1rem 1rem;border-radius:4px;border:none;cursor:pointer;
                            transition:all 0.3s;box-shadow:0 0 20px rgba(212,175,55,0.2);"
                            onmouseover="this.style.boxShadow='0 0 35px rgba(212,175,55,0.5)';this.style.transform='scale(1.02)'"
                            onmouseout="this.style.boxShadow='0 0 20px rgba(212,175,55,0.2)';this.style.transform='scale(1)'">
                            Sovereign Çantaya Ekle
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => {
            modal.style.opacity = '0';
            document.getElementById('qv-content').style.transform = 'scale(0.94) translateY(24px)';
            setTimeout(() => modal.remove(), 400);
        };

        modal.querySelector('#qv-backdrop').onclick = close;
        modal.querySelector('#qv-close').onclick = close;

        const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
        document.addEventListener('keydown', esc);

        // Kasa tetikleyici — kapsülü kapat, Stripe çekmecesini aç
        modal.querySelector('#qv-vault-btn').onclick = () => {
            close();
            if (window.SovereignVault) {
                setTimeout(() => window.SovereignVault.open({ ...item, isProduct: true }), 320);
            } else if (window.CheckoutVault) {
                setTimeout(() => window.CheckoutVault.open({ ...item, isProduct: true }), 320);
            }
        };

        // Animate in
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            document.getElementById('qv-content').style.transform = 'scale(1) translateY(0)';
        });
    }
};
