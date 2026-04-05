/**
 * =======================================================
 * SANTIS DISTRIBUTED COGNITIVE RUNTIME - V44.5
 * Modül: PRODUCTION SHIELD & KILL SWITCH (The Aegis Protocol)
 * "Gerçek her zaman kazanır. Sistem öldüğünde bile onurla ölmelidir."
 * =======================================================
 */

// 🎲 1. PROGRESSIVE ROLLOUT (Mutlak Hakimiyet - %100 Dağıtım)
// Kovan Zihni (Omni-Mind) artık global. Eski dünya (Vanilla) yok edildi.
const ROLLOUT_RATE = 1.0; 
window.__SDCR_ENABLED = true; // Her zaman aktif

// 🚩 2. FEATURE FLAG SYSTEM (Kontrollü Kaos Yönetimi)
window.__SDCR_FLAGS = {
    shadowMode: true,     // AŞAMA 1: Sadece veri topla, UI'a ASLA dokunma!
    temporal: true,       // Zaman bükücü illüzyon (Shadow Mode'da sadece hesaplanır)
    mesh: false,          // P2P Yeraltı ağı ŞİMDİLİK KAPALI
    adaptive: false       // AI Öğrenme Modeli ŞİMDİLİK KAPALI
};

export class AegisShield {
    static frameCounter = 0;

    static init() {
        if (!window.__SDCR_ENABLED) {
            console.warn("🛡️ [AEGIS SHIELD] Rollout dışı. Sistem Vanilla JS (Safe) modunda çalışacak.");
            this._enableVanillaMode();
            return false;
        }

        // DOM'a sistemin aktif olduğunu mühürle
        document.documentElement.setAttribute('data-runtime', 'sdcr');
        this._installSilentTelemetryProxy();
        this._bindErrorTelemetry();
        return true;
    }

    // 🕵️ V44.5 GÜNCELLEMESİ: PROXY TABANLI SESSİZ TELEMETRİ MİMARİSİ
    static _installSilentTelemetryProxy() {
        const originalConsole = window.console;

        const proxyHandler = {
            get: (target, prop, receiver) => {
                const origMethod = Reflect.get(target, prop, receiver);

                // Yalnızca kritik hataları ve uyarıları trap et (yakala)
                if (typeof origMethod === 'function' && (prop === 'error' || prop === 'warn')) {
                    return function(...args) {
                        try {
                            // 1. Sessiz Raporlama (Silent Telemetry): Veriyi paketle ve arka planda ilet
                            const payloadText = args.map(arg => (arg instanceof Error ? `${arg.message} | ${arg.stack}` : typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(" | ");
                            
                            const errorPayload = {
                                level: prop.toUpperCase(),
                                source: 'Aegis_Proxy',
                                timestamp: Date.now(),
                                payload: payloadText.substring(0, 1000)
                            };

                            // God's Eye (Local Ring Buffer) logla
                            AegisShield.logToShadowArray({
                                context: `ConsoleProxy_${prop.toUpperCase()}`,
                                msg: payloadText.substring(0, 50),
                                stack: 'Buffered'
                            });

                            if (navigator.sendBeacon) {
                                // 🚨 Sovereign Local Nexus
                                navigator.sendBeacon('http://localhost:8080/api/v2/telemetry/proxy-log', JSON.stringify(errorPayload));
                            }
                        } catch (proxyError) {
                            // Telemetri çökerse döngüye girmemek için yut.
                        }

                        // 2. Reflect API: Gerçek konsol akışını kontrol et
                        if (window.__SDCR_FLAGS && window.__SDCR_FLAGS.shadowMode) {
                            // Geliştirici modunda orjinal konsolu aynen çalıştır
                            return Reflect.apply(origMethod, target, args);
                        } else {
                            // Üretim ortamında: Konsol sessizleştirildi (Suppression)
                            // Ancak üstteki Beacon sayesinde loglar sunucuya ulaştı! Körlük engellendi.
                            return; 
                        }
                    };
                }
                return origMethod;
            }
        };

        // Kalkanı console nesnesinin üzerine kapat
        window.console = Proxy.revocable ? Proxy.revocable(originalConsole, proxyHandler).proxy : new Proxy(originalConsole, proxyHandler);
        Reflect.apply(originalConsole.log, originalConsole, ["🕵️ [AEGIS] JS Proxy tabanlı 'Sessiz Telemetri' kalkanı devrede."]);
    }

    // 🛑 3. GLOBAL KILL SWITCH & GUARD HOF (Yüksek Mertebeli Koruyucu)
    static guard(fn, context = 'Core') {
        return (...args) => {
            if (!window.__SDCR_ENABLED) return; // Şalter indiyse sessizce dön (No-op)
            
            try {
                return fn(...args);
            } catch (error) {
                this.triggerKillSwitch(error, context);
            }
        };
    }

    static triggerKillSwitch(error, context) {
        if (!window.__SDCR_ENABLED) return; // Zaten öldüysek tekrar öldürme
        
        window.__SDCR_ENABLED = false; // 💥 ŞALTERİ İNDİR!
        console.error(`☠️ [AEGIS KILL SWITCH] Çekirdek Çöktü (${context})! Vanilla UI moduna geçiliyor.`, error);

        // UI'ı anında güvenli limana çek
        this._enableVanillaMode();

        const payloadObj = {
            level: 'FATAL',
            context: context,
            msg: error.message,
            stack: error.stack?.substring(0, 500), 
            time: performance.now(),
            flags: window.__SDCR_FLAGS
        };

        // 📡 4. ERROR TELEMETRY (Sıfır-Blokaj Ölüm Raporu)
        this.logToShadowArray(payloadObj); // GOD'S EYE: Sessiz günceye işle

        if (navigator.sendBeacon) {
            // Main Thread çökse bile tarayıcı bu isteği arka planda yollar
            try {
                navigator.sendBeacon('http://localhost:8080/api/v2/telemetry/sdcr-crash', JSON.stringify(payloadObj));
            } catch(e) {}
        }
    }

    static _enableVanillaMode() {
        document.documentElement.setAttribute('data-runtime', 'vanilla');
        // Kuantum Değişkenlerini (CSS) temizle
        document.documentElement.style.removeProperty('--l9-temporal-velocity');
        document.documentElement.style.removeProperty('--sdcr-confidence');
    }

    static _bindErrorTelemetry() {
        // Global hataları ve asenkron sızıntıları yakala
        window.addEventListener('error', (e) => {
            if (e.filename && e.filename.includes('santis')) {
                this.triggerKillSwitch(e.error || new Error(e.message), 'Global_Error');
            }
        });

        window.addEventListener('unhandledrejection', (e) => {
            if (e.reason && e.reason.stack && e.reason.stack.includes('santis')) {
                this.triggerKillSwitch(e.reason, 'Unhandled_Promise');
            }
        });
    }

    // ⏱️ 5. HARD LIMITS (Termodinamik Çöküş Koruması)
    static enforceHardLimits() {
        this.frameCounter++;
        // Sonsuz döngü ve Memory Leak (Bellek Sızıntısı) koruması
        // 60 FPS * 60 sn * ~27 dk = 100.000 kare. 
        if (this.frameCounter > 100000) {
            console.warn("♻️ [AEGIS SHIELD] Hard Limit Aşıldı (100k Frame). Sistem otonom olarak uyutuluyor.");
            this.triggerKillSwitch(new Error("Frame limit exceeded (100k)"), "HardLimit_Enforcer");
        }
    }

    // 👁️ 6. GOD'S EYE TELEMETRY (ShadowArray Ring Buffer)
    static shadowArray = new Array(200);
    static shadowCursor = 0;
    static shadowCount = 0;

    static logToShadowArray(errorObj) {
        this.shadowArray[this.shadowCursor] = {
            time: new Date().toISOString().split('T')[1].slice(0,-1),
            context: errorObj.context,
            message: errorObj.msg,
            stack: errorObj.stack || 'No Stack'
        };
        this.shadowCursor = (this.shadowCursor + 1) % 200;
        if (this.shadowCount < 200) this.shadowCount++;
    }

    static _bindGodsEyeTerminal() {
        // Hedef Kombinasyon: Shift + S, O, V sırayla arka arkaya
        let sequence = [];
        const TARGET = ['S', 'O', 'V'];
        let lastKeyTime = 0;

        window.addEventListener('keydown', (e) => {
            const now = Date.now();
            if (now - lastKeyTime > 1000) sequence = []; // 1 saniye aşılırsa sıfırla
            lastKeyTime = now;

            if (e.shiftKey && e.key.toUpperCase() === 'S' && sequence.length === 0) {
                sequence.push('S');
                return;
            }

            if (sequence.length > 0) {
                const key = e.key.toUpperCase();
                if (key === TARGET[sequence.length]) {
                    sequence.push(key);
                    if (sequence.length === TARGET.length) {
                        this._deployGodsEyeTerminal();
                        sequence = []; // Consume
                    }
                } else {
                    sequence = []; // Hatalı tuş dizisi bozar
                }
            }
        });
    }

    static _deployGodsEyeTerminal() {
        if (document.getElementById('sovereign-gods-eye')) {
            document.getElementById('sovereign-gods-eye').remove();
            return; // Toggle effect
        }

        const terminal = document.createElement('div');
        terminal.id = 'sovereign-gods-eye';
        Object.assign(terminal.style, {
            position: 'fixed',
            top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(26, 26, 26, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: '9999999',
            color: '#00FFCC',
            fontFamily: 'monospace',
            padding: '2rem',
            boxSizing: 'border-box',
            overflowY: 'auto',
            pointerEvents: 'all' // UI Layout Shift yok, fixed container overlay
        });

        let logsHtml = `<h2 class="text-[#d4af37]" style="border-bottom:1px solid #333; padding-bottom:10px;">👁️ GOD'S EYE TELEMETRY (Aegis Log: ${this.shadowCount})</h2><ul style="list-style:none; padding:0; margin-top:20px;">`;
        
        // Ring buffer'dan kronolojik sırada oku
        for (let i = 0; i < this.shadowCount; i++) {
            const idx = (this.shadowCount === 200) ? ((this.shadowCursor + i) % 200) : i;
            const log = this.shadowArray[idx];
            if (!log) continue;
            logsHtml += `<li style="margin-bottom: 12px; border-left: 2px solid #eb3b5a; padding-left: 10px;">
                <strong style="color:#eb3b5a;">[${log.time}] [${log.context}]</strong>: <span style="color:#f1f2f6;">${log.message}</span>
                <div style="color:#a4b0be; font-size:11px; margin-top:4px;">${log.stack}</div>
            </li>`;
        }
        logsHtml += `</ul><button class="text-white cursor-pointer" id="close-gods-eye" style="position:absolute; top:20px; right:20px; background:transparent; border:1px solid #555; padding:5px 15px;">[X] BAĞLANTIYI KES</button>`;
        
        terminal.innerHTML = logsHtml;
        document.body.appendChild(terminal);

        document.getElementById('close-gods-eye').addEventListener('click', () => terminal.remove());
    }
}

// Singleton Binding Init
AegisShield._bindGodsEyeTerminal();
