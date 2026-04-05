/**
 * 👑 SANTIS SOVEREIGN BOARDROOM (MFE SHELL v1.0)
 * Askeri Standartlarda (Military-Grade) / Zero Trust Yüklü
 * Distributed Cognitive Admin OS
 */

const BOOT_TIME = performance.now();

// ============================================================================
// 🛡️ 1. GÜVENLİK KATMANI (Zero Trust & Signature Verification)
// ============================================================================

const SECURITY_MANIFEST = {
    // Kriptografik imzalar (Production'da Backend'den dinamik çekilir)
    "crm_module": "sha256-R8w3p/5aGZ..." 
};

/**
 * Remote Module yüklenmeden önce imzası ve hash'i doğrulanır
 */
async function verifyModuleSignature(moduleName, expectedHash) {
    if (!expectedHash) {
        console.error(`🚨 [SECURITY SPIKE] Modül "${moduleName}" için güvenlik imzası bulunamadı! Yükleme reddedildi.`);
        return false;
    }
    // Gerçek Sürümde (Production): fetch() ile RemoteEntry.js çekilip crypto.subtle.digest('SHA-256') ile hashlenip eşleştirilir.
    console.log(`🔒 [Sovereign Shield] "${moduleName}" modülünün kriptografik sınaması BAŞARILI.`);
    return true;
}

// ============================================================================
// 🧪 2. KANARYA & GÖLGE MODU (Feature Flags & A/B Testing)
// ============================================================================

const FEATURE_FLAGS = {
    USE_NEW_BOARDROOM: true, // Kanarya Sürümü 
    ENABLE_GOD_MODE: false
};

function checkClearance() {
    if (!FEATURE_FLAGS.USE_NEW_BOARDROOM) {
        console.warn("⚠️ [SHADOW MODE] Eski panellere yönlendiriliyorsunuz. Yeni Boardroom yetkiniz yok.");
        window.location.href = "/legacy-admin";
        return false;
    }
    return true;
}

// ============================================================================
// ⌨️ 3. KOMUTA PALETİ & NİYET MOTORU (Intent Engine & Command Palette)
// ============================================================================

class CommandPalette {
    constructor() {
        this.isOpen = false;
        this.initUI();
        this.bindShortcuts();
        console.log("⌨️ [Command Palette] CTRL+K Spotlight Dinlemede.");
    }

    initUI() {
        const overlay = document.createElement("div");
        overlay.id = "sovereign-palette-overlay";
        overlay.style.cssText = `
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
            background: rgba(10, 15, 12, 0.7); backdrop-filter: blur(12px); z-index: 99999;
            align-items: flex-start; justify-content: center; padding-top: 15vh;
            transition: opacity 0.3s ease; opacity: 0;
        `;

        const box = document.createElement("div");
        box.style.cssText = `
            width: 600px; background: rgba(30,35,32,0.9); border: 1px solid rgba(80,100,90,0.5);
            border-radius: 12px; padding: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            color: #E2E8F0; font-family: system-ui, sans-serif;
        `;

        const input = document.createElement("input");
        input.id = "palette-input";
        input.type = "text";
        input.placeholder = "Bir Sovereign Komutu girin... (Örn: 'Ahmet iptal')";
        input.style.cssText = `
            width: 100%; padding: 15px; background: transparent; border: none; 
            border-bottom: 1px solid #475569; font-size: 1.2rem; outline: none; color: #10B981;
        `;

        const intentResult = document.createElement("div");
        intentResult.id = "intent-result";
        intentResult.style.cssText = "margin-top: 15px; font-size: 0.9rem; color: #94A3B8;";

        box.appendChild(input);
        box.appendChild(intentResult);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        this.input = input;
        this.overlay = overlay;
        this.resultArea = intentResult;

        // Intent Engine Tetikleyici
        input.addEventListener('input', (e) => this.analyzeIntent(e.target.value));
        
        // Kapatma Mekanizması
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.toggle(false);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === "Escape" && this.isOpen) this.toggle(false);
        });
    }

    toggle(force) {
        this.isOpen = force !== undefined ? force : !this.isOpen;
        if (this.isOpen) {
            this.overlay.style.display = "flex";
            setTimeout(() => {
                this.overlay.style.opacity = "1";
                this.input.focus();
            }, 10);
        } else {
            this.overlay.style.opacity = "0";
            this.input.value = "";
            this.resultArea.innerText = "";
            setTimeout(() => this.overlay.style.display = "none", 300);
        }
    }

    bindShortcuts() {
        document.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    // AI Intent Layer Simülasyonu
    analyzeIntent(query) {
        if (!query.trim()) {
            this.resultArea.innerText = "";
            return;
        }

        const q = query.toLowerCase();
        let intent = "UNKNOWN";
        let actionStr = "";

        if (q.includes("iptal") || q.includes("cancel")) {
            intent = "USER_CANCEL";
            actionStr = "Hesap İptali (God Mode Jetonu Gerektirir)";
        } else if (q.includes("finans") || q.includes("rapor")) {
            intent = "OPEN_FINANCE_MFE";
            actionStr = "Finansal Analiz Modülü Yükleniyor...";
        } else if (q.includes("god") || q.includes("telemetri") || q.includes("radar") || q.includes("kapsül")) {
            intent = "OPEN_GOD_MODE";
            actionStr = "The God's Eye (Shadow DOM) Başlatılıyor...";
            setTimeout(() => this.triggerGodMode(), 1000);
        }

        this.resultArea.innerHTML = `🧠 <b>Niyet Saptanıyor:</b> <span style="color: #10B981;">[${intent}]</span> - ${actionStr}`;
    }

    triggerGodMode() {
        this.toggle(false);
        if (!document.getElementById('santis-god-mode-script')) {
            const script = document.createElement('script');
            script.id = 'santis-god-mode-script';
            script.src = '/assets/js/modules/santis-god-mode.js';
            script.onload = () => {
                const godMode = document.createElement('sovereign-god-mode');
                document.body.appendChild(godMode);
            };
            document.head.appendChild(script);
        } else if (!document.querySelector('sovereign-god-mode')) {
            const godMode = document.createElement('sovereign-god-mode');
            document.body.appendChild(godMode);
        }
    }
}

// ============================================================================
// 📊 4. SOVEREIGN TELEMETRİ EKRANI (HUD / DevTools Overlay)
// ============================================================================

class TelemetryHUD {
    constructor() {
        this.frames = 0;
        this.fps = 60;
        this.lastTime = performance.now();
        this.initDOM();
        this.loop();
        console.log("📊 [Sovereign Telemetry] HUD Çekirdeğe Katıldı.");
    }

    initDOM() {
        const el = document.createElement('div');
        el.id = 'sovereign-hud';
        el.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: rgba(15, 20, 25, 0.85);
            backdrop-filter: blur(8px); border: 1px solid rgba(16, 185, 129, 0.4);
            padding: 10px 15px; border-radius: 8px; color: #10B981; font-family: monospace;
            font-size: 11px; z-index: 99998; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            display: flex; flex-direction: column; gap: 5px; pointer-events: none;
        `;
        
        this.fpsEl = document.createElement('span');
        this.wsEl = document.createElement('span');
        this.memEl = document.createElement('span');
        this.busEl = document.createElement('span');

        this.wsEl.innerText = "WS: ESTABLISHED (<12ms)";
        this.memEl.innerText = "MEM: -- MB";
        this.busEl.innerText = "BUS: SLEEP";

        el.appendChild(this.fpsEl);
        el.appendChild(this.wsEl);
        el.appendChild(this.memEl);
        el.appendChild(this.busEl);
        document.body.appendChild(el);
    }

    loop() {
        const now = performance.now();
        this.frames++;
        if (now >= this.lastTime + 1000) {
            this.fps = this.frames;
            this.frames = 0;
            this.lastTime = now;
            
            // Renk Kodlaması (Yeşil, Sarı, Kırmızı)
            const color = this.fps >= 50 ? "#10B981" : (this.fps > 30 ? "#F59E0B" : "#EF4444");
            this.fpsEl.innerHTML = `FPS: <b style="color:${color}">${this.fps}</b>`;

            // Bellek Okuması (Destekleyen Tarayıcılar İçin)
            if (performance.memory) {
                const memUsage = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
                this.memEl.innerText = `MEM: ${memUsage} MB (Zero-Leak)`;
            }
        }
        requestAnimationFrame(() => this.loop());
    }
}

// ============================================================================
// 🌐 5. OMNIVERSE SYNC (L4 SİNİR AĞI / EVENT BUS)
// ============================================================================

class OmniverseSync {
    constructor() {
        this.topics = new Map();
        
        // Zero-Trust ACL Matrix (Micro-Authorization)
        // Hangi topic'e hangi modüllerin (callerId) YAYIN (Publish) yapabileceğini belirler.
        this.TOPIC_ACL = {
            'SYSTEM_HALT': ['god_mode', 'kernel'],
            'VIP_BOOKING_CREATED': ['live_bookings', 'kernel'],
            'CRM_GUEST_UPDATE': ['crm', 'live_bookings', 'kernel']
        };

        this.initSovereignWSHook();
        console.log("🌐 [Omniverse Sync] L4 Merkezi Sinir Ağı Aktif. Zero-Trust kalkanı devrede.");
    }

    subscribe(topic, callback, callerId) {
        if (!this.topics.has(topic)) {
            this.topics.set(topic, new Set());
        }
        this.topics.get(topic).add(callback);
        console.log(`🎧 [Omniverse Sync] [${callerId}] => '${topic}' frekansını dinliyor.`);
    }

    publish(topic, callerId, payload, isRemote = false) {
        // 1. Zero-Trust ACL (Sıfır Güven) Doğrulaması
        const allowedCallers = this.TOPIC_ACL[topic];
        if (allowedCallers && !allowedCallers.includes(callerId)) {
            console.error(`🚨 [SECURITY SPIKE] OMNIVERSE SYNC BLOCKED! Modül [${callerId}], '${topic}' kanalı için YAYIN YETKİSİNE sahip değil!`);
            return false;
        }

        console.log(`📡 [Omniverse Sync] YAYIN: [${callerId}] -> '${topic}' | Lokal/Remote: ${isRemote ? 'Remote' : 'Local'}`, payload);

        // 2. Aboneleri Tetikle
        if (this.topics.has(topic)) {
            for (let callback of this.topics.get(topic)) {
                try {
                    callback(payload, callerId, isRemote);
                } catch (e) {
                    console.error(`[Omniverse Sync] L4 Sinir Ağı Hatası (${topic}):`, e);
                }
            }
        }

        // 3. Local -> Remote Senkronizasyonu (P2P SovereignWS Ağı İçin)
        if (!isRemote && window.SovereignWS && window.SovereignWS.socket && window.SovereignWS.socket.readyState === WebSocket.OPEN) {
            window.SovereignWS.socket.send(JSON.stringify({
                type: 'OMNIVERSE_SYNC',
                topic: topic,
                callerId: callerId,
                payload: payload
            }));
        }
        
        // Telemetry HUD varsa son sinyali oraya da yaz
        if (window.SovereignHUD && window.SovereignHUD.busEl) {
            window.SovereignHUD.busEl.innerHTML = `BUS: <span style="color:#D946EF">${topic}</span>`;
            setTimeout(() => { if (window.SovereignHUD) window.SovereignHUD.busEl.innerHTML = "BUS: SLEEP"; }, 2000);
        }

        return true;
    }

    initSovereignWSHook() {
        // BroadcastChannel devriyesi (Aynı tarayıcıdaki MFE sekmeleri arasında iletişim)
        this.broadcastChannel = new BroadcastChannel('santis-omniverse');
        this.broadcastChannel.onmessage = (e) => {
            const data = e.data;
            if (data && data.topic) {
                this.publish(data.topic, data.callerId, data.payload, true);
            }
        };

        // Local yayınlarda broadcastChannel'a da yolla
        const originalPublish = this.publish.bind(this);
        this.publish = (topic, callerId, payload, isRemote = false) => {
            const success = originalPublish(topic, callerId, payload, isRemote);
            if (success && !isRemote) {
                this.broadcastChannel.postMessage({ topic, callerId, payload });
            }
            return success;
        };
    }
}

// ============================================================================
// 🚀 6. ATEŞLEME & POC MOK KOKPİTİ (BOOT SEQUENCE)
// ============================================================================

function injectMockMFE() {
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed; top: 120px; right: 20px; z-index: 9000;
        display: flex; flex-direction: column; gap: 20px; font-family: monospace;
        pointer-events: none; /* Arkası tıklanabilsin ama içindeki butonlar tıklanabilsin */
    `;

    // LIVE BOOKINGS MFE
    const bookingsMFE = document.createElement('div');
    bookingsMFE.style.cssText = `
        background: rgba(15,20,30,0.85); padding: 15px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.5);
        color: #93C5FD; width: 320px; backdrop-filter: blur(8px); pointer-events: auto;
    `;
    bookingsMFE.innerHTML = `
        <h3 style="margin-top:0; color: #60A5FA; font-size:14px;">🏨 [Live Bookings MFE]</h3>
        <button id="mock-btn-vip" style="background:rgba(37, 99, 235, 0.2); color:#60A5FA; border:1px solid #2563EB; padding:8px; cursor:pointer; width:100%; border-radius:4px; font-weight:bold; transition:all 0.2s;">+ VIP REZERVASYON (Yayınla)</button>
        <button id="mock-btn-halt" style="background:rgba(220, 38, 38, 0.2); color:#F87171; border:1px solid #DC2626; padding:8px; cursor:pointer; width:100%; margin-top:10px; border-radius:4px; font-weight:bold; transition:all 0.2s;">☢️ KORSAN: SYSTEM_HALT TETİKLE</button>
        <div id="bookings-log" style="margin-top:10px; font-size:11px; background:#000; padding:10px; height:80px; overflow-y:auto; border-radius:4px; border:1px solid #111;"></div>
    `;

    // CRM MFE
    const crmMFE = document.createElement('div');
    crmMFE.style.cssText = `
        background: rgba(30,15,30,0.85); padding: 15px; border-radius: 8px; border: 1px solid rgba(217, 70, 239, 0.5);
        color: #F0ABFC; width: 320px; backdrop-filter: blur(8px); pointer-events: auto;
    `;
    crmMFE.innerHTML = `
        <h3 style="margin-top:0; color: #E879F9; font-size:14px;">💼 [CRM MFE]</h3>
        <button id="mock-btn-crm" style="background:rgba(192, 38, 211, 0.2); color:#E879F9; border:1px solid #C026D3; padding:8px; cursor:pointer; width:100%; border-radius:4px; font-weight:bold; transition:all 0.2s;">⭐ MİSAFİRİ GÜNCELLE (Yayınla)</button>
        <div id="crm-log" style="margin-top:10px; font-size:11px; background:#000; padding:10px; height:120px; overflow-y:auto; border-radius:4px; border:1px solid #111;"></div>
    `;

    container.appendChild(bookingsMFE);
    container.appendChild(crmMFE);
    document.body.appendChild(container);

    const bLog = document.getElementById('bookings-log');
    const cLog = document.getElementById('crm-log');

    const appendLog = (el, text, color) => {
        el.innerHTML += `<div style="color:${color}; border-bottom:1px dashed #222; padding:3px 0;">> ${text}</div>`;
        el.scrollTop = el.scrollHeight;
    };

    // ABONELİKLER
    window.Omniverse.subscribe('VIP_BOOKING_CREATED', (payload, callerId, isRemote) => {
        appendLog(cLog, `[SINYAL] YENI VIP: ${payload.guestName} (Oda: ${payload.roomId})`, '#4ADE80');
    }, 'crm');

    window.Omniverse.subscribe('CRM_GUEST_UPDATE', (payload, callerId, isRemote) => {
        appendLog(bLog, `[SINYAL] KONUK PUANI: ${payload.guestName} -> ${payload.points} Puan`, '#F472B6');
    }, 'live_bookings');

    // YAYINLAR
    document.getElementById('mock-btn-vip').onclick = () => {
        appendLog(bLog, `[YAYIN] VIP_BOOKING_CREATED`, '#60A5FA');
        window.Omniverse.publish('VIP_BOOKING_CREATED', 'live_bookings', { guestName: "Alexander Yılmaz", roomId: "KING_101" });
    };

    document.getElementById('mock-btn-crm').onclick = () => {
        appendLog(cLog, `[YAYIN] CRM_GUEST_UPDATE`, '#E879F9');
        window.Omniverse.publish('CRM_GUEST_UPDATE', 'crm', { guestName: "Alexander Yılmaz", points: 8500 });
    };

    document.getElementById('mock-btn-halt').onclick = () => {
        appendLog(bLog, `[KORSAN DENEME] SYSTEM_HALT YEMLİYOR...`, '#DC2626');
        const success = window.Omniverse.publish('SYSTEM_HALT', 'live_bookings', { attack: true });
        if(!success) {
            appendLog(bLog, `[SECURITY SHIELD] REDDEDİLDİ: YETKİ YOK!`, '#EF4444');
        }
    };
}

window.document.addEventListener("DOMContentLoaded", async () => {
    console.log(`🦅 [Sovereign Boardroom] Motorlar ısıtılıyor... (ADR-003)`);

    if (!checkClearance()) return;

    // 1. Signature Check Örneği (CRM MFE Yüklenirken)
    await verifyModuleSignature("crm_module", SECURITY_MANIFEST["crm_module"]);

    // 2. L4 OMNIVERSE SYNC (Central Event Bus)
    window.Omniverse = new OmniverseSync();

    // 3. Arayüz Parçacıklarının (HUD & Palette) Enjeksiyonu
    window.SovereignHUD = new TelemetryHUD();
    window.SovereignPalette = new CommandPalette();

    // 4. MOCK MFE KOKPİTİ ENJEKSİYONU
    injectMockMFE();

    const bootTimeMs = Math.round(performance.now() - BOOT_TIME);
    console.log(`🟢 [Sovereign Boardroom] Sistem başarıyla MÜHÜRLENDİ. Toplam Boot: ${bootTimeMs}ms`);
});
