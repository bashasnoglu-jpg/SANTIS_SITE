/**
 * SANTIS V10 SOVEREIGN HYBRID RENDERER
 * Engine: Hamam & Rituals
 * Architecture: Object Pool + DOM Recycling + Viewport Virtualization
 */

export async function init(signal) {
    if (signal?.aborted) return;
    console.log("[Sovereign Engine] 🩸 Hybrid Renderer Booting...");
    new HamamHybridRenderer().init();
}

class HamamHybridRenderer {

    constructor() {
        // Essential DOM Connections
        this.cards = document.querySelectorAll(".bento-card");
        this.matrixContainer = document.getElementById('santis-data-matrix-grid');
        this.railContainer = document.querySelector('#sovereign-mask-rail .rail-container');

        // Hybrid Renderer Core 
        this.pool = [];
        this.POOL_SIZE = 10; // 10 Giant Cards (Apple Pro Standard)
        this.visibleCount = 10; // Viewport limit
        this.data = [];

        // State Engine (Future Global State Prep)
        this.cart = {
            hamam: null,
            mask: null
        };

        this.masks = [
            { id: 'm1', title: 'Sothys Altın Maske', desc: 'Yaşlanma karşıtı 24K onarım.', price: 30, img: '/assets/img/cards/santis_card_skincare_lux.webp' },
            { id: 'm2', title: 'Havyar Göz Çevresi', desc: 'Havyar özlü yoğun göz çevresi bakımı.', price: 25, img: '/assets/img/cards/santis_card_skincare_detail_v2.webp' },
            { id: 'm3', title: 'Volkanik Kil Maskesi', desc: 'Derin gözenek temizliği ve sebum dengesi.', price: 20, img: '/assets/img/cards/santis_card_skincare_clay_v2.webp' },
            { id: 'm4', title: 'Aloe Vera Yoğun Nem', desc: 'Güneş sonrası acil nem ve yatıştırma.', price: 20, img: '/assets/img/cards/santis_card_skincare_v1.webp' },
            { id: 'm5', title: 'C Vitamini Parlaklık', desc: 'Solgun ciltler için aydınlatıcı C vitamini bombası.', price: 25, img: '/assets/img/cards/santis_card_recovery_lotion_v2.webp' },
            { id: 'm6', title: 'Oksijen Terapisi', desc: 'Hücre yenilenmesini hızlandıran oksijen kürü.', price: 35, img: '/assets/img/cards/santis_card_skin_advanced.webp' }
        ];

        this.initCartUI();
    }

    async init() {
        // V11 PHASE 1: Cinematic Entrance
        this.initCinematicEntrance();

        // Step 1: Pre-warm the Object Pool (createElement spam suppression)
        if (this.matrixContainer) this.initObjectPool();

        // Step 2: Parallax initialization
        if (this.cards.length > 0) this.initScroll();

        // Step 3: Data Load & Virtualization Trigger
        if (this.matrixContainer) {
            await this.loadDataMatrix();
            this.renderOracleLineup(); // V11 Phase 2: Biometric Matrix
            this.renderMasks();
            this.initDesignStudio(); // V11 Phase 4: Design Studio Configurator Options
        }
    }

    // ==========================================
    // V11: CINEMATIC ENTRANCE
    // ==========================================
    initCinematicEntrance() {
        if (typeof gsap === 'undefined') return;

        const entranceElement = document.getElementById('v11-cinematic-entrance');
        const logo = document.getElementById('v11-entrance-logo');
        const hint = document.getElementById('v11-entrance-hint');

        if (!entranceElement || !logo) return;

        // 1. Lock scroll initially
        if (window.SovereignScroll) window.SovereignScroll.lock();

        // 2. Initial Animation (Fade In)
        gsap.to(entranceElement, { opacity: 1, duration: 0.5 });
        gsap.to(logo, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out", delay: 0.2 });

        // 3. User Interaction Hook (Neuro-Acoustic Trigger)
        entranceElement.addEventListener('click', () => {
            // Neuro-Acoustic 432Hz WebAudio API Stub
            this.playGodModeAcoustic();

            // Smooth fade out into Sovereign Light
            gsap.to(hint, { opacity: 0, duration: 0.3 });
            gsap.to(logo, { opacity: 0, y: -20, duration: 0.5, ease: "power1.in" });

            gsap.to(entranceElement, {
                yPercent: -100,
                duration: 1.5,
                ease: "expo.inOut",
                delay: 0.2,
                onComplete: () => {
                    entranceElement.style.display = 'none';
                    if (window.SovereignScroll) window.SovereignScroll.unlock();
                }
            });
        }, { once: true });
    }

    playGodModeAcoustic() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(432, ctx.currentTime); // 432Hz Healing Frequency

            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1); // Subtle sub-bass
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 4);
        } catch (e) {
            console.log("[Sovereign Acoustics] Hardware bypass.");
        }
    }

    // ==========================================
    // V11: ORACLE LINEUP (BIOMETRIC MATRIX)
    // ==========================================
    renderOracleLineup() {
        const oracleGrid = document.getElementById('oracle-icons-grid');
        if (!oracleGrid) return;

        // Mock Biometric Data (Normally fetched via HealthKit/IoT Sync)
        const mockHealthStatus = "insomnia"; // User needs sleep

        // Filter for Phase 11 Vertical Pro: Max 8 Items, 30 Mins (Express), Hamam/Scrub/Foam focus
        let quickAccessList = [...this.data]
            .filter(s => {
                const c = (s.categoryId || s.category || '').toLowerCase();
                const isHamam = c.includes('hammam') || c.startsWith('ritual-hammam') || c === 'hamam';
                const isShort = s.duration === 30 || (s.duration && typeof s.duration === 'string' && s.duration.includes('30'));
                return isHamam && isShort;
            })
            .slice(0, 8);

        // Fallback if not enough 30-min services found in JSON
        if (quickAccessList.length < 8) {
            const fillers = [...this.data].filter(s => s.duration === 45 || s.duration === 50).slice(0, 8 - quickAccessList.length);
            quickAccessList = [...quickAccessList, ...fillers];
        }

        // Biometric algorithmic sorting (Mock IoT)
        if (mockHealthStatus === "insomnia") {
            const sleepTherapyIndex = quickAccessList.findIndex(s => s.id.includes('masaj') || s.name.toLowerCase().includes('rahat'));
            if (sleepTherapyIndex > -1) {
                const sleepItem = quickAccessList.splice(sleepTherapyIndex, 1)[0];
                sleepItem._biometricFlag = "Apple Health Tavsiyesi";
                quickAccessList.unshift(sleepItem); // Push to first
            }
        }

        let html = '';
        quickAccessList.forEach((item, idx) => {
            const trContent = item.content?.tr || { title: item.name };
            const imagePath = item.media?.thumbnail || item.image || '/assets/img/cards/santis_card_recovery_lotion_v2.webp';
            const isPriority = item._biometricFlag ? true : false;
            const price = item.price?.amount || item.price_eur || 0;
            const detailUrl = item.detailUrl || item.url || `/tr/hamam/detay.html?id=${item.id}`;
            const dataPayload = JSON.stringify({ id: item.id, title: trContent.title, price: price, url: detailUrl });

            const shortDesc = trContent.shortDesc || item.description || 'Santis Club imzalı kusursuz deneyim.';
            const dur = item.duration ? item.duration + ' DK.' : '30 DK. EXPRESS';

            html += `
            <div class="hamam-item matrix-service-card" data-item='${dataPayload}' style="flex-shrink: 0; scroll-snap-align: start; width: 480px; height: 620px; border-radius: 20px; overflow: hidden; border: ${isPriority ? '2px solid #d4af37' : '2px solid transparent'}; position: relative; background: #080808; cursor: pointer; opacity: 0; animation: fadeIn 0.5s ease forwards ${idx * 0.1}s; display: flex; flex-direction: column; justify-content: flex-end; transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);">
                <img class="sv-cover" src="${imagePath}" alt="${trContent.title}" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; opacity: 0.8; transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1); z-index: 0;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <div class="card-gradient" style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(5,5,5,0.98) 100%); z-index: 1;"></div>
                
                ${isPriority ? `<div style="position: absolute; top: 20px; right: 20px; z-index: 3; background: rgba(212,175,55,0.9); backdrop-filter: blur(4px); padding: 6px 14px; border-radius: 20px; display: flex; align-items: center; gap: 6px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                    <span style="font-family: 'Inter', sans-serif; font-size: 0.75rem; color: #fff; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">${item._biometricFlag}</span>
                </div>` : ''}

                <div style="position: relative; z-index: 2; padding: 40px 32px; display: flex; flex-direction: column; gap: 12px; width: 100%;">
                    <span class="sv-subtitle" style="font-family: 'Inter', sans-serif; font-size: 0.75rem; color: #d4af37; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">${dur} RİTÜELİ</span>
                    <h3 class="sv-title" style="font-family: 'Playfair Display', serif; font-size: 2.2rem; color: #fff; margin:0; line-height: 1.1; font-weight: 400;">${trContent.title}</h3>
                    <p class="sv-desc" style="font-family: 'Inter', sans-serif; font-size: 1.05rem; color: rgba(255,255,255,0.6); margin:0; line-height: 1.5; font-weight: 300; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${shortDesc}</p>
                    
                    <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between;">
                        <div class="apple-link-btn select-btn" style="display: inline-flex; align-items: center; gap: 8px; color: #0071e3; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 1.1rem; cursor: pointer; transition: opacity 0.3s ease;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
                            Ritüeli Yapılandır
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                        </div>
                    </div>

                    <div class="sv-spec-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 6px;">
                            <span style="color: rgba(255,255,255,0.4); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Süre</span>
                            <span class="sv-spec-duration" style="color: #fff; font-size: 1.1rem; font-family: 'Inter', sans-serif;">${item.duration || '30'} Dakika</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 6px;">
                            <span style="color: rgba(255,255,255,0.4); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Yatırım</span>
                            <span class="sv-price" style="color: #d4af37; font-size: 1.1rem; font-family: 'Inter', sans-serif; font-weight: 500;">${price > 0 ? price + ' €' : 'Özel'}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        });

        oracleGrid.innerHTML = html;

        // Desktop Mouse Drag to Scroll for Oracle Lineup
        if (oracleGrid) {
            oracleGrid.style.scrollBehavior = 'auto';
            oracleGrid.style.WebkitOverflowScrolling = 'touch';
            oracleGrid.style.cursor = 'grab';

            let isDown = false;
            let startX;
            let containerScrollLeft;

            const mdHandler = (e) => {
                isDown = true;
                oracleGrid.style.cursor = 'grabbing';
                oracleGrid.style.scrollSnapType = 'none';
                startX = e.pageX - oracleGrid.offsetLeft;
                containerScrollLeft = oracleGrid.scrollLeft;
            };

            const mlHandler = () => {
                isDown = false;
                oracleGrid.style.cursor = 'grab';
                oracleGrid.style.scrollSnapType = 'x mandatory';
            };

            const mmHandler = (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - oracleGrid.offsetLeft;
                const walk = (x - startX) * 1.5;
                oracleGrid.scrollLeft = containerScrollLeft - walk;
            };

            oracleGrid.removeEventListener('mousedown', oracleGrid._mdHandler);
            oracleGrid.removeEventListener('mouseleave', oracleGrid._mlHandler);
            oracleGrid.removeEventListener('mouseup', oracleGrid._mlHandler);
            oracleGrid.removeEventListener('mousemove', oracleGrid._mmHandler);

            oracleGrid._mdHandler = mdHandler;
            oracleGrid._mlHandler = mlHandler;
            oracleGrid._mmHandler = mmHandler;

            oracleGrid.addEventListener('mousedown', oracleGrid._mdHandler);
            oracleGrid.addEventListener('mouseleave', oracleGrid._mlHandler);
            oracleGrid.addEventListener('mouseup', oracleGrid._mlHandler);
            oracleGrid.addEventListener('mousemove', oracleGrid._mmHandler);
        }

        // Attach click listeners to Oracle Cards
        this.attachSelectListeners('#oracle-icons-grid .hamam-item', 'hamam');

        // CSS Animation for fade-in
        if (!document.getElementById('oracle-styles')) {
            const style = document.createElement('style');
            style.id = 'oracle-styles';
            style.innerHTML = `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
            document.head.appendChild(style);
        }
    }

    // ==========================================
    // HYBRID RENDERER: OBJECT POOL
    // ==========================================
    initObjectPool() {
        for (let i = 0; i < this.POOL_SIZE; i++) {
            const card = document.createElement("div");
            card.className = "matrix-service-card hamam-item";
            card.style.cssText = `flex-shrink: 0; scroll-snap-align: start; width: 480px; height: 620px; border-radius: 20px; overflow: hidden; position: relative; display: none; flex-direction: column; justify-content: flex-end; transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; border: 2px solid transparent; background: #080808;`;

            card.innerHTML = `
                <img class="sv-cover" src="" alt="Santis Service" style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; opacity: 0.8; transition: transform 1.2s cubic-bezier(0.16, 1, 0.3, 1); z-index: 0;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <div class="card-gradient" style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(5,5,5,0.98) 100%); z-index: 1;"></div>
                
                <div style="position: relative; z-index: 2; padding: 40px 32px; display: flex; flex-direction: column; gap: 12px; width: 100%;">
                    <span class="sv-subtitle" style="font-family: 'Inter', sans-serif; font-size: 0.75rem; color: #d4af37; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">SPA RİTÜELİ</span>
                    <h3 class="sv-title" style="font-family: 'Playfair Display', serif; font-size: 2.2rem; color: #fff; margin:0; line-height: 1.1; font-weight: 400;"></h3>
                    <p class="sv-desc" style="font-family: 'Inter', sans-serif; font-size: 1.05rem; color: rgba(255,255,255,0.6); margin:0; line-height: 1.5; font-weight: 300; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"></p>
                    
                    <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between;">
                        <div class="apple-link-btn select-btn" style="display: inline-flex; align-items: center; gap: 8px; color: #0071e3; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 1.1rem; cursor: pointer; transition: opacity 0.3s ease;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">
                            Ritüeli Yapılandır
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                        </div>
                    </div>

                    <div class="sv-spec-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 6px;">
                            <span style="color: rgba(255,255,255,0.4); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Süre</span>
                            <span class="sv-spec-duration" style="color: #fff; font-size: 1.1rem; font-family: 'Inter', sans-serif;">60 Dakika</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 6px;">
                            <span style="color: rgba(255,255,255,0.4); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Yatırım</span>
                            <span class="sv-price" style="color: #d4af37; font-size: 1.1rem; font-family: 'Inter', sans-serif; font-weight: 500;"></span>
                        </div>
                    </div>
                </div>
            `;

            this.pool.push(card);
            this.matrixContainer.appendChild(card);
        }
        console.log(`[Sovereign Renderer] Object Pool Warmed: ${this.POOL_SIZE} DOM elements ready.`);

        // Desktop Mouse Drag to Scroll (Grab & Pull) & Wheel Translation
        if (this.matrixContainer) {
            this.matrixContainer.style.scrollBehavior = 'auto';
            this.matrixContainer.style.WebkitOverflowScrolling = 'touch';
            this.matrixContainer.style.cursor = 'grab';

            let isDown = false;
            let startX;
            let containerScrollLeft;

            this.matrixContainer.addEventListener('mousedown', (e) => {
                isDown = true;
                this.matrixContainer.style.cursor = 'grabbing';
                this.matrixContainer.style.scrollSnapType = 'none'; // Disable snap for smooth dragging
                startX = e.pageX - this.matrixContainer.offsetLeft;
                containerScrollLeft = this.matrixContainer.scrollLeft;
            });

            this.matrixContainer.addEventListener('mouseleave', () => {
                isDown = false;
                this.matrixContainer.style.cursor = 'grab';
                this.matrixContainer.style.scrollSnapType = 'x mandatory';
            });

            this.matrixContainer.addEventListener('mouseup', () => {
                isDown = false;
                this.matrixContainer.style.cursor = 'grab';
                this.matrixContainer.style.scrollSnapType = 'x mandatory';
            });

            this.matrixContainer.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault(); // Prevent text/image selection while dragging
                const x = e.pageX - this.matrixContainer.offsetLeft;
                const walk = (x - startX) * 1.5; // Drag speed multiplier
                this.matrixContainer.scrollLeft = containerScrollLeft - walk;
            });
        }
    }

    // ==========================================
    // HYBRID RENDERER: DOM RECYCLING
    // ==========================================
    updateCard(cardDOM, dataItem) {
        const trContent = dataItem.content?.tr || { title: dataItem.name, shortDesc: dataItem.description || "" };
        const price = dataItem.price?.amount || dataItem.price_eur || 0;
        const imagePath = dataItem.image || (dataItem.media?.hero ? `/assets/img/cards/${dataItem.media.hero}` : '/assets/img/cards/santis_card_hammam_lux.webp');
        const detailUrl = dataItem.detailUrl || dataItem.url || `/tr/hamam/detay.html?id=${dataItem.id}`;
        const dataPayload = JSON.stringify({ id: dataItem.id, title: trContent.title, price: price, url: detailUrl });
        const dur = dataItem.duration ? dataItem.duration + ' DK.' : 'SPA';

        // Update values without recreating DOM
        cardDOM.querySelector('.sv-cover').src = imagePath;
        cardDOM.querySelector('.sv-cover').alt = trContent.title;
        cardDOM.querySelector('.sv-title').textContent = trContent.title;
        cardDOM.querySelector('.sv-subtitle').textContent = dur + ' RİTÜELİ';
        cardDOM.querySelector('.sv-desc').textContent = trContent.shortDesc || dataItem.description || 'Santis Club imzalı özel deneyim.';
        cardDOM.querySelector('.sv-spec-duration').textContent = dataItem.duration ? dataItem.duration + ' Dakika' : 'Özel';
        cardDOM.querySelector('.sv-price').textContent = price > 0 ? price + ' €' : 'Özel';
        cardDOM.setAttribute('data-item', dataPayload);

        // Show element (if hidden)
        cardDOM.style.display = 'flex';

        // Reset dynamic UI state for recycled card
        const isSelected = this.cart.hamam && this.cart.hamam.id === dataItem.id;
        cardDOM.style.borderColor = isSelected ? '#d4af37' : 'transparent';
        const btn = cardDOM.querySelector('.select-btn');
        if (btn) {
            if (isSelected) {
                btn.style.color = '#d4af37';
                btn.innerHTML = `SEÇİLDİ <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            } else {
                btn.style.color = '#0071e3';
                btn.innerHTML = `Ritüeli Yapılandır <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>`;
            }
        }
    }

    // ==========================================
    // HYBRID RENDERER: VIEWPORT VIRTUALIZATION
    // ==========================================
    renderViewport(startIndex = 0) {
        const end = Math.min(startIndex + this.visibleCount, this.data.length);
        const activeSlice = this.data.slice(startIndex, end);

        // Update required cards
        activeSlice.forEach((item, i) => {
            if (this.pool[i]) this.updateCard(this.pool[i], item);
        });

        // Hide unused cards in the pool
        for (let i = activeSlice.length; i < this.POOL_SIZE; i++) {
            if (this.pool[i]) this.pool[i].style.display = 'none';
        }

        // Re-attach listeners to the recycled active nodes
        this.attachSelectListeners('.hamam-item', 'hamam');
        if (window.SantisMagnetic) {
            window.SantisMagnetic.items = document.querySelectorAll('.magnetic-btn');
            window.SantisMagnetic.init();
        }
    }

    async loadDataMatrix() {
        try {
            const response = await fetch('/assets/data/services.json');
            if (!response.ok) throw new Error("HTTP Status " + response.status);

            const fullData = await response.json();
            this.data = fullData.filter(s => s.categoryId === 'ritual-hammam' || s.category === 'hammam' || s.id.includes('hamam'));

            if (this.data.length === 0) return;

            // Initial Render of first block
            this.renderViewport(0);

            // Phase 8: IntersectionObserver (Scroll Pipeline Trigger)
            const obsOptions = { root: null, rootMargin: "200px", threshold: 0 };
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Example: infinite scroll / lazy-load trigger
                        console.log("[Sovereign Renderer] Matrix in viewport. Checking constraints.");
                        // For a dataset > 18, we would increment startIndex here and re-renderViewport().
                        // Current dataset is 9 items, fitting perfectly into the initial slice.
                    }
                });
            }, obsOptions);

            observer.observe(this.matrixContainer);

        } catch (error) {
            console.error("[Sovereign Core] Data Matrix Load Failed:", error);
        }
    }

    // ==========================================
    // LEGACY METHODS & UI LOGIC
    // ==========================================
    initScroll() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.utils.toArray(this.cards).forEach((card, i) => {
            gsap.to(card, {
                yPercent: 10 + (i * 2),
                ease: "none",
                scrollTrigger: { trigger: card, scrub: true, start: "top bottom", end: "bottom top" }
            });
        });
    }

    renderMasks() {
        if (!this.railContainer) return;
        let html = '';
        this.masks.forEach(m => {
            const dataPayload = JSON.stringify({ id: m.id, title: m.title, price: m.price });
            html += `
            <div class="mask-item" data-item='${dataPayload}' style="min-width: 280px; width: 280px; border-radius: 16px; overflow: hidden; background: #111; position: relative; scroll-snap-align: start; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); transition: border-color 0.3s ease;">
                <img src="${m.img}" alt="${m.title}" style="width: 100%; height: 180px; object-fit: cover; opacity: 0.8;">
                <div style="padding: 20px;">
                    <h4 style="font-family: 'Playfair Display', serif; color: #fff; margin:0 0 8px 0; font-size: 1.2rem;">${m.title}</h4>
                    <p style="color: rgba(255,255,255,0.6); font-family: 'Inter', sans-serif; font-size: 0.85rem; margin:0 0 16px 0;">${m.desc}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #d4af37; font-size: 1.1rem; font-family: 'Inter', sans-serif;">+${m.price} €</span>
                        <div class="select-indicator" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; transition: all 0.3s ease;"></div>
                    </div>
                </div>
            </div>`;
        });
        this.railContainer.innerHTML = html;
        this.attachSelectListeners('.mask-item', 'mask');
    }

    attachSelectListeners(selector, type) {
        const items = document.querySelectorAll(selector);
        items.forEach(el => {
            // Prevent duplicate listeners without destroying the internal DOM reference
            if (el._listenerAttached) return;
            el._listenerAttached = true;

            el.addEventListener('click', (e) => {
                const dataStr = el.getAttribute('data-item');
                if (!dataStr) return;
                const data = JSON.parse(dataStr);

                // Bi-directional Routing: Design Studio Select vs Detail Page Open
                const isSelectButton = e.target.closest('.select-btn') || e.target.closest('.select-indicator');

                console.log(`[Router] Card Clicked! ID: ${data.id}, isSelectBtn: ${Boolean(isSelectButton)}`);

                if (isSelectButton) {
                    // CART TOGGLE LOGIC
                    console.log(`[Router] Toggling Target in Cart.`);
                    if (this.cart[type] && this.cart[type].id === data.id) {
                        this.cart[type] = null; // deselect
                    } else {
                        this.cart[type] = data; // select
                    }

                    this.updateUISelection(selector, type);

                    // Phase 4/5 integration triggers
                    if (typeof this.updateCartOverlay === 'function') {
                        this.updateCartOverlay();
                    }

                    // SantisBus Global Event Dispatch
                    if (window.SantisBus) {
                        window.SantisBus.dispatchEvent(new CustomEvent("combo:selected", { detail: this.cart }));
                    }
                } else {
                    // DETAIL PAGE NAVIGATION
                    console.log(`[Router] Opening Details for: ${data.url}`);
                    if (window.SovereignVault) {
                        console.log(`[Router] SovereignVault detected, opening overlay...`);
                        window.SovereignVault.open({ id: data.id, title: data.title, isProduct: false });
                    } else if (data.url) {
                        console.log(`[Router] Vault not found, redirecting to: ${data.url}`);
                        window.location.href = data.url;
                    } else {
                        console.error("[Router] No URL or Vault available for this item.");
                    }
                }
            });
        });
    }

    updateUISelection(selector, type) {
        const items = document.querySelectorAll(selector);
        items.forEach(el => {
            // Null check handling for recycled DOM nodes that might be hidden or missing item strings
            const dataStr = el.getAttribute('data-item');
            if (!dataStr) return;

            const data = JSON.parse(dataStr);
            const isSelected = this.cart[type] && this.cart[type].id === data.id;

            if (type === 'hamam') {
                el.style.borderColor = isSelected ? '#d4af37' : 'transparent';
                const btn = el.querySelector('.select-btn');

                // Safe check if card doesn't have a select text button (like Oracle cards)
                if (btn) {
                    if (isSelected) {
                        btn.style.color = '#d4af37';
                        btn.innerHTML = `SEÇİLDİ <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    } else {
                        btn.style.color = '#0071e3';
                        btn.innerHTML = `Ritüeli Yapılandır <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>`;
                    }
                }
            } else if (type === 'mask') {
                el.style.borderColor = isSelected ? '#d4af37' : 'rgba(255,255,255,0.05)';
                const indicator = el.querySelector('.select-indicator');
                if (isSelected) {
                    indicator.style.background = '#d4af37';
                    indicator.style.borderColor = '#d4af37';
                    indicator.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                } else {
                    indicator.style.background = 'transparent';
                    indicator.innerHTML = '';
                    indicator.style.borderColor = 'rgba(255,255,255,0.3)';
                }
            }
        });

        this.updateCartOverlay();
    }

    initCartUI() {
        // Obsolete UI: Cart Overlay is replaced by Phase 4: Sticky Buy Bar
        this.initGodModeBridge();
    }

    updateCartOverlay() {
        // Redirecting calculation to Phase 4 V11 Design Studio Logic
        this.updateV11DesignStudio();
    }

    // ==========================================
    // V11: THE DESIGN STUDIO (PHASE 4 & 5)
    // ==========================================
    initDesignStudio() {
        const options = document.querySelectorAll('.studio-option');
        if (!options.length) return;

        const previewImg = document.getElementById('studio-main-preview');

        options.forEach(opt => {
            opt.addEventListener('click', () => {
                options.forEach(o => {
                    o.classList.remove('active');
                    o.style.borderColor = 'rgba(0,0,0,0.1)';
                    const indicator = o.querySelector('div:first-child');
                    if (indicator) indicator.style.border = '1px solid rgba(0,0,0,0.1)';
                });

                opt.classList.add('active');
                opt.style.borderColor = '#d4af37';
                const div = opt.querySelector('div:first-child');
                if (div) div.style.border = '2px solid #d4af37';

                if (previewImg) {
                    previewImg.style.transition = 'opacity 0.3s ease';
                    previewImg.style.opacity = '0';
                    setTimeout(() => {
                        previewImg.src = opt.dataset.oil === 'amber'
                            ? '/assets/img/cards/santis_card_recovery_lotion_v2.webp'
                            : '/assets/img/cards/santis_card_body_scrub.webp';
                        previewImg.style.opacity = '0.9';
                    }, 300);
                }
            });
        });
    }

    updateV11DesignStudio() {
        const titleEl = document.getElementById('buy-bar-title');
        const priceEl = document.getElementById('buy-bar-price');
        const buyBar = document.getElementById('sticky-buy-bar');

        if (!titleEl || !priceEl || !buyBar) return;

        let total = 0;
        let summaryParts = [];

        if (this.cart.hamam) {
            total += this.cart.hamam.price;
            summaryParts.push(this.cart.hamam.title);
        }
        if (this.cart.mask) {
            total += this.cart.mask.price;
            summaryParts.push(`+ ${this.cart.mask.title}`);
        }

        // V11 Default Values if nothing selected
        if (total === 0) {
            titleEl.innerText = "Sovereign Seçim Bekleniyor";
            priceEl.innerText = "Yapılandırın";
            this.resetSovereignBlack();
            return;
        }

        titleEl.innerText = summaryParts.join(' ');

        // V11 Phase 5: Sovereign Black Threshold (€1,200)
        if (total >= 1200) {
            priceEl.innerText = `Sovereign Black €${total}`;
            this.triggerSovereignBlack();
        } else {
            priceEl.innerText = `Pay €${(total / 12).toFixed(2)}/mo. for 12 mo.*`;
            this.resetSovereignBlack();
        }
    }

    triggerSovereignBlack() {
        // Vantablack Environmental Override
        document.body.style.transition = 'background-color 2s ease, color 2s ease';
        document.body.style.backgroundColor = '#050505';

        const buyBar = document.getElementById('sticky-buy-bar');
        if (buyBar) {
            buyBar.style.background = 'rgba(5,5,5,0.9)';
            buyBar.style.borderTop = '1px solid rgba(212,175,55,0.3)';
        }

        const titleText = document.getElementById('buy-bar-title');
        if (titleText) titleText.style.color = 'rgba(255,255,255,0.6)';

        const priceText = document.getElementById('buy-bar-price');
        if (priceText) priceText.style.color = '#d4af37';

        const godButton = document.getElementById('btn-god-mode-checkout');
        if (godButton) {
            godButton.style.background = 'linear-gradient(135deg, #d4af37, #f3e5ab)';
            godButton.style.color = '#000';
            godButton.innerText = 'SOVEREIGN ONAYI';

            // WebHaptics Heavy Impact
            if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
        }
    }

    resetSovereignBlack() {
        document.body.style.backgroundColor = '';

        const buyBar = document.getElementById('sticky-buy-bar');
        if (buyBar) {
            buyBar.style.background = 'rgba(255,255,255,0.9)';
            buyBar.style.borderTop = '1px solid rgba(0,0,0,0.1)';
        }

        const titleText = document.getElementById('buy-bar-title');
        if (titleText) titleText.style.color = 'rgba(0,0,0,0.5)';

        const priceText = document.getElementById('buy-bar-price');
        if (priceText) priceText.style.color = '#111';

        const godButton = document.getElementById('btn-god-mode-checkout');
        if (godButton) {
            godButton.style.background = '#111';
            godButton.style.color = '#fff';
            godButton.innerText = 'REZERVASYONU ONAYLA';
        }
    }

    // ==========================================
    // V11: GOD MODE API (PHYGITAL BRIDGE)
    // ==========================================
    initGodModeBridge() {
        const checkoutBtn = document.getElementById('btn-god-mode-checkout');
        if (!checkoutBtn) return;

        checkoutBtn.addEventListener('click', () => {
            const isSovereign = this.cart.hamam && (this.cart.hamam.price + (this.cart.mask ? this.cart.mask.price : 0)) >= 1200;

            console.log("=====================================");
            console.log("🌐 [Sovereign IoT Gateway] Pinging Facility...");
            console.log(`📡 Room Environment: ${isSovereign ? 'Vantablack & Gold' : 'Apple Light'}`);
            console.log(`🌡 Oil Pre-Heat: 42°C initiated.`);
            console.log(`🎵 Neuro-Acoustics: 432Hz ambient loop started.`);
            console.log("=====================================");

            // Haptic Payment Success
            if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]);

            checkoutBtn.innerHTML = '<span style="display: flex; align-items: center; gap: 8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> APPLE WALLET EKLENDİ</span>';
            checkoutBtn.style.pointerEvents = 'none';
        });

        // Configurator Studio Option Toggles
        const options = document.querySelectorAll('.studio-option');
        options.forEach(opt => {
            opt.addEventListener('click', (e) => {
                // Sibling deselect logic for demo purposes
                const siblings = opt.parentElement.querySelectorAll('.studio-option');
                siblings.forEach(s => {
                    s.classList.remove('active');
                    s.style.border = '1px solid rgba(0,0,0,0.1)';
                    s.style.background = 'transparent';
                    s.style.boxShadow = 'none';
                });

                opt.classList.add('active');

                // Oil choice trigger: Haptics & Visuals
                if (opt.dataset.oil) {
                    opt.style.border = '2px solid #d4af37';
                    opt.style.background = 'rgba(212,175,55,0.05)';
                    opt.style.boxShadow = '0 8px 24px rgba(212,175,55,0.15)';
                    if (navigator.vibrate) navigator.vibrate(20); // Light taptic click

                    const preview = document.getElementById('studio-main-preview');
                    if (preview) {
                        preview.style.opacity = '0';
                        setTimeout(() => {
                            preview.src = opt.dataset.oil === 'amber'
                                ? '/assets/img/cards/santis_card_recovery_lotion_v2.webp'
                                : '/assets/img/cards/santis_card_body_scrub.webp';
                            preview.style.opacity = '0.9';
                        }, 300);
                    }
                } else {
                    opt.style.border = '2px solid #111';
                    opt.style.background = 'rgba(0,0,0,0.02)';
                }
            });
        });
    }
}

// Global Export Hook for SantisBootloader Omni-Routing
window.HamamHybridRenderer = HamamHybridRenderer;

// Fallback execution if the bootloader hasn't wrapped it up
// Note: Handled autonomously via Sovereign OS dispatch map.
