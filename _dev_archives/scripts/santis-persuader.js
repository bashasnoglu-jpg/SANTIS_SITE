/**
 * SANTIS PERSUADER ENGINE V1.0 (AI Social Proof & Urgency)
 * 
 * Misafirin (kullanıcının) sayfada geçirdiği zamana ve niyet skoruna göre
 * sağ alt köşede zarif "Sosyal Kanıt" mesajları (Nudge) gösterir ve 
 * yüksek skorlarda stratejik "Golden Window" (VIP Slot) sayacı başlatır.
 */

class SantisPersuader {
    constructor() {
        this.delayMs = 20000; // 20 saniye bekle
        this.isActive = true;

        // Edge/KV'den geliyormuş gibi simüle edilecek veri seti (Lüks ve Gizemli)
        this.messages = [
            "A Sovereign member from London just viewed this ritual.",
            "3 distinguished guests are currently exploring this suite.",
            "Demand for this signature treatment is currently high.",
            "An Elite member from Dubai just reserved this experience."
        ];

        this.init();
    }

    init() {
        console.log('⚡ Santis Persuader V1: Active and Ready');

        // H1 - The Sovereign Crowd (Social Proof Nudge)
        if (this.shouldShowNudge()) {
            setTimeout(() => this.showSocialProofNudge(), this.delayMs);
        }

        // H2 - The Golden Window (Urgency)
        // Oracle (Ghost Tracker) intent score'u dinler
        setInterval(() => this.checkUrgencyWindow(), 5000);

        // H3 - Phase 15: Sovereign Dynamic Scarcity Injection
        setTimeout(() => this.injectScarcity(), 2000);
    }

    async injectScarcity() {
        try {
            const res = await fetch('/api/v1/booking/inventory');
            if (!res.ok) return;
            const data = await res.json();

            console.log(`💎 [Sovereign Hand-Off] Inventory Checked. Surge Multiplier: x${data.surge_multiplier || 1.0}`);

            // Fetch and inject scarcity badges recursively to matching product elements
            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    if (item.scarcity_message) {
                        const productCards = document.querySelectorAll('.santis-bento-card, .santis-card, h3');
                        if (!productCards) return;

                        productCards.forEach(card => {
                            const textC = card.innerText.toLowerCase();
                            if (textC.includes(item.service_name.toLowerCase()) || textC.includes(item.item_name.toLowerCase())) {
                                if (!card.querySelector('.scarcity-badge-v15')) {
                                    const badge = document.createElement('div');
                                    badge.className = 'scarcity-badge-v15';
                                    Object.assign(badge.style, {
                                        color: '#FF3E3E',
                                        fontSize: '11px',
                                        marginTop: '10px',
                                        fontWeight: '700',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 10px',
                                        background: 'rgba(255, 62, 62, 0.1)',
                                        border: '1px solid rgba(255, 62, 62, 0.3)',
                                        borderRadius: '4px',
                                        fontFamily: "'Inter', sans-serif"
                                    });
                                    badge.innerHTML = `<span style="font-size:14px; line-height:1;">🔥</span> ${item.scarcity_message}`;
                                    card.appendChild(badge);
                                }
                            }
                        });
                    }
                });
            }
        } catch (e) {
            console.warn("💎 [Sovereign Hand-Off] Scarcity Engine bypass/ignored.", e);
        }
    }

    shouldShowNudge() {
        // Belirli sayfalarda (Örn: ana sayfa, servis detay) tetiklenmesi için kontrol edilebilir.
        // Basitlik adına şu an her sayfada 20 sn sonra tetiklenecek.
        return true;
    }

    showSocialProofNudge() {
        if (document.querySelector('.santis-nudge')) return; // Zaten varsa çık

        const nudge = document.createElement('div');
        nudge.className = 'santis-nudge';

        // Pseudo-RNG Seçimi
        const randomMsg = this.messages[Math.floor(Math.random() * this.messages.length)];

        nudge.innerHTML = `
            <div class="nudge-icon">✨</div>
            <div class="nudge-text">${randomMsg}</div>
        `;

        // Zarif Lüks Tasarımı (CSS-in-JS injection)
        Object.assign(nudge.style, {
            position: 'fixed',
            bottom: '80px', // Concierge butonunun hemen üstü
            right: '20px',
            backgroundColor: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid rgba(212, 175, 55, 0.5)', // Daha parlak altın
            color: '#ffffff', // Daha parlak metin
            padding: '16px 24px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: "'Outfit', sans-serif",
            fontSize: '14px',
            letterSpacing: '0.05em',
            backdropFilter: 'blur(10px)',
            opacity: '0',
            transform: 'translateY(15px)',
            transition: 'opacity 1s ease, transform 1s ease',
            zIndex: '2147483647', // Maksimum tamsayı limiti (Sitenin en üstü)
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
            pointerEvents: 'none' // Tıklamaları yutmasını engelle
        });

        document.documentElement.appendChild(nudge); // HTML etiketine ekle, CSS clipping sorunlarını aş

        // Sisteme yedirerek Fade-in yap
        setTimeout(() => {
            nudge.style.opacity = '1';
            nudge.style.transform = 'translateY(0)';
        }, 100);

        // Bir süre sonra zarifçe kaybolsun (Fade-out)
        setTimeout(() => {
            nudge.style.opacity = '0';
            nudge.style.transform = 'translateY(10px)';
            setTimeout(() => nudge.remove(), 1500); // DOM'dan temizle
        }, 8000); // 8 Saniye ekranda kalır
    }

    checkUrgencyWindow() {
        const intentScore = parseInt(sessionStorage.getItem('santis_ghost_score') || '0');

        if (intentScore >= 85 && !document.querySelector('.santis-urgency-bar')) {
            // UI yükünden kaçınmak için hafif bir gecikme
            setTimeout(() => {
                this.showGoldenWindow(intentScore);
            }, 3000);
        }
    }

    showGoldenWindow(intentScore) {
        console.log('⌛ [Persuader] Golden Window Initiated. Intent Score > 85.');
        // Örn: Butonun altına veya ekranin ustune zarif bir bar ekler
        const barContainer = document.createElement('div');
        barContainer.className = 'santis-urgency-bar';

        const barLabel = document.createElement('div');
        barLabel.innerText = "YOUR EXCLUSIVE SLOT IS RESERVED FOR 15:00";

        const barLine = document.createElement('div');
        const barProgress = document.createElement('div');

        // Styles
        Object.assign(barContainer.style, {
            position: 'fixed',
            bottom: '0',
            left: '0',
            width: '100vw', // 100% yerine viewport genişliği
            backgroundColor: '#050505', // Tamamen siyah
            borderTop: '2px solid #D4AF37', // Net altın border
            zIndex: '2147483647', // Maksimum tamsayı limiti
            padding: '24px 0', // Boyu uzattık
            textAlign: 'center',
            opacity: '0',
            transition: 'opacity 1.5s ease',
            boxShadow: '0 -15px 50px rgba(0, 0, 0, 0.95)', // Kuvvetli gölge
            pointerEvents: 'none' // Alttaki tıklamalara engel olmasın
        });

        Object.assign(barLabel.style, {
            fontFamily: "'Cinzel', serif",
            fontSize: '16px', // Daha okunaklı büyüttük
            color: '#D4AF37', // Gold
            letterSpacing: '0.3em',
            marginBottom: '10px',
            textTransform: 'uppercase',
            fontWeight: '600' // Daha kalın
        });

        Object.assign(barLine.style, {
            width: '100%',
            height: '4px', // Çizgiyi kalınlaştırdık
            backgroundColor: 'rgba(255,255,255,0.1)'
        });

        Object.assign(barProgress.style, {
            width: '100%',
            height: '100%',
            backgroundColor: '#D4AF37', // Gold
            transition: 'width 900s linear', // 15 dakika (15*60)
            boxShadow: '0 0 15px rgba(212, 175, 55, 0.8)' // Daha parlak ışıltılı ilerleme çubuğu
        });

        barLine.appendChild(barProgress);
        barContainer.appendChild(barLabel);
        barContainer.appendChild(barLine);
        document.documentElement.appendChild(barContainer); // HTML üzerine basarak body clip'i aş

        // Fade in - requestAnimationFrame ile render engeli takılmadan opacity değişimi
        requestAnimationFrame(() => {
            setTimeout(() => {
                barContainer.style.opacity = '1';
                // Start countdown animation
                setTimeout(() => {
                    barProgress.style.width = '0%';
                }, 100);
            }, 50);
        });

        // Simulating countdown (text)
        let timeLeft = 15 * 60;
        const timer = setInterval(() => {
            timeLeft--;
            const m = Math.floor(timeLeft / 60);
            const s = timeLeft % 60;
            barLabel.innerText = `YOUR EXCLUSIVE SLOT IS RESERVED FOR ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            if (timeLeft <= 0) {
                clearInterval(timer);
                barContainer.style.opacity = '0';
                setTimeout(() => barContainer.remove(), 2000);
            }
        }, 1000);

        // ----------------------------------------------------
        // PHASE 33: SOVEREIGN HAND-OFF (AGENTIC AI CLOSING)
        // ----------------------------------------------------
        if (intentScore >= 90) {
            console.log('💎 [Sovereign Hand-Off] High Intent Detected. Arming Agentic Closer...');

            // 8 Saniye bekleyip (Idle simülasyonu) sessizce Kapanış teklifini (Final Offer) başlat
            setTimeout(() => {
                this.triggerProactiveClosing(intentScore);
            }, 8000);
        }
    }

    async triggerProactiveClosing(score) {
        // 🛡️ Phase 15.1: KILL SWITCH & RATE LIMITS
        if (window.SantisOS && window.SantisOS.SAFE_MODE) {
            console.warn('🛡️ [Kill Switch] Aurelia engellendi. Sistem SAFE_MODE durumunda.');
            return;
        }

        let interventionCount = parseInt(sessionStorage.getItem('santis_aurelia_count') || '0', 10);
        const MAX_INTERVENTIONS = 2; // Otorite Kuralı
        if (interventionCount >= MAX_INTERVENTIONS) {
            console.warn(`🛡️ [Rate Limit] Aurelia bu oturumda max limite ulaştı (${MAX_INTERVENTIONS}/${MAX_INTERVENTIONS}). Misafir rahatsız edilmeyecek.`);
            return;
        }

        try {
            console.log('💎 [Sovereign Hand-Off] Fetching Dynamic SKU from The Black Room...');

            // Omni-Device Sovereign Kimliğini Al (Sisteme Entegre Ettik)
            let sessionId = 'ghost_unknown';
            if (window.SantisIdentity) {
                sessionId = await window.SantisIdentity.getSovereignId();
            } else {
                sessionId = sessionStorage.getItem('santis_ghost_session') || `ghost_anon_${Date.now()}`;
            }

            let payload = {
                session_id: sessionId,
                current_score: score,
                device_type: navigator.userAgent,
                source_url: document.referrer || "direct",
                past_bookings: parseInt(localStorage.getItem('santis_past_bookings') || '0', 10)
            };

            // Yeni "The Black Room" API Endpoint'i
            const response = await fetch('/api/v1/predictive/black-room-offer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Black Room API rejected.');
            const data = await response.json();

            if (data.status === "ignored") {
                console.log('💎 [Sovereign Hand-Off] Score too low for Executive Offer.');
                return;
            }

            // Sayacı Artır (Rate Limit Penalty)
            sessionStorage.setItem('santis_aurelia_count', (interventionCount + 1).toString());

            // The Event Bus Stream Kaydı (Görünürlük radara aksın)
            if (window.SantisOS && typeof window.SantisOS.emitEvent === 'function') {
                window.SantisOS.emitEvent('aurelia_deployed', {
                    score,
                    offer_sku: data.offer.virtual_sku || data.offer.sku,
                    intervention_no: interventionCount + 1
                });
            }

            // Sahnede Kapanış Chat Bildirimini Oluştur
            this.renderClosingBubble(data.offer, data.intent_level);

        } catch (error) {
            console.warn('💎 [Sovereign Hand-Off] Strategy aborted:', error);
        }
    }

    renderClosingBubble(offer, intentLevel) {

        // Dinamik Black Room Verileri
        const titleText = offer.title || "Sovereign Executive Paket";
        const msgText = offer.description || "Size özel lüks paketimizi hazırladık.";
        const virtualSku = offer.virtual_sku || "PKG-ERROR";
        let dynamicPrice = offer.dynamic_price || 0;
        const orgPrice = offer.original_price || 0;
        const discountToken = offer.token || "6EOOZVXS"; // The Sovereign Concept VIP Code

        // 🛡️ Sovereign Yield (Floor Price Kalkanı) Entegrasyonu
        if (window.santisRevenueBrain && typeof window.santisRevenueBrain.validateYield === 'function') {
            dynamicPrice = window.santisRevenueBrain.validateYield(orgPrice, dynamicPrice);
        }

        // Eski balonu, Nudge bildirimini ve Urgency Bar'ı temizle/gizle (Z-Index Çakışmasını Sıfırla)
        document.querySelectorAll('.santis-closing-bubble').forEach(el => el.remove());
        document.querySelectorAll('.santis-nudge').forEach(el => { el.style.display = 'none'; el.style.pointerEvents = 'none'; });
        document.querySelectorAll('.santis-urgency-bar').forEach(el => { el.style.display = 'none'; el.style.pointerEvents = 'none'; });

        // Yeni Ultra-Mega Concierge Modal (Dinamik Paket Sürümü)
        // Tema rengini Surge ve Awakened Modlarına Göre Ayarla
        const themeColor = intentLevel === "surge" ? "#FFDF00" : "#D4AF37"; // Daha yoğun altın

        // 👑 Sovereign Agentic Closer Konsept CSS Zırhını Enjekte Et (Eğer Yoksa)
        if (!document.getElementById('sovereign-closer-styles')) {
            const style = document.createElement('style');
            style.id = 'sovereign-closer-styles';
            style.innerHTML = `
            .sovereign-agentic-closer {
                background: linear-gradient(145deg, rgba(8, 8, 8, 0.95) 0%, rgba(15, 15, 15, 0.9) 100%);
                backdrop-filter: blur(24px) saturate(200%);
                -webkit-backdrop-filter: blur(24px) saturate(200%);
                border: 1px solid rgba(212, 175, 55, 0.25);
                border-radius: 16px;
                animation: goldenWindowPulseFadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards, goldenWindowPulse 4s cubic-bezier(0.16, 1, 0.3, 1) infinite 1s;
                transform: translateY(30px) scale(0.9);
                opacity: 0;
                position: fixed;
                bottom: 8px; /* Daha alt köşe */
                right: 24px;
                width: 440px;
                padding: 32px;
                font-family: 'Outfit', sans-serif;
                overflow: hidden;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
            }
            .sovereign-agentic-closer.aurelia-active {
                /* transition will be handled by goldenWindowPulseFadeIn animation */
            }
            @keyframes goldenWindowPulseFadeIn {
                0% { transform: translateY(30px) scale(0.9); opacity: 0; }
                100% { transform: translateY(0) scale(1); opacity: 1; }
            }
            @keyframes goldenWindowPulse {
                0% { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 15px rgba(212, 175, 55, 0.08), inset 0 0 15px rgba(212, 175, 55, 0.03); border-color: rgba(212, 175, 55, 0.25); }
                50% { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 45px rgba(212, 175, 55, 0.35), inset 0 0 30px rgba(212, 175, 55, 0.1); border-color: rgba(212, 175, 55, 0.6); }
                100% { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 15px rgba(212, 175, 55, 0.08), inset 0 0 15px rgba(212, 175, 55, 0.03); border-color: rgba(212, 175, 55, 0.25); }
            }
            .sovereign-token-btn {
                background: linear-gradient(135deg, rgba(20, 20, 20, 0.8) 0%, rgba(10, 10, 10, 0.9) 100%);
                border: 1px solid rgba(212, 175, 55, 0.6);
                color: #FFF;
                letter-spacing: 4px;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                overflow: hidden;
                width: 100%;
                text-align: center;
                padding: 16px 0;
                font-family: 'Cinzel', serif;
                font-weight: 600;
                font-size: 16px;
                border-radius: 6px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
            }
            .sovereign-token-btn::before {
                content: '';
                position: absolute;
                top: 0; left: -100%; width: 50%; height: 100%;
                background: linear-gradient(to right, transparent, rgba(212,175,55,0.2), transparent);
                transform: skewX(-20deg);
                animation: shine 3s infinite;
            }
            @keyframes shine {
                0% { left: -100%; }
                20% { left: 200%; }
                100% { left: 200%; }
            }
            .sovereign-token-btn:hover {
                background: rgba(212, 175, 55, 0.2);
                box-shadow: 0 0 25px rgba(212, 175, 55, 0.5), inset 0 0 15px rgba(212, 175, 55, 0.2);
                border-color: #D4AF37;
                transform: scale(1.03);
            }
            .token-copied-msg {
                color: #D4AF37;
                font-size: 0.9rem;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                margin-top: 12px;
                text-align: center;
                font-style: italic;
                font-family: 'Playfair Display', serif;
                text-shadow: 0 0 5px rgba(212, 175, 55, 0.3);
            }
            .token-copied-msg.show {
                opacity: 1;
                transform: translateY(0);
            }
            `;
            document.head.appendChild(style);
        }

        const bubble = document.createElement('div');
        // Yeni Zırhlı Klasörü Ver
        bubble.className = 'santis-closing-bubble sovereign-agentic-closer';

        // Tüm engelleri ezip geçecek Acil CSS İnfaz Zırhı (!important içerenler Object.assign ile ezilemez)
        bubble.style.setProperty('z-index', '2147483647', 'important');
        bubble.style.setProperty('pointer-events', 'auto', 'important');

        // Üst Kısım: Avatar & Title & Close
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'flex-start';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '20px';
        header.style.position = 'relative';
        header.style.zIndex = '2';

        header.innerHTML = `
            <div style="display: flex; gap: 16px; align-items: center;">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: url('/assets/img/hero-general.webp') center/cover; border: 2px solid ${themeColor}; box-shadow: 0 0 15px rgba(212,175,55,0.2);"></div>
                <div>
                    <div style="color: ${themeColor}; font-family: 'Cinzel', serif; font-size: 15px; letterSpacing: 0.15em; font-weight: 700; text-transform: uppercase;">Aurelia — Sovereign Concierge</div>
                    <div style="color: #888; font-size: 11px; letterSpacing: 0.08em; text-transform: uppercase; margin-top:2px;">Sadece size özel bir ayrıcalık</div>
                </div>
            </div>
            <button id="closeAgenticBubble" style="background: none; border: none; color: #666; font-size: 24px; cursor: pointer; padding: 0; line-height: 1; transition: color 0.3s;" onmouseover="this.style.color='${themeColor}'" onmouseout="this.style.color='#666'">&times;</button>
        `;

        // Mesaj Gövdesi: Dinamik Fiyat ve Kupon ile "Sanal Sepet (SKU)" görünümü
        const msg = document.createElement('div');
        msg.style.color = '#d1d5db';
        msg.style.fontSize = '14.5px';
        msg.style.lineHeight = '1.7';
        msg.style.marginBottom = '24px';
        msg.style.fontWeight = '300';
        msg.style.position = 'relative';
        msg.style.zIndex = '2';

        msg.innerHTML = `
            <div style="font-family: 'Cinzel', serif; font-size: 18px; color: white; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">${titleText}</div>
            <p style="margin-bottom: 20px; font-style: italic;">"Ruhunuzun aradığı sükuneti ve kusursuz deneyimi hissettiğinizi biliyoruz. Bu özel arınma yolculuğuna eksiksiz bir adım atmanız için, şahsınıza tahsis edilmiş Sovereign Anahtarı'nı takdim etmekten onur duyarım."</p>
            
            <div style="background: rgba(212,175,55,0.05); padding: 15px; border-radius: 8px; border: 1px dashed rgba(212,175,55,0.3); margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #888; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;">Virtual SKU</span>
                    <span style="color: ${themeColor}; font-family: 'Space Grotesk', monospace; font-size: 13px;">${virtualSku}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <span style="color: #888; font-size: 16px; text-decoration: line-through;">€${orgPrice}</span>
                    <span style="color: white; font-size: 24px; font-weight: 600;">€${dynamicPrice}</span>
                </div>
            </div>
        `;

        // Hover Effect for Token String directly injected since innerHTML is parsed lazily
        msg.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('discount-token')) {
                e.target.style.background = 'rgba(212,175,55,0.15)';
                e.target.style.boxShadow = '0 0 10px rgba(212,175,55,0.2)';
            }
        });
        msg.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('discount-token')) {
                e.target.style.background = 'rgba(212,175,55,0.05)';
                e.target.style.boxShadow = 'none';
            }
        });

        // 👑 The Token (Kopyalama Mekanizması)
        const tokenContainer = document.createElement('div');
        tokenContainer.style.position = 'relative';
        tokenContainer.style.zIndex = '99999';

        const actionBtn = document.createElement('div');
        actionBtn.className = 'sovereign-token-btn';
        actionBtn.innerHTML = `
            <span>${discountToken}</span>
            <span style="font-size: 9px; letter-spacing: 0.1em; font-family: 'Inter', sans-serif; margin-top: 4px; color: #888;">Ayrıcalığınızı açığa çıkarmak için dokunun.</span>
        `;

        const copiedMsg = document.createElement('div');
        copiedMsg.className = 'token-copied-msg';
        copiedMsg.innerText = "Anahtarınız kopyalandı, efendim. Lüksün kapıları sizin için aralanıyor.";

        tokenContainer.appendChild(actionBtn);
        tokenContainer.appendChild(copiedMsg);

        actionBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            console.log("💎 [Sovereign Hand-Off] Token Copied to Clipboard.");

            // Panoya Kopyala
            navigator.clipboard.writeText(discountToken).then(() => {
                // Konfirmasyon Mikro Animasyonu
                copiedMsg.classList.add('show');

                // ------------------------------------------------------------------
                // PHASE 10: SOVEREIGN LOYALTY MINTING (VIP VAULT ANONYMIZED RECOGNITION)
                // Satış Hand-Off Başarılı Olduğunda Misafir Anonim Cüzdanına Puan İkram Edilir.
                // ------------------------------------------------------------------
                if (window.SantisOS && typeof window.SantisOS.mintSovereignLoyalty === 'function') {
                    window.SantisOS.mintSovereignLoyalty();
                }

                // Shadow Cart Tetiklemesi veya Yönlendirme
                const directOfferObj = {
                    virtual_sku: offer.virtual_sku || offer.sku,
                    dynamic_price: offer.dynamic_price || offer.price,
                    title: offer.title
                };

                // WhatsApp Fallback'ini 3 sn bekleyip başlat (Misafire kopyaladığını görme hissi vermek için)
                setTimeout(() => {
                    try {
                        if (typeof window.addVirtualSku === "function") {
                            window.addVirtualSku(directOfferObj);
                        } else {
                            const phone = window.NV_CONCIERGE_NUMBER || "905000000000";
                            const fallbackMsg = `Merhaba Santis Club! ✨\n\nBenim için özel hazırlanan Sovereign Executive teklifini kabul ediyorum.\n\n💎 Seçilen Hizmet: 👑 Sovereign Özel [€${directOfferObj.dynamic_price}]\n🔐 Sistem Mührü: [SOVEREIGN HAND-OFF] SKU: ${directOfferObj.virtual_sku}\n🔑 Token: ${discountToken}\n\nLütfen rezervasyon işlemlerimi tamamlamak için benimle iletişime geçin.`;
                            window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(fallbackMsg)}`;
                        }
                    } catch (err) {
                        console.error("💎 [Sovereign Hand-Off] Shadow Cart Hatası:", err);
                    } finally {
                        if (bubble && bubble.style) {
                            bubble.classList.remove('aurelia-active');
                            setTimeout(() => {
                                if (document.body.contains(bubble)) bubble.remove();
                            }, 800);
                        }
                    }
                }, 2500); // 2.5 saniye animasyon bekleme payı
            });
        };

        // Arka Plan Glow Efekti (Golden Pulse)
        const glow = document.createElement('div');
        Object.assign(glow.style, {
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle at top right, rgba(212, 175, 55, 0.08), transparent 60%)',
            pointerEvents: 'none',
            zIndex: '0'
        });

        // Üst Üste Binme (Z-Index) ve Pointer Engellerini Aşma
        actionBtn.style.zIndex = '10';
        msg.style.zIndex = '5';
        header.style.zIndex = '5';

        // Sıralama (DOM Rendering Order)
        bubble.appendChild(glow);
        bubble.appendChild(header);
        bubble.appendChild(msg);
        bubble.appendChild(tokenContainer);

        document.body.appendChild(bubble);

        // Kapatma Aksiyonu
        bubble.querySelector('#closeAgenticBubble').onclick = () => {
            bubble.classList.remove('aurelia-active');
            setTimeout(() => bubble.remove(), 800);
        };

        // Sinematik Animasyon (Giriş) - .aurelia-active classı Tetikleyicisi
        requestAnimationFrame(() => {
            setTimeout(() => {
                bubble.classList.add('aurelia-active');
            }, 50);
        });
    }
}

// OS Katmanında başlat ve Dışarıya Aç
document.addEventListener('DOMContentLoaded', () => {
    window.santisPersuader = new SantisPersuader();

    // The War Room (Sovereign Otonom Hand-Off) Dinleyicisi
    window.addEventListener('santis:aurelia_wakeup', (e) => {
        const currentScore = e.detail ? e.detail.score : 85;
        // Eğer sahnede başka bir Aurelia (Bubble) yoksa tetikle
        if (!document.querySelector('.santis-closing-bubble')) {
            console.log(`💎 [Sovereign Hand-Off] Aurelia wakened by external event (Score: ${currentScore})`);
            window.santisPersuader.triggerProactiveClosing(currentScore);
        }
    });
});

// ----------------------------------------------------
// (Eski Global Event Delegation Bloğu İptal Edildi)
// ----------------------------------------------------
