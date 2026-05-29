/**
 * ═══════════════════════════════════════════════════════════════
 * 👑 SANTIS KERNEL (Bootloader & Deterministic Orchestrator)
 * ═══════════════════════════════════════════════════════════════
 * 
 * 
 * Race Condition Kill Switch & Unified API.
 * Modüllerin hiyerarşik sıralamayla ve birbirlerini ezmeden
 * uyanmalarını sağlar.
 * 
 * V5: Çift Kavramalı (Dual-Clutch) Scheduler Enjeksiyonu.
 */

// ⚡ 1. KERNEL PRIORITY GRAPH (Görev Öncelikleri)
export const Priority = {
    CRITICAL: 0, // Sıfır gecikme (Ana iplik bloke olmadan Microtask'e atılır)
    HIGH: 1,     // DOM güncellemeleri, animasyon tetikleri
    NORMAL: 2,   // Standart veri işleme
    IDLE: 3      // Telemetri, pre-fetch, çöp toplama, AI
};

// ⚡ 2. THE REAL "PRIORITY QUEUE SCHEDULER" (Santis İşletim Sistemi Motoru VNext)
export class SantisSchedulerGraph {
    constructor() {
        this.criticalQueue = []; // CRITICAL (Microtask)
        this.visibleQueue = [];  // HIGH (rAF)
        this.idleQueue = [];     // NORMAL, IDLE (rIC)
        this.isCriticalScheduled = false;
        this.isVisibleScheduled = false;
        this.isIdleScheduled = false;
    }

    enqueue(taskFunc, priority = Priority.NORMAL, name = "UnknownTask") {
        if (typeof taskFunc !== 'function') return;
        const task = { fn: taskFunc, priority, name, enqueuedAt: performance.now() };

        if (priority === Priority.CRITICAL) {
            this.criticalQueue.push(task);
            this.scheduleCritical();
        } else if (priority === Priority.HIGH) {
            this.visibleQueue.push(task);
            this.scheduleVisible();
        } else {
            this.idleQueue.push(task);
            this.scheduleIdle();
        }
    }

    // --- VİTES 1: CRITICAL (Olay Döngüsü En Başı) ---
    scheduleCritical() {
        if (this.isCriticalScheduled) return;
        this.isCriticalScheduled = true;
        queueMicrotask(() => this.flushCritical());
    }

    flushCritical() {
        this.criticalQueue.sort((a, b) => a.enqueuedAt - b.enqueuedAt); // FIFO
        const tasks = [...this.criticalQueue];
        this.criticalQueue.length = 0;
        
        for (let i = 0; i < tasks.length; i++) {
            try { tasks[i].fn(); } 
            catch (error) { console.error(`🚨 [Kernel] CRITICAL Task Error [${tasks[i].name}]:`, error); }
        }
        this.isCriticalScheduled = false;
    }

    // --- VİTES 2: VISIBLE / HIGH (Bir Sonraki Paint Öncesi) ---
    scheduleVisible() {
        if (this.isVisibleScheduled) return;
        this.isVisibleScheduled = true;
        requestAnimationFrame(() => this.flushVisible());
    }

    flushVisible() {
        this.visibleQueue.sort((a, b) => a.enqueuedAt - b.enqueuedAt);
        const tasks = [...this.visibleQueue];
        this.visibleQueue.length = 0;
        
        for (let i = 0; i < tasks.length; i++) {
            try { tasks[i].fn(); } 
            catch (error) { console.error(`🚨 [Kernel] VISIBLE Task Error [${tasks[i].name}]:`, error); }
        }
        this.isVisibleScheduled = false;
    }

    // --- VİTES 3: IDLE / NORMAL (Tarayıcı Boşteyken) ---
    scheduleIdle() {
        if (this.isIdleScheduled) return;
        this.isIdleScheduled = true;

        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(this.flushIdle.bind(this));
        } else {
            setTimeout(this.flushIdle.bind(this), 50); // Fallback
        }
    }

    flushIdle(deadline) {
        this.idleQueue.sort((a, b) => a.priority - b.priority || a.enqueuedAt - b.enqueuedAt);

        while (this.idleQueue.length > 0) {
            // Main Thread'e (DOM) nefes alması için Yield et
            if (deadline && deadline.timeRemaining() < 5) break;

            const task = this.idleQueue.shift();
            try { task.fn(); } 
            catch (error) { console.error(`🚨 [Kernel] IDLE Task Error [${task.name}]:`, error); }
        }

        this.isIdleScheduled = false;
        if (this.idleQueue.length > 0) {
            this.scheduleIdle(); // Kalanları sonraki IDLE frame'e bırak
        }
    }
}

// 🌐 3. GLOBAL OS KİLİDİ
if (!window.SantisKernel || typeof window.SantisKernel.enqueue !== 'function') {
    const existing = window.SantisKernel || {};
    window.SantisKernel = new SantisSchedulerGraph();
    Object.assign(window.SantisKernel, existing);
}

if (!window.SANTIS) {
    window.SANTIS = {
        state: 'booting',
        modules: {},
        ready: {},
        queue: []
    };
}

export function register(name, init, deps = []) {
    window.SANTIS.modules[name] = { init, deps };
}

function canInit(module) {
    return module.deps.every(dep => window.SANTIS.ready[dep]);
}

/**
 * Dependency Graph'ı çözerek boot işlemini gerçekleştirir.
 */
export async function boot() {
    if (window.__SANTIS_KERNEL_BOOTED__) {
        console.warn('🛡️ [Kernel Guard] Duplicate boot prevented.');
        return;
    }
    window.__SANTIS_KERNEL_BOOTED__ = true;

    console.log('🌌 [Santis Kernel] Sistem Ateşlemesi (Deterministik Dizilim) Başlatılıyor...');
    const { modules } = window.SANTIS;

    let initialized = true;
    let fallbackCounter = 0;

    // Topological Sort / Resolution loop
    while (initialized && fallbackCounter < 20) {
        initialized = false;
        fallbackCounter++;

        for (let name in modules) {
            if (window.SANTIS.ready[name]) continue;

            const mod = modules[name];

            if (canInit(mod)) {
                try {
                    await mod.init();
                    window.SANTIS.ready[name] = true;
                    initialized = true;
                    console.log(`✅ [Kernel] Bilişsel Lob Onaylandı: ${name.toUpperCase()}`);
                } catch (e) {
                    console.error(`❌ [Kernel] Kiritik Çökme - Modül: ${name}`, e);
                }
            }
        }
    }

    if (Object.keys(window.SANTIS.ready).length < Object.keys(modules).length) {
        console.warn('⚠️ [Kernel] BAZI LOB\'LAR UYANAMADI (Dependency Deadlock)', {
            registered: Object.keys(modules),
            ready: Object.keys(window.SANTIS.ready)
        });
    } else {
        window.SANTIS.state = 'ready';
        console.log('🚀 [Santis OS] TÜM SİSTEMLER OPERASYONEL (V42.1).');
    }

    // 🛡️ API Unification (Global Yüzey Standartlaştırması)
    exposeSantisAPI();

    // 🧟 SW Zombie Killer
    initZombieKiller();
}

/**
 * Tek Yüzey Global API
 */
function exposeSantisAPI() {
    window.SANTIS_API = {
        get Governor() { return window.SANTIS.Governor; },
        get NeuralLink() { return window.SANTIS.NeuralLink; },
        get Medyum() { return window.SANTIS.Medyum; },
        get NeuralCore() { return window.SANTIS.NeuralCore; },
        get Sensors() { return window.SANTIS.Sensors; }, // İleride eklenebilir
        status: () => ({ state: window.SANTIS.state, modules: Object.keys(window.SANTIS.ready) })
    };
}

/**
 * Service Worker "takeover" (Zombi avcısı)
 */
function initZombieKiller() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.onstatechange = () => {
                    if (newWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            console.warn('🧟 [Kernel] SW Güncellemesi Hazır. Otonom Toast bekleniyor (Takeover geciktirildi)...');
                            showSovereignUpdateToast(newWorker);
                        } else {
                            console.log('🌑 [Kernel] İlk Shadow Worker Kuruldu.');
                        }
                    }
                };
            });

            let refreshing;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                
                // 🛡️ Kuantum Kalkanı: DevTools "Update on reload" sonsuz döngüsünü kırar
                const lastReload = sessionStorage.getItem('santis_sw_reload');
                if (lastReload && (Date.now() - parseInt(lastReload)) < 5000) {
                    console.warn('🛑 [Kernel] DevTools Update-on-Reload loop prevented.');
                    return;
                }
                sessionStorage.setItem('santis_sw_reload', Date.now().toString());

                console.log('🔄 [Kernel] Taze SW Devrede, SPA Medyum Flush atılıyor...');
                // Sayfayı tamamen yenilemek en stabili:
                window.location.reload();
            });
        }).catch(() => {});
    }
}

/**
 * 🍷 Otonom Sovereign Toast (Sessiz Lüks Güncelleme Uyarıcısı)
 * Kullanıcının zihnini yormadan sadece "Ağ güncellendi, tıkla" der.
 */
function showSovereignUpdateToast(newWorker) {
    if (document.getElementById('santis-update-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'santis-update-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = `
        position: fixed;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%) translateY(30px);
        background: rgba(12, 12, 12, 0.9);
        backdrop-filter: blur(15px);
        -webkit-backdrop-filter: blur(15px);
        border: 1px solid rgba(212, 175, 55, 0.2);
        color: rgba(255, 255, 255, 0.95);
        padding: 12px 28px;
        border-radius: 40px;
        font-family: inherit;
        font-weight: 300;
        font-size: 0.8rem;
        letter-spacing: 2px;
        z-index: 100000;
        opacity: 0;
        transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        cursor: pointer;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6), inset 0 0 10px rgba(212,175,55,0.05);
        display: flex;
        align-items: center;
        gap: 12px;
    `;

    // Altın vuruş nabız animasyonu (CSS)
    if (!document.getElementById('santis-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'santis-pulse-style';
        style.innerHTML = `
            @keyframes santisPulse { 
                0% { opacity: 0.4; box-shadow: 0 0 0px rgba(212,175,55,0); } 
                50% { opacity: 1; box-shadow: 0 0 10px rgba(212,175,55,0.6); } 
                100% { opacity: 0.4; box-shadow: 0 0 0px rgba(212,175,55,0); } 
            }
        `;
        document.head.appendChild(style);
    }

    toast.innerHTML = `
        <span style="display:block; width:5px; height:5px; background:#c6a96b; border-radius:50%; animation: santisPulse 2s infinite;"></span>
        <span>AĞ GÜNCELLENDİ ▪ TIKLAYIN</span>
    `;

    document.body.appendChild(toast);

    // Kuantum Giriş Efekti
    requestAnimationFrame(() => {
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
    });

    // Kullanıcıya kontrolün devredilmesi
    toast.addEventListener('click', () => {
        toast.style.transform = 'translateX(-50%) translateY(10px) scale(0.95)';
        toast.style.opacity = '0';
        toast.children[1].innerText = 'SENTEZLENİYOR...';
        
        // 400ms UI rahatlığı
        setTimeout(() => {
            console.log('🔄 [Kernel] Otonom Toast onaylandı, Zombi İnfazı Başlıyor...');
            newWorker.postMessage({ type: 'SKIP_WAITING' });
        }, 400);
    });
}
