/**
 * ═══════════════════════════════════════════════════════════════
 * 🛡️ SANTIS NEURAL GOVERNOR v42.0 (Hive Mind & Energy Core)
 * ═══════════════════════════════════════════════════════════════
 * 
 * V41: Disiplin ve Rate Limit (Cooldowns & Locks)
 * V42: Cross-Tab Coordination (BroadcastChannel Kovan Aklı) + Energy Throttle
 * Görevi: Sistemin fazla akıllı olduğu için kendini DDoSlamasını engellemek. "Sabır" Modülü.
 */

class SantisGovernor {
    constructor() {
        this.lastActions = new Map();
        this.cooldowns = new Map();
        this.locks = new Set();
        
        // V42: Energy & Device Awareness
        this.energyMultiplier = 1.0;
        
        // V42: Hive Mind (Cross-Tab Network)
        this.channel = null;
        this.isMaster = false;
        this.tabId = Math.random().toString(36).substring(2, 9);
        
        console.log(`🛡️ [Governor V42] Transandantal Düzenleyici Uyanıyor... Tab ID: ${this.tabId}`);
        this.init();
    }

    init() {
        this.assessEnergyState();
        this.initHiveMind();
    }

    // --- V42: ENERGY AWARENESS ---
    assessEnergyState() {
        let penalty = 1.0;

        // CPU Çekirdek Kontrolü
        const cores = navigator.hardwareConcurrency || 4;
        if (cores <= 2) penalty *= 1.5; // Düşük donanım: İşlemleri %50 yavaşlat

        // İnternet Tasarrufu / Gücü Kontrolü
        if ('connection' in navigator) {
            const conn = navigator.connection;
            if (conn.saveData) penalty *= 2.0; 
            if (conn.effectiveType === '3g' || conn.effectiveType === '2g') penalty *= 1.5; 
        }

        // Batarya Stres Koruma API'si (Destekli tarayıcılarda)
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                if (!battery.charging && battery.level < 0.20) {
                    this.energyMultiplier = penalty * 2.0; // Kritik bataryada işlemleri iyice sık
                    console.warn(`🔋 [Governor V42] Kritik Batarya: Edge AI Yavaşlatılıyor (x${this.energyMultiplier})`);
                }
            });
        }
        
        this.energyMultiplier = penalty;
        if (penalty > 1.0) {
            console.log(`⚡ [Governor V42] Cihaz Enerji Profili: Kısıtlı. Otonom Throttle Çarpanı: x${penalty}`);
        } else {
            console.log(`⚡ [Governor V42] Cihaz Enerji Profili: Stabil Performans. Throttling Pasif.`);
        }
    }

    // --- V42: CROSS-TAB HIVE MIND ---
    initHiveMind() {
        if ('BroadcastChannel' in window) {
            this.channel = new BroadcastChannel('santis_hive_mind');
            
            // Sekme açıldığında kovanın geri kalanına "Ben geldim, geçmişi senkronize edin" der
            this.channel.postMessage({ type: 'SYNC_REQUEST', tabId: this.tabId });

            this.channel.onmessage = (e) => {
                const data = e.data;
                
                // Başka sekme bir işlem yaptı, benim RAM belleğime de kilit at -> Otonom Multi-Tab!
                if (data.type === 'ACTION_LOCKED') {
                    this.lastActions.set(data.key, data.now);
                }

                // Diğer sekmeler benim SYNC talebimi duydu, bana kendi Action History'sini yolladı
                if (data.type === 'SYNC_REPLY' && data.targetTab === this.tabId) {
                    data.history.forEach(([key, time]) => {
                        const local = this.lastActions.get(key) || 0;
                        if (time > local) this.lastActions.set(key, time);
                    });
                }

                // Başka biri benden geçmiş istiyor
                if (data.type === 'SYNC_REQUEST') {
                    const history = Array.from(this.lastActions.entries());
                    this.channel.postMessage({ type: 'SYNC_REPLY', targetTab: data.tabId, history });
                }
            };
        }
    }

    // --- V41: CORE GOVERNANCE (SİSTEMİ KİLİTLEYEN BEYİN) ---
    canExecute(key, options = {}) {
        const now = Date.now();
        const baseCooldown = options.cooldown || 1000;
        
        // V42: Gerekli cooldown süresini mevcut donanım enerjisiyle çarp (Adaptive Slower)
        const cooldown = baseCooldown * this.energyMultiplier;
        const dedupe = options.dedupe !== false;

        // 🔒 LOCK CHECK
        if (this.locks.has(key)) return false;

        // ⏱️ COOLDOWN CHECK (Global Tabs Aware)
        const last = this.lastActions.get(key) || 0;
        if (now - last < cooldown) {
            // Sessiz Throttle - Sadece developer görmek isterse açabilir:
            // console.warn(`🛡️ [Governor] Engellendi (Throttled): ${key} (Kalan: ${Math.round(cooldown - (now - last))}ms)`);
            return false;
        }

        // 🔁 DEDUPE CHECK
        if (dedupe && this.cooldowns.get(key) === now) return false;

        // ✅ ALLOW (Kendi belleğime yaz ve Kovan Zekasına duyur)
        this.lastActions.set(key, now);
        this.cooldowns.set(key, now);

        if (this.channel) {
            this.channel.postMessage({ type: 'ACTION_LOCKED', key: key, now: now });
        }

        return true;
    }

    lock(key) {
        this.locks.add(key);
    }

    unlock(key) {
        this.locks.delete(key);
    }
}

// Global Bootloader Kaydı
import { register } from '../core/santis-kernel.js';
export let Governor;
register('governor', async () => {
    Governor = new SantisGovernor();
    window.SANTIS.Governor = Governor;
    window.__SANTIS_GOVERNOR__ = Governor; // Legacy/Router desteği için
});
