// ========================================================================
// 🦅 SANTIS OMNI-OS V18 | THE UI DICTATOR (MASSAGE MATRIX)
// ========================================================================

async function yieldToMain() {
    if ('scheduler' in globalThis && 'yield' in scheduler) return await scheduler.yield();
    return new Promise(resolve => setTimeout(resolve, 0));
}

// ─── CLS KILLER: Skeleton Rezervasyonu ─────────────────────────────────────
// Kartlar gelmeden önce container'a sabit yükseklik + skeleton placeholder ekler.
// Bu sayede DOM'a kart eklenince layout shift oluşmaz.
function injectSkeletons(arena, count = 4, layout = 'rail') {
    const isRail = layout === 'rail';
    arena.style.contain = 'layout style';
    arena.style.minHeight = isRail ? '320px' : '560px';
    arena.style.opacity = '1'; // Skeleton görünür olsun

    if (isRail) {
        arena.style.display = 'flex';
        arena.style.gap = '20px';
        arena.style.overflowX = 'auto';
        arena.style.scrollbarWidth = 'none';
    }

    const skeletonStyle = isRail
        ? `flex:0 0 auto;width:340px;min-height:320px;border-radius:12px;background:linear-gradient(90deg,#111 25%,#1c1c1c 50%,#111 75%);background-size:400% 100%;animation:santis-shimmer 1.4s infinite;`
        : `width:100%;min-height:260px;border-radius:12px;background:linear-gradient(90deg,#111 25%,#1c1c1c 50%,#111 75%);background-size:400% 100%;animation:santis-shimmer 1.4s infinite;`;

    // Global skeleton animasyonu (bir kez ekle)
    if (!document.getElementById('santis-skeleton-css')) {
        const style = document.createElement('style');
        style.id = 'santis-skeleton-css';
        style.textContent = `@keyframes santis-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`;
        document.head.appendChild(style);
    }

    const frag = document.createDocumentFragment();
    for (let i = 0; i < Math.min(count, 8); i++) {
        const sk = document.createElement('div');
        sk.className = 'santis-skeleton-card';
        sk.setAttribute('style', skeletonStyle);
        sk.setAttribute('aria-hidden', 'true');
        frag.appendChild(sk);
    }
    arena.appendChild(frag);
}


export function init(kernelWorker) {
    console.log("💎 [Massage UI] UI Katmanı Mühürlendi. Kuantum Sinyali Bekleniyor...");

    // V18 MİMARİSİ GÜNCELLEMESİ: Birden fazla konteyneri ve Hammam Grid'ini destekle
    const arenas = document.querySelectorAll('.santis-matrix-container, #santis-data-matrix-grid');
    if (arenas.length === 0) return null;

    // 🦴 SKELETON INJECT: Worker cevap vermeden önce yüksekliği rezerve et
    arenas.forEach(arena => {
        const layout = arena.dataset.layout || 'rail';
        const limit = parseInt(arena.dataset.limit) || 4;
        injectSkeletons(arena, Math.min(limit, 5), layout);
    });

    // 🛡️ FAILSAFE: Worker 5sn içinde cevap vermezse opacity'yi aç
    const failsafeTimer = setTimeout(() => {
        arenas.forEach(a => {
            a.querySelectorAll('.santis-skeleton-card').forEach(sk => sk.remove());
            a.style.opacity = '1';
        });
        console.warn('⏰ [Massage UI] Worker 5sn timeout — skeleton temizlendi (failsafe).');
    }, 5000);

    // Yeraltından (Worker'dan) gelen Kuantum Sinyalini dinle
    kernelWorker.addEventListener('message', async (event) => {
        const { type, payload } = event.data;

        // 🛡️ Worker fetch hatası — opacity'yi aç, sayfa kapkara kalmasın
        if (type === 'FATAL_ERROR') {
            clearTimeout(failsafeTimer);
            console.error(`🚨 [Massage UI] Worker FATAL_ERROR: ${payload}`);
            arenas.forEach(a => { a.style.opacity = '1'; });
            return;
        }

        if (type === 'MATRIX_READY') {
            clearTimeout(failsafeTimer);
            const totalGold = payload.length;
            console.log(`🚀 [Massage UI] İşçi ${totalGold} Külçe Altını Yüzeye Çıkardı! DOM'a Akıtılıyor...`);

            for (const arena of arenas) {
                // Konteyner ayarları
                const layout = arena.dataset.layout || (arena.id === 'santis-data-matrix-grid' ? 'giant-rail' : 'grid');
                const datasetCategory = (arena.dataset.category || window.Santis.State.page).toLowerCase();
                const limit = parseInt(arena.dataset.limit) || 999;

                // Konteynere özel filtreleme (V18.2 PRECISION FILTER)
                const filteredData = payload.filter(item => {
                    const cat = (item.category || '').toLowerCase();
                    const catId = (item.categoryId || '').toLowerCase();

                    if (datasetCategory === 'skincare') {
                        return cat === 'skincare' || cat.startsWith('skincare-') || catId.startsWith('skincare-') || catId.startsWith('sothys');
                    }
                    if (datasetCategory === 'hammam' || datasetCategory === 'hamam') {
                        return cat === 'hammam' || catId.startsWith('ritual-hammam');
                    }
                    if (datasetCategory === 'massage' || datasetCategory === 'masajlar') {
                        return (cat.startsWith('massage') || catId.startsWith('massage')) && !catId.startsWith('ritual-hammam');
                    }
                    if (datasetCategory === 'rituals') {
                        return cat === 'journey';
                    }
                    if (datasetCategory === 'index' || datasetCategory === 'all') return true;
                    return cat === datasetCategory;
                }).slice(0, limit);

                console.warn(`[Matrix DEBUG] datasetCategory: ${datasetCategory}, limit: ${limit}, filteredLength: ${filteredData.length}`);

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

                // 🎨 CSS VARIANT ENGINE — Klon görsellere benzersiz renk tonu
                const imgSeenCount = {};
                const getVariantFilter = (imgSrc, itemId) => {
                    imgSeenCount[imgSrc] = (imgSeenCount[imgSrc] || 0) + 1;
                    const count = imgSeenCount[imgSrc];
                    if (count <= 1) return 'brightness(0.7)'; // İlk kullanım: dokunma
                    // Hash: ID'den deterministik varyasyon üret
                    let hash = 0;
                    for (let i = 0; i < (itemId || '').length; i++) hash = ((hash << 5) - hash) + itemId.charCodeAt(i);
                    const hue = Math.abs(hash % 30);        // 0-30° ince hue kayması
                    const bright = 0.6 + (Math.abs(hash >> 4) % 15) / 100; // 0.60-0.75
                    const sat = 0.9 + (Math.abs(hash >> 8) % 30) / 100;    // 0.90-1.20
                    return `brightness(${bright}) hue-rotate(${hue}deg) saturate(${sat})`;
                };

                const fragment = document.createDocumentFragment();
                const CHUNK_SIZE = 4; // INP Task Chunking Optimization

                for (let index = 0; index < filteredData.length; index++) {
                    const item = filteredData[index];
                    // Extract Title & Description
                    let title = item.name;
                    let desc = item.description || '';
                    if (!title && item.content && item.content.tr) {
                        title = item.content.tr.title || 'Santis Massage';
                    }

                    let url = item.detailUrl || `/tr/${datasetCategory === 'index' ? 'masajlar' : datasetCategory}/${item.slug || item.id}.html`;
                    let img = item.image || (item.media && item.media.hero ? `/assets/img/cards/${item.media.hero}` : item.img || '/assets/img/luxury-placeholder.webp');
                    let price = item.price_eur ? `€${item.price_eur}` : (item.price && item.price.amount ? `${item.price.currency || '€'}${item.price.amount}` : '');

                    const card = document.createElement(layout === 'coverflow' ? 'div' : 'a');
                    if (layout !== 'coverflow') card.href = url;

                    if (layout === 'coverflow') {
                        const loadAttr = index < 2 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
                        card.className = 'santis-stack-card';
                        card.setAttribute('data-ghost-trace', `card-${item.id}`);
                        card.setAttribute('data-variant-hash', getVariantFilter(img, item.id));
                        card.setAttribute('data-reveal', item.slug || item.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                        card.style.backgroundImage = `url('${img}')`;
                        
                        // We use background-image for Cover Flow by default, but we'll apply the filter inline to a pseudo element if needed,
                        // or just rely on the existing V45 CSS which natively supports background-image.
                        
                        card.innerHTML = `
                            <h3 data-morph="title" style="text-shadow: 0 4px 12px rgba(0,0,0,0.8);">${title}</h3>
                            <span data-morph="meta" class="santis-stack-meta" style="text-shadow: 0 4px 12px rgba(0,0,0,0.8);">${({skincare:'CİLT BAKIMI',massage:'MASAJ',hammam:'HAMAM',hamam:'HAMAM',rituals:'RİTÜELLER',journey:'RİTÜELLER'})[datasetCategory] || datasetCategory.toUpperCase()} | ${price}</span>
                            
                            <div class="santis-reveal-data">
                                <h2 data-morph="title" style="font-family: 'Playfair Display', serif; font-size: 3.5rem; margin-bottom: 20px; color: #fff;">${title}</h2>
                                <p data-morph="meta" style="font-size: 1.2rem; color: rgba(255,255,255,0.9); line-height: 1.9; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
                                    ${desc || 'Bu özel ritüel, bedensel yorgunluğunuzu atarken ruhunuzu derin bir sessizliğe davet ediyor. Sovereign Club ayrıcalıklarıyla donatılmış premium bir dokunuş hissedeceksiniz.'}
                                </p>
                                <div class="flex" style="gap: 20px; justify-content: center; margin-bottom: 50px;">
                                    <div style="background: rgba(0,0,0,0.4); padding: 15px 30px; border-radius: 12px; border: 1px solid rgba(212,175,55,0.3); backdrop-filter: blur(10px);">
                                        <span class="text-[#d4af37]" style="display: block; font-size: 0.8rem; letter-spacing: 2px;">SÜRE</span>
                                        <strong style="font-size: 1.3rem;">60 Dk</strong>
                                    </div>
                                    <div style="background: rgba(0,0,0,0.4); padding: 15px 30px; border-radius: 12px; border: 1px solid rgba(212,175,55,0.3); backdrop-filter: blur(10px);">
                                        <span class="text-[#d4af37]" style="display: block; font-size: 0.8rem; letter-spacing: 2px;">BÖLGE</span>
                                        <strong style="font-size: 1.3rem;">Tüm Beden</strong>
                                    </div>
                                </div>
                                <a href="https://wa.me/905348350169" target="_blank" class="santis-btn santis-btn-primary santis-magnetic" style="padding: 16px 40px; font-size: 1.1rem; box-shadow: 0 10px 30px rgba(212,175,55,0.2);">
                                    HEMEN REZERVASYON
                                </a>
                            </div>
                        `;
                    } else if (layout === 'giant-rail') {
                        // Hammam Giant Card (Apple Pro Width 480px / 85vw)
                        const loadAttr = index < 2 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
                        card.className = 'matrix-service-card';
                        card.setAttribute('data-ghost-trace', `card-${item.id}`);
                        card.setAttribute('data-variant-hash', getVariantFilter(img, item.id));
                        card.setAttribute('data-category', (item.category || '').toLowerCase());
                        card.setAttribute('data-category-id', (item.categoryId || '').toLowerCase());
                        card.setAttribute('data-tags', (item.tags || []).join(',').toLowerCase());
                        card.style.display = 'flex';
                        card.style.flexDirection = 'column';
                        card.style.position = 'relative';
                        card.style.overflow = 'hidden';
                        card.style.textDecoration = 'none';
                        card.style.height = '320px'; // Sabit yükseklik (eski: 50vh = çok uzundu)
                        card.style.flex = '0 0 auto'; // Kilit: Flexbox'ın kartı yatayda sıkıştırmasını önler
                        card.innerHTML = `
                            <img class="w-full" src="${img}" style="height:100%; object-fit:cover; position:absolute; inset:0; z-index:0; filter: ${getVariantFilter(img, item.id)};" ${loadAttr} decoding="async" onerror="this.onerror=null;this.src='/assets/img/luxury-placeholder.webp'"/>
                            <div class="relative flex" style="z-index:1; padding: 2rem; flex-direction:column; justify-content:flex-end; height: 100%; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);">
                                <h3 class="text-[#d4af37]" style="font-family:;'Playfair Display', serif; font-size:2rem; margin:0;">${title}</h3>
                                <p style="color:#ccc; font-family:'Inter', sans-serif; font-size:1rem; margin-top:8px;">${desc}</p>
                                <div style="font-family:'Inter', sans-serif; color:#fff; margin-top:16px; font-weight: 500;">${price}</div>
                            </div>
                        `;
                    } else {
                        // Rail / Grid Card (Index, Masaj)
                        const loadAttr = index < 2 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
                        card.className = 'santis-matrix-card santis-card';
                        card.setAttribute('data-ghost-trace', `card-${item.id}`);
                        card.setAttribute('data-variant-hash', getVariantFilter(img, item.id));
                        card.setAttribute('data-category', (item.category || '').toLowerCase());
                        card.setAttribute('data-category-id', (item.categoryId || '').toLowerCase());
                        card.setAttribute('data-tags', (item.tags || []).join(',').toLowerCase());
                        card.style.display = 'block';
                        card.style.position = 'relative';
                        card.style.borderRadius = '12px';
                        card.style.overflow = 'hidden';
                        card.style.textDecoration = 'none';
                        card.style.aspectRatio = layout === 'rail' ? '3/5' : 'auto';
                        card.style.minWidth = layout === 'rail' ? '340px' : 'auto';
                        card.style.minHeight = '260px'; // Sabit yükseklik (eski: 50vh = çok uzundu)
                        card.style.flex = layout === 'rail' ? '0 0 auto' : 'auto';
                        card.innerHTML = `
                            <img class="w-full" src="${img}" style="position: absolute; height: 100%; object-fit: cover; filter: ${getVariantFilter(img, item.id)};" ${loadAttr} decoding="async" onerror="this.onerror=null;this.src='/assets/img/luxury-placeholder.webp'" />
                            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);"></div>
                            <div class="w-full" style="position: absolute; bottom: 0; left: 0; padding: 24px; z-index: 2;">
                                <span class="text-[#d4af37]" style="display: block; font-family:;'Inter', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">${({skincare:'CİLT BAKIMI',massage:'MASAJ',hammam:'HAMAM',hamam:'HAMAM',rituals:'RİTÜELLER',journey:'RİTÜELLER'})[datasetCategory] || datasetCategory.toUpperCase()}</span>
                                <h3 class="text-white" style="font-family:;'Playfair Display', serif; font-size: 1.5rem; margin: 0 0 8px 0; font-weight: 400; line-height: 1.2;">${title}</h3>
                                <p style="color: rgba(255,255,255,0.7); font-family: 'Inter', sans-serif; font-size: 0.85rem; margin: 0 0 16px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${desc}</p>
                                <div class="flex" style="justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
                                    <span class="text-white" style="font-family:;'Inter', sans-serif; font-weight: 500;">${price}</span>
                                    <span class="text-[#d4af37]" style="font-family:;'Inter', sans-serif; font-size: 0.8rem; letter-spacing: 1px;">KEŞFET &rarr;</span>
                                </div>
                            </div>
                        `;
                    }

                // 🗑️ CLS FIX: Skeleton kartları temizle, gerçek kartları replace et
                arena.querySelectorAll('.santis-skeleton-card').forEach(sk => sk.remove());

                if (layout !== 'coverflow') {
                    // Hardware-Accelerated Başlangıç Noktası (will-change ile CLS-safe)
                    card.style.opacity = "0";
                    card.style.transform = "translate3d(0, 20px, 0)";
                    card.style.willChange = "opacity, transform";
                    card.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(index * 0.04, 0.5)}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(index * 0.04, 0.5)}s`;
                }

                fragment.appendChild(card);
                    
                    // INP: Ana thread'in dondurulmasına engel ol (Yield)
                    if ((index + 1) % CHUNK_SIZE === 0) {
                        await yieldToMain();
                    }
                } // End for loop

                arena.appendChild(fragment);

                requestAnimationFrame(() => {
                    arena.style.opacity = "1";
                    const allCards = arena.querySelectorAll('.matrix-service-card, .santis-matrix-card');
                    allCards.forEach(c => {
                        c.style.opacity = "1";
                        c.style.transform = "translate3d(0, 0, 0)";
                    });
                });
            }

            // 🎯 SMART FILTER BRIDGE: Kartlar DOM'a enjekte edildi — filtre motorunu uyandır!
            console.log(`🎯 [Matrix] ${totalGold} kart DOM'a eklendi. santis:cards-rendered ateşleniyor...`);
            document.dispatchEvent(new CustomEvent('santis:cards-rendered', { detail: { count: totalGold } }));
            
            // 🔥 V45 CAROUSEL RESURRECTION: Re-init 3D Cover Flow stages that were dynamically injected
            setTimeout(() => { if(window.initCoverFlowCarousel) window.initCoverFlowCarousel(); }, 150);

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
                const CHUNK_SIZE_ORACLE = 4;
                for (let idx = 0; idx < quickAccessList.length; idx++) {
                    const item = quickAccessList[idx];
                    const title = item.title || (item.content?.tr?.title) || item.name;
                    const shortDesc = item.description || (item.content?.tr?.shortDesc) || 'Santis Club imzalı kusursuz deneyim.';
                    const imagePath = item.media?.thumbnail || item.image || item.img || '/assets/img/cards/santis_card_recovery_lotion_v2.webp';
                    const isPriority = item._biometricFlag || (idx === 0) ? 'Apple Health Tavsiyesi' : false;
                    const priceRaw = item.price?.amount || item.price_eur || 0;
                    const price = priceRaw > 0 ? priceRaw + ' €' : 'Özel';
                    const dur = item.duration || '30';
                    const detailUrl = item.detailUrl || item.url || `/hamam.html${item.slug || item.id}.html`;

                    oracleHtml += `
                    <a href="${detailUrl}" class="matrix-service-card" style="flex-shrink: 0; scroll-snap-align: start; width: 480px; height: 600px; border-radius: 20px; overflow: hidden; border: ${isPriority ? '2px solid #d4af37' : '2px solid transparent'}; position: relative; background: #080808; text-decoration: none; display: flex; flex-direction: column; justify-content: flex-end; opacity: 0; transform: translateY(20px); transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease; animation: fadeIn 0.5s ease forwards ${idx * 0.05}s;">
                        <img class="top-0 w-full" src="${imagePath}" alt="${title}" ${idx < 2 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" fetchpriority="low"'} decoding="async" style="position: absolute; left:0; height: 100%; object-fit: cover; opacity: 0.8; transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1); z-index: 0;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.onerror=null;this.src='/assets/img/luxury-placeholder.webp'">
                        <div class="top-0 w-full" style="position: absolute; left:0; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(5,5,5,0.98) 100%); z-index: 1;"></div>
                        
                        ${isPriority ? `<div class="flex" style="position: absolute; top: 20px; right: 20px; z-index: 3; background: rgba(212,175,55,0.9); backdrop-filter: blur(4px); padding: 6px 14px; border-radius: 20px; align-items: center; gap: 6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                            <span style="font-family: 'Inter', sans-serif; font-size: 0.75rem; color: #fff; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">${isPriority}</span>
                        </div>` : ''}

                        <div class="relative flex w-full" style="z-index: 2; padding: 40px 32px; flex-direction: column; gap: 12px;">
                            <span style="font-family: 'Inter', sans-serif; font-size: 0.75rem; color: #d4af37; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">${dur} DK. RİTÜELİ</span>
                            <h3 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; color: #fff; margin:0; line-height: 1.1; font-weight: 400;">${title}</h3>
                            <p style="font-family: 'Inter', sans-serif; font-size: 1.05rem; color: rgba(255,255,255,0.6); margin:0; line-height: 1.5; font-weight: 300; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${shortDesc}</p>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
                                <div class="flex" style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; flex-direction: column; gap: 6px;">
                                    <span style="color: rgba(255,255,255,0.4); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Süre</span>
                                    <span class="text-white" style="font-size: 1.1rem; font-family:;'Inter', sans-serif;">${dur} Dakika</span>
                                </div>
                                <div class="flex" style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; flex-direction: column; gap: 6px;">
                                    <span style="color: rgba(255,255,255,0.4); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Yatırım</span>
                                    <span class="text-[#d4af37]" style="font-size: 1.1rem; font-family:;'Inter', sans-serif; font-weight: 500;">${price}</span>
                                </div>
                            </div>
                        </div>
                    </a>`;
                    
                    if ((idx + 1) % CHUNK_SIZE_ORACLE === 0) {
                        await yieldToMain();
                    }
                } // End for loop

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
