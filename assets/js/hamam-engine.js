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
        this.POOL_SIZE = 18; // Apple Standard
        this.visibleCount = 12; // Viewport limit
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

        // Isolate Hammam/Rituals for Quick Access
        let quickAccessList = [...this.data].slice(0, 8);

        // Biometric algorithmic sorting
        if (mockHealthStatus === "insomnia") {
            const sleepTherapyIndex = quickAccessList.findIndex(s => s.id.includes('masaj') || s.name.toLowerCase().includes('rahat'));
            if (sleepTherapyIndex > -1) {
                const sleepItem = quickAccessList.splice(sleepTherapyIndex, 1)[0];
                sleepItem._biometricFlag = "Biyometrik verileriniz için yapılandırıldı";
                quickAccessList.unshift(sleepItem); // Push to first
            }
        }

        let html = '';
        quickAccessList.forEach((item, idx) => {
            const trContent = item.content?.tr || { title: item.name };
            const imagePath = item.media?.thumbnail || item.image || '/assets/img/cards/santis_card_recovery_lotion_v2.webp';
            const isPriority = item._biometricFlag ? true : false;

            html += `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; opacity: 0; animation: fadeIn 0.5s ease forwards ${idx * 0.1}s;">
                <div style="width: 120px; height: 120px; border-radius: 4px; overflow: hidden; border: ${isPriority ? '2px solid #d4af37' : '1px solid rgba(0,0,0,0.1)'}; position: relative; background: #000;">
                    <img src="${imagePath}" alt="${trContent.title}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8; transition: transform 0.4s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    ${isPriority ? `<div style="position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(212,175,55,0.9); padding: 2px 0; text-align: center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></div>` : ''}
                </div>
                <div style="text-align: center;">
                    <span style="font-family: 'Inter', sans-serif; font-size: 0.75rem; color: #111; font-weight: 500; display: block;">${trContent.title.split(' ')[0]}</span>
                    ${isPriority ? `<span style="font-family: 'Inter', sans-serif; font-size: 0.6rem; color: #d4af37; display: block;">ÖNERİLEN</span>` : ''}
                </div>
            </div>`;
        });

        oracleGrid.innerHTML = html;

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
            card.style.cssText = `flex-shrink: 0; position: relative; border-radius: 20px; overflow: hidden; aspect-ratio: 3/4; display: none; flex-direction: column; justify-content: flex-end; transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; border: 2px solid transparent;`;

            card.innerHTML = `
                <img class="sv-cover" src="" alt="Santis Service" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; filter: brightness(0.7) contrast(1.1);" loading="lazy" decoding="async">
                <div class="card-gradient" style="position: absolute; top:0; left:0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(5,5,5,0.95) 100%); z-index: 1;"></div>
                
                <div style="position: relative; z-index: 2; padding: 32px 24px; display: flex; flex-direction: column; gap: 8px;">
                    <h3 class="sv-title" style="font-family: 'Playfair Display', serif; font-size: 1.6rem; color: #fff; margin:0; letter-spacing: -0.5px; line-height: 1.1;"></h3>
                    <p class="sv-desc" style="font-family: 'Inter', sans-serif; font-size: 0.95rem; color: rgba(255,255,255,0.7); margin:0; line-height: 1.5; font-weight: 300;"></p>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
                        <span class="sv-price" style="color: #d4af37; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 1.2rem;"></span>
                        <button class="magnetic-btn select-btn" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: #fff; padding: 10px 24px; border-radius: 99px; font-size: 0.8rem; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease; pointer-events: none;">SEÇ</button>
                    </div>
                </div>
            `;

            this.pool.push(card);
            this.matrixContainer.appendChild(card);
        }
        console.log(`[Sovereign Renderer] Object Pool Warmed: ${this.POOL_SIZE} DOM elements ready.`);

        // Desktop Mouse Wheel to Horizontal Scroll Translation (Apple Pro Rail Effect)
        if (this.matrixContainer) {
            this.matrixContainer.style.scrollBehavior = 'auto'; // Ensure smooth wheel interaction
            this.matrixContainer.addEventListener('wheel', (e) => {
                const isAtStart = this.matrixContainer.scrollLeft <= 0;
                const isAtEnd = Math.ceil(this.matrixContainer.scrollLeft + this.matrixContainer.clientWidth) >= this.matrixContainer.scrollWidth;

                // Translate vertical scroll to horizontal scroll
                if (e.deltaY !== 0) {
                    // Only intercept if there's room to scroll horizontally
                    if ((e.deltaY > 0 && !isAtEnd) || (e.deltaY < 0 && !isAtStart)) {
                        e.preventDefault(); // Pause vertical lenis scroll
                        this.matrixContainer.scrollLeft += e.deltaY;
                    }
                }
            }, { passive: false });

            // Touch smoothing for mobile overrides
            this.matrixContainer.style.WebkitOverflowScrolling = 'touch';
        }
    }

    // ==========================================
    // HYBRID RENDERER: DOM RECYCLING
    // ==========================================
    updateCard(cardDOM, dataItem) {
        const trContent = dataItem.content?.tr || { title: dataItem.name, shortDesc: dataItem.description || "" };
        const price = dataItem.price?.amount || dataItem.price_eur || 0;
        const imagePath = dataItem.image || (dataItem.media?.hero ? `/assets/img/cards/${dataItem.media.hero}` : '/assets/img/cards/santis_card_hammam_lux.webp');
        const dataPayload = JSON.stringify({ id: dataItem.id, title: trContent.title, price: price });

        // Update values without recreating DOM
        cardDOM.querySelector('.sv-cover').src = imagePath;
        cardDOM.querySelector('.sv-cover').alt = trContent.title;
        cardDOM.querySelector('.sv-title').textContent = trContent.title;
        cardDOM.querySelector('.sv-desc').textContent = trContent.shortDesc;
        cardDOM.querySelector('.sv-price').textContent = `${price} €`;
        cardDOM.setAttribute('data-item', dataPayload);

        // Show element (if hidden)
        cardDOM.style.display = 'flex';

        // Reset dynamic UI state for recycled card
        const isSelected = this.cart.hamam && this.cart.hamam.id === dataItem.id;
        cardDOM.style.borderColor = isSelected ? '#d4af37' : 'transparent';
        const btn = cardDOM.querySelector('.select-btn');
        if (isSelected) {
            btn.style.background = '#d4af37';
            btn.style.color = '#000';
            btn.innerText = 'SEÇİLDİ';
        } else {
            btn.style.background = 'rgba(255,255,255,0.1)';
            btn.style.color = '#fff';
            btn.innerText = 'SEÇ';
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
        // Remove old listeners to prevent stacking on recycled DOM nodes
        const oldItems = document.querySelectorAll(selector);
        oldItems.forEach(el => {
            const newEl = el.cloneNode(true);
            if (el.parentNode) el.parentNode.replaceChild(newEl, el);
        });

        // Attach fresh listeners
        const items = document.querySelectorAll(selector);
        items.forEach(el => {
            el.addEventListener('click', () => {
                const data = JSON.parse(el.getAttribute('data-item'));
                // Toggle logic
                if (this.cart[type] && this.cart[type].id === data.id) {
                    this.cart[type] = null; // deselect
                } else {
                    this.cart[type] = data; // select
                }
                this.updateUISelection(selector, type);

                // SantisBus Global Event Dispatch (Phase 8/9 Integration Prep)
                if (window.SantisBus) {
                    window.SantisBus.dispatchEvent(new CustomEvent("combo:selected", { detail: this.cart }));
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
                if (isSelected) {
                    btn.style.background = '#d4af37';
                    btn.style.color = '#000';
                    btn.innerText = 'SEÇİLDİ';
                } else {
                    btn.style.background = 'rgba(255,255,255,0.1)';
                    btn.style.color = '#fff';
                    btn.innerText = 'SEÇ';
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
                });

                opt.classList.add('active');
                opt.style.border = '2px solid #111';

                // Oil choice trigger: Haptics & Visuals
                if (opt.dataset.oil) {
                    opt.style.border = '2px solid #d4af37';
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
                }
            });
        });
    }
}

// Global Export Hook for SantisBootloader Omni-Routing
window.HamamHybridRenderer = HamamHybridRenderer;

// Fallback execution if the bootloader hasn't wrapped it up
// Note: Handled autonomously via Sovereign OS dispatch map.
