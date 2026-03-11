// ========================================================================
// 🦅 SANTIS OMNI-OS V18 | THE UI DICTATOR (MASSAGE MATRIX)
// ========================================================================

export function init(kernelWorker) {
    console.log("💎 [Massage UI] UI Katmanı Mühürlendi. Kuantum Sinyali Bekleniyor...");

    // V18 MİMARİSİ GÜNCELLEMESİ: Birden fazla konteyneri ve Hammam Grid'ini destekle
    const arenas = document.querySelectorAll('.santis-matrix-container, #santis-data-matrix-grid');
    if (arenas.length === 0) return null;

    // Yeraltından (Worker'dan) gelen Kuantum Sinyalini dinle
    kernelWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;

        if (type === 'MATRIX_READY') {
            const totalGold = payload.length;
            console.log(`🚀 [Massage UI] İşçi ${totalGold} Külçe Altını Yüzeye Çıkardı! DOM'a Akıtılıyor...`);

            arenas.forEach((arena) => {
                // Konteyner ayarları
                const layout = arena.dataset.layout || (arena.id === 'santis-data-matrix-grid' ? 'giant-rail' : 'grid');
                const datasetCategory = (arena.dataset.category || window.Santis.State.page).toLowerCase();
                const limit = parseInt(arena.dataset.limit) || 999;

                // Konteynere özel filtreleme (V18.2 PRECISION FILTER)
                const filteredData = payload.filter(item => {
                    const cat = (item.category || '').toLowerCase();
                    const catId = (item.categoryId || '').toLowerCase();

                    if (datasetCategory === 'skincare') {
                        return cat === 'skincare' || cat === 'skincare-ritual' || cat === 'skincare-advanced' || catId.startsWith('sothys');
                    }
                    if (datasetCategory === 'hammam' || datasetCategory === 'hamam') {
                        return cat === 'hammam' || catId.startsWith('ritual-hammam');
                    }
                    if (datasetCategory === 'massage' || datasetCategory === 'masajlar') {
                        return cat === 'massage' && !catId.startsWith('ritual-hammam');
                    }
                    if (datasetCategory === 'rituals') {
                        return cat === 'journey';
                    }
                    if (datasetCategory === 'index' || datasetCategory === 'all') return true;
                    return cat === datasetCategory;
                }).slice(0, limit);

                if (filteredData.length === 0) return;

                // Rail layout: container ayarını yap
                if (layout === 'rail') {
                    arena.style.display = 'flex';
                    arena.style.gap = '20px';
                    arena.style.overflowX = 'auto';
                    arena.style.overflowY = 'hidden';
                    arena.style.scrollSnapType = 'x mandatory';
                    arena.style.scrollbarWidth = 'none';
                    arena.style.paddingBottom = '10px';
                    arena.style.minHeight = 'auto';
                    arena.style.padding = '0';
                }

                const fragment = document.createDocumentFragment();

                filteredData.forEach((item, index) => {
                    // Extract Title & Description
                    let title = item.title;
                    let desc = item.description || '';
                    if (!title && item.content && item.content.tr) {
                        title = item.content.tr.title || item.name;
                        desc = item.content.tr.shortDesc || item.content.tr.fullDesc || desc;
                    } else if (!title) {
                        title = item.name;
                    }

                    let url = item.url || item.detailUrl || `/tr/${datasetCategory === 'index' ? 'masajlar' : datasetCategory}/${item.slug || item.id}.html`;
                    let img = item.image || (item.media && item.media.hero ? `/assets/img/cards/${item.media.hero}` : item.img || '/assets/img/luxury-placeholder.webp');
                    let price = item.price_eur ? `€${item.price_eur}` : (item.price && item.price.amount ? `${item.price.currency || '€'}${item.price.amount}` : '');

                    const card = document.createElement('a');
                    card.href = url;

                    if (layout === 'giant-rail') {
                        // Hammam Giant Card (Apple Pro Width 480px / 85vw)
                        card.className = 'matrix-service-card';
                        card.style.display = 'flex';
                        card.style.flexDirection = 'column';
                        card.style.position = 'relative';
                        card.style.overflow = 'hidden';
                        card.style.textDecoration = 'none';
                        card.style.height = '600px'; // Kilit: Kartın dikey olarak ezilmesini önler
                        card.style.flex = '0 0 auto'; // Kilit: Flexbox'ın kartı yatayda sıkıştırmasını önler
                        card.innerHTML = `
                            <img src="${img}" style="width:100%; height:100%; object-fit:cover; position:absolute; inset:0; z-index:0; filter: brightness(0.6);" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='/assets/img/luxury-placeholder.webp'"/>
                            <div style="position:relative; z-index:1; padding: 2rem; display:flex; flex-direction:column; justify-content:flex-end; height: 100%; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);">
                                <h3 style="color:#d4af37; font-family:'Playfair Display', serif; font-size:2rem; margin:0;">${title}</h3>
                                <p style="color:#ccc; font-family:'Inter', sans-serif; font-size:1rem; margin-top:8px;">${desc}</p>
                                <div style="font-family:'Inter', sans-serif; color:#fff; margin-top:16px; font-weight: 500;">${price}</div>
                            </div>
                        `;
                    } else {
                        // Rail / Grid Card (Index, Masaj)
                        card.className = 'nv-matrix-card santis-card';
                        card.style.display = 'block';
                        card.style.position = 'relative';
                        card.style.borderRadius = '12px';
                        card.style.overflow = 'hidden';
                        card.style.textDecoration = 'none';
                        card.style.aspectRatio = layout === 'rail' ? '3/4' : 'auto';
                        card.style.minWidth = layout === 'rail' ? '280px' : 'auto';
                        card.style.flex = layout === 'rail' ? '0 0 auto' : 'auto';
                        card.innerHTML = `
                            <img src="${img}" style="position: absolute; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7);" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='/assets/img/luxury-placeholder.webp'" />
                            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);"></div>
                            <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 24px; z-index: 2;">
                                <span style="display: block; color: #d4af37; font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">${item.category || datasetCategory}</span>
                                <h3 style="color: #fff; font-family: 'Playfair Display', serif; font-size: 1.5rem; margin: 0 0 8px 0; font-weight: 400; line-height: 1.2;">${title}</h3>
                                <p style="color: rgba(255,255,255,0.7); font-family: 'Inter', sans-serif; font-size: 0.85rem; margin: 0 0 16px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${desc}</p>
                                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
                                    <span style="color: #fff; font-family: 'Inter', sans-serif; font-weight: 500;">${price}</span>
                                    <span style="color: #d4af37; font-family: 'Inter', sans-serif; font-size: 0.8rem; letter-spacing: 1px;">KEŞFET &rarr;</span>
                                </div>
                            </div>
                        `;
                    }

                    // Hardware-Accelerated Başlangıç Noktası
                    card.style.opacity = "0";
                    card.style.transform = "translate3d(0, 40px, 0)";
                    card.style.transition = `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s`;

                    fragment.appendChild(card);
                });

                arena.appendChild(fragment);

                requestAnimationFrame(() => {
                    arena.style.opacity = "1";
                    const allCards = arena.querySelectorAll('.matrix-service-card, .nv-matrix-card');
                    allCards.forEach(c => {
                        c.style.opacity = "1";
                        c.style.transform = "translate3d(0, 0, 0)";
                    });
                });
            });

            // ========================================================
            // 👑 V18.1 RESURRECTION: THE ORACLE LINEUP (Biyometrik Matrix)
            // ========================================================
            const oracleGrid = document.getElementById('oracle-icons-grid');
            if (oracleGrid && window.Santis.State.page === 'hamam') {
                console.log("🩸 [Massage UI] Biyometrik Matrix (Oracle Lineup) Diriltiliyor...");

                // Fetch up to 8 items flagged as 'express' or '30 min', fallback to any Hamam items
                let quickAccessList = payload.filter(item => {
                    const dur = item.duration ? item.duration.toString() : '';
                    const c = (item.categoryId || item.category || '').toLowerCase();
                    const isHamam = c.includes('hammam') || c.startsWith('ritual-hammam') || c === 'hamam';
                    return isHamam && (dur === '30' || dur.toLowerCase().includes('express'));
                });

                if (quickAccessList.length < 8) {
                    const fillers = payload.filter(s => {
                        const isAlreadyAdded = quickAccessList.some(q => q.id === s.id);
                        const c = (s.categoryId || s.category || '').toLowerCase();
                        const isHamam = c.includes('hammam') || c.startsWith('ritual-hammam') || c === 'hamam';
                        return !isAlreadyAdded && isHamam;
                    }).slice(0, 8 - quickAccessList.length);
                    quickAccessList = [...quickAccessList, ...fillers];
                }

                let oracleHtml = '';
                quickAccessList.forEach((item, idx) => {
                    const title = item.title || (item.content?.tr?.title) || item.name;
                    const shortDesc = item.description || (item.content?.tr?.shortDesc) || 'Santis Club imzalı kusursuz deneyim.';
                    const imagePath = item.media?.thumbnail || item.image || item.img || '/assets/img/cards/santis_card_recovery_lotion_v2.webp';
                    const isPriority = item._biometricFlag || (idx === 0) ? 'Apple Health Tavsiyesi' : false;
                    const priceRaw = item.price?.amount || item.price_eur || 0;
                    const price = priceRaw > 0 ? priceRaw + ' €' : 'Özel';
                    const dur = item.duration || '30';
                    const detailUrl = item.detailUrl || item.url || `/tr/hamam/${item.slug || item.id}.html`;

                    oracleHtml += `
                    <a href="${detailUrl}" class="matrix-service-card" style="flex-shrink: 0; scroll-snap-align: start; width: 480px; height: 600px; border-radius: 20px; overflow: hidden; border: ${isPriority ? '2px solid #d4af37' : '2px solid transparent'}; position: relative; background: #080808; text-decoration: none; display: flex; flex-direction: column; justify-content: flex-end; opacity: 0; transform: translateY(20px); transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease; animation: fadeIn 0.5s ease forwards ${idx * 0.05}s;">
                        <img src="${imagePath}" alt="${title}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; opacity: 0.8; transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1); z-index: 0;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.onerror=null;this.src='/assets/img/luxury-placeholder.webp'">
                        <div style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(5,5,5,0.98) 100%); z-index: 1;"></div>
                        
                        ${isPriority ? `<div style="position: absolute; top: 20px; right: 20px; z-index: 3; background: rgba(212,175,55,0.9); backdrop-filter: blur(4px); padding: 6px 14px; border-radius: 20px; display: flex; align-items: center; gap: 6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                            <span style="font-family: 'Inter', sans-serif; font-size: 0.75rem; color: #fff; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">${isPriority}</span>
                        </div>` : ''}

                        <div style="position: relative; z-index: 2; padding: 40px 32px; display: flex; flex-direction: column; gap: 12px; width: 100%;">
                            <span style="font-family: 'Inter', sans-serif; font-size: 0.75rem; color: #d4af37; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">${dur} DK. RİTÜELİ</span>
                            <h3 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; color: #fff; margin:0; line-height: 1.1; font-weight: 400;">${title}</h3>
                            <p style="font-family: 'Inter', sans-serif; font-size: 1.05rem; color: rgba(255,255,255,0.6); margin:0; line-height: 1.5; font-weight: 300; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${shortDesc}</p>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
                                <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 6px;">
                                    <span style="color: rgba(255,255,255,0.4); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Süre</span>
                                    <span style="color: #fff; font-size: 1.1rem; font-family: 'Inter', sans-serif;">${dur} Dakika</span>
                                </div>
                                <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 6px;">
                                    <span style="color: rgba(255,255,255,0.4); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Yatırım</span>
                                    <span style="color: #d4af37; font-size: 1.1rem; font-family: 'Inter', sans-serif; font-weight: 500;">${price}</span>
                                </div>
                            </div>
                        </div>
                    </a>`;
                });

                oracleGrid.innerHTML = oracleHtml;

                // Desktop Mouse Drag to Scroll for Oracle Lineup
                let isDown = false;
                let startX;
                let containerScrollLeft;

                oracleGrid.addEventListener('mousedown', (e) => {
                    isDown = true;
                    oracleGrid.style.cursor = 'grabbing';
                    oracleGrid.style.scrollSnapType = 'none'; // Disable snap while dragging
                    startX = e.pageX - oracleGrid.offsetLeft;
                    containerScrollLeft = oracleGrid.scrollLeft;
                });

                oracleGrid.addEventListener('mouseleave', () => {
                    isDown = false;
                    oracleGrid.style.cursor = 'grab';
                    oracleGrid.style.scrollSnapType = 'x mandatory';
                });

                oracleGrid.addEventListener('mouseup', () => {
                    isDown = false;
                    oracleGrid.style.cursor = 'grab';
                    oracleGrid.style.scrollSnapType = 'x mandatory';
                });

                oracleGrid.addEventListener('mousemove', (e) => {
                    if (!isDown) return;
                    e.preventDefault();
                    const x = e.pageX - oracleGrid.offsetLeft;
                    const walk = (x - startX) * 2; // Scroll speed multiplier
                    oracleGrid.scrollLeft = containerScrollLeft - walk;
                });
            }

            console.log(`🏆 [V18 APEX SINGULARITY] Matrix Katmanı Kusursuzca İşlendi! FPS: 120 Lock.`);
        }
    });

    return { status: 'listening' };
}
