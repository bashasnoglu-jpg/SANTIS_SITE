/**
 * ==========================================
 * 💰 SOVEREIGN OS V7: AUTONOMOUS BUSINESS AI
 * ==========================================
 * Engine: Attention Tracking | Focus Tunneling | Kuantum Karar
 */
(function initBusinessCortex() {
    console.log("%c[BUSINESS CORTEX V7] Yırtıcı Zeka Uyandı. Avlanma Başlıyor... 🦅", "color: #d4af37; font-weight: bold; text-shadow: 0 0 10px #d4af37;");

    if (!window.NeuralDB) return console.error("[CORTEX] Beyin Yok. Zeka Başlatılamadı.");

    let focusTimer = null;
    let currentTarget = null;
    let isNudgeActive = false;

    // 1. INTENT TRACKING (Göz Nereye Odaklanıyor?)
    // Kaptan bir verinin üzerine fareyi getirip beklerse, sistem zihnini okur.
    document.addEventListener('mouseover', (e) => {
        if (isNudgeActive) return; // Zaten kriz modundaysa dinlemeyi kes
        
        const target = e.target.closest('[data-neural]');
        if (!target) {
            clearTimeout(focusTimer);
            currentTarget = null;
            return;
        }

        const neuralPath = target.getAttribute('data-neural');
        if (currentTarget !== neuralPath) {
            clearTimeout(focusTimer);
            currentTarget = neuralPath;
            
            // Eğer Kaptan 1.5 saniye boyunca o veriye bakarsa (Analiz Modu)
            focusTimer = setTimeout(() => {
                analyzeCrisis(neuralPath);
            }, 1500);
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (!isNudgeActive && e.target.closest('[data-neural]')) {
            clearTimeout(focusTimer);
            currentTarget = null;
        }
    });

    // 2. OTONOM ÇÖZÜM MOTORU
    function analyzeCrisis(path) {
        console.log(`%c[CORTEX] Odak Tespit Edildi: ${path}`, "color: #00FFCC; font-size: 11px;");

        // Senaryo 1: Kaptan Gelir (MRR) Verisine Bakıyor
        if (path.includes('revenue.mrr')) {
            const mrr = Number(NeuralDB.state.revenue.mrr);
            if (mrr < 100000) {
                triggerNeuralNudge('🔥 KRİTİK CHURN RİSKİ (GELİR ÇÖKÜYOR)', 'MÜŞTERİ KURTARMA PROTOKOLÜNÜ BAŞLAT', '/admin/crm.html');
            } else {
                triggerNeuralNudge('💸 BÜYÜME İVMESİ ZİRVEDE', 'AGRESİF UPSELL KAMPANYASI ATEŞLE', '/admin/revenue.html');
            }
        }
        
        // Senaryo 2: Kaptan Sistem CPU / Güvenlik Verisine Bakıyor
        if (path.includes('telemetry.cpu') || path.includes('system.defcon')) {
            const cpu = Number(NeuralDB.state.telemetry.cpu);
            const defcon = Number(NeuralDB.state.system.defcon);
            
            if (cpu > 70 || defcon < 3) {
                triggerNeuralNudge('🚨 SİSTEM AĞIR YÜK ALTINDA', 'V44 MEMORY PURGE (ÇÖP TOPLAYICI) ÇALIŞTIR', '/admin/black-room.html');
            }
        }
    }

    // 3. THE NEURAL NUDGE (Fiziksel Dünyaya Müdahale)
    function triggerNeuralNudge(reason, actionText, targetPath) {
        if (document.getElementById('cortex-nudge')) return;
        isNudgeActive = true;

        // THE FOCUS TUNNEL (Sayfayı Karart, Sadece Soruna Odaklan)
        const main = document.querySelector('main') || document.body;
        main.style.transition = 'filter 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        main.style.filter = 'brightness(0.2) contrast(1.2) sepia(0.5) hue-rotate(-10deg)';
        
        // Yapay Zeka (Business Cortex) Kırmızı Alarmları Loglasın
        if (window.BlackRoom) {
            window.BlackRoom.logDecision({ type: "AI_DECISION", action: actionText });
        }

        // Otonom Çözüm Paneli (Altın Rengi Neon)
        const nudge = document.createElement('div');
        nudge.id = 'cortex-nudge';
        nudge.innerHTML = `
            <div class="text-[#d4af37] flex" style="font-size: 11px; margin-bottom: 10px; align-items:center; gap:6px; letter-spacing: 1px;">
                <span style="width:8px; height:8px; background:#d4af37; border-radius:50%; box-shadow:0 0 10px #d4af37; animation:cortex-pulse 1s infinite;"></span>
                OTONOM İŞ ZEKASI TESPİTİ
            </div>
            <div class="text-white" style="font-size: 16px; font-weight: bold; margin-bottom: 16px; text-shadow: 0 0 15px rgba(255,255,255,0.4);">${reason}</div>
            <button class="w-full cursor-pointer" id="nudge-btn" style="padding:14px; background:rgba(0,255,204,0.1); border:1px solid #00FFCC; color:#00FFCC; font-family:monospace; font-weight:bold; border-radius:4px; transition:all 0.3s; letter-spacing: 1px; box-shadow: inset 0 0 10px rgba(0,255,204,0.1);">
                > ${actionText}
            </button>
            <div class="text-center cursor-pointer" id="nudge-dismiss" style="margin-top:12px; font-size:10px; color:#666; letter-spacing:1px; transition: color 0.2s;">[ GÖRMEZDEN GEL ]</div>
        `;

        Object.assign(nudge.style, {
            position: 'fixed', bottom: '30px', right: '30px',
            background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(212,175,55,0.3)', borderLeft: '3px solid #d4af37',
            padding: '24px', borderRadius: '8px', zIndex: '999999',
            boxShadow: '0 10px 40px rgba(0,0,0,0.9), 0 0 30px rgba(212,175,55,0.1)',
            backdropFilter: 'blur(20px)', transform: 'translateX(120%)', opacity: '0',
            transition: 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
        });

        document.body.appendChild(nudge);

        // Hover Efekti
        const btn = nudge.querySelector('#nudge-btn');
        btn.addEventListener('mouseover', () => { btn.style.background = 'rgba(0,255,204,0.3)'; btn.style.boxShadow = '0 0 15px rgba(0,255,204,0.4)'; });
        btn.addEventListener('mouseout', () => { btn.style.background = 'rgba(0,255,204,0.1)'; btn.style.boxShadow = 'inset 0 0 10px rgba(0,255,204,0.1)'; });
        
        const dismiss = nudge.querySelector('#nudge-dismiss');
        dismiss.addEventListener('mouseover', () => dismiss.style.color = '#fff');
        dismiss.addEventListener('mouseout', () => dismiss.style.color = '#666');

        // Kuantum Sıçraması (Butona Basınca)
        btn.addEventListener('click', () => {
            btn.style.background = '#00FFCC';
            btn.style.color = '#000';
            normalizeEvren();
            
            setTimeout(() => {
                // V3 Kuantum Router devredeyse onu kullan (Reload'suz), yoksa normal git
                if (window.sovereignNavigate) {
                    sovereignNavigate(targetPath);
                } else {
                    window.location.href = targetPath;
                }
            }, 300);
        });

        // İptal Butonu
        dismiss.addEventListener('click', normalizeEvren);

        requestAnimationFrame(() => {
            nudge.style.transform = 'translateX(0)';
            nudge.style.opacity = '1';
        });
    }

    // Fareden uzaklaşınca/kapatılınca arayüzü geri aç
    function normalizeEvren() {
        const main = document.querySelector('main') || document.body;
        main.style.filter = 'none';
        const nudge = document.getElementById('cortex-nudge');
        if (nudge) {
            nudge.style.transform = 'translateX(120%)';
            nudge.style.opacity = '0';
            setTimeout(() => {
                nudge.remove();
                isNudgeActive = false;
            }, 500);
        }
    }

    // Kuantum Atım Animasyonu
    if (!document.getElementById('cortex-styles')) {
        const style = document.createElement('style');
        style.id = 'cortex-styles';
        style.innerHTML = `@keyframes cortex-pulse { 0% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.3); } 100% { opacity: 0.5; transform: scale(0.9); } }`;
        document.head.appendChild(style);
    }

})();
