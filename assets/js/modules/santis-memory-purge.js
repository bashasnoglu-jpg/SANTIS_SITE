/**
 * 🦅 SANTIS OS [V44_APEX] - AI ALZHEIMER PROTOCOL
 * "Zihin Berraklığı, Veri Egemenliği."
 * Bu modül, LocalStorage, ve Cache API üzerindeki 
 * miyadı dolmuş verileri otonom olarak temizler ve "Bilişsel Yavaşlamayı" engeller.
 */

class SantisMemoryPurge {
    constructor() {
        this.config = {
            maxStorageSize: 4.5 * 1024 * 1024, // 4.5MB
            ttlDays: 7, 
            versionPrefix: "SANTIS_V",
            currentVersion: "44"
        };
    }

    async init() {
        console.log("🧠 [V44 Purge] Bilişsel Arınma Protokolü Aktif. (AI Alzheimer Kalkanı)");
        
        // Kernel hazır olduğunda veya boş zaman diliminde (Idle) çalıştır
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => this.runDiagnostics());
        } else {
            setTimeout(() => this.runDiagnostics(), 2000);
        }
    }

    async runDiagnostics() {
        const usage = this.calculateLocalStorageUsage();
        console.log(`📊 [V44 Diagnostics] Hafıza Yükü: ${(usage / 1024).toFixed(2)} KB`);

        this.purgeLegacyVersions();
        this.purgeExpiredData();
        await this.cullZombieCaches();

        if (usage > this.config.maxStorageSize) {
            console.warn("🚨 [V44 Alert] Kritik Hafıza Eşiği Aşıldı! Agresif temizlik başlatılıyor...");
            this.aggressivePurge();
        }
    }

    calculateLocalStorageUsage() {
        let total = 0;
        for (let x in localStorage) {
            if (localStorage.hasOwnProperty(x)) {
                total += ((localStorage[x].length + x.length) * 2);
            }
        }
        return total;
    }

    purgeLegacyVersions() {
        let culledCount = 0;
        Object.keys(localStorage).forEach(key => {
            // Sadece V44 olmayan eski SANTIS loglarını temizle
            if (key.startsWith(this.config.versionPrefix) && !key.includes(`_V${this.config.currentVersion}`)) {
                localStorage.removeItem(key);
                culledCount++;
            }
        });
        if (culledCount > 0) {
            console.log(`🧹 [V44 Purge] ${culledCount} adet eski versiyon kalıntısı temizlendi.`);
        }
    }

    purgeExpiredData() {
        const now = Date.now();
        Object.keys(localStorage).forEach(key => {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data && data._santis_expires && now > data._santis_expires) {
                    localStorage.removeItem(key);
                    console.log(`🍂 [V44 Purge] Miadı dolan veri silindi: ${key}`);
                }
            } catch (e) {
                // Saf metin veya JSON olmayan verileri atla
            }
        });
    }

    async cullZombieCaches() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            const activeCache = `santis-v${this.config.currentVersion}`;
            
            await Promise.all(
                cacheNames.map(name => {
                    if (name !== activeCache && name.startsWith('santis-v')) {
                        console.log(`🌑 [V44 Purge] Zombi Cache eritildi: ${name}`);
                        return caches.delete(name);
                    }
                })
            );
        }
    }

    aggressivePurge() {
        // Önceliksiz telemetry dump ve temp loglarını uçur
        Object.keys(localStorage).forEach(key => {
            if (key.includes('log_') || key.includes('temp_')) {
                localStorage.removeItem(key);
            }
        });
    }
}

// Global ES Module Kaydı
import { register } from '../core/santis-kernel.js';
export let MemoryPurge;
register('memory_purge', async () => {
    MemoryPurge = new SantisMemoryPurge();
    await MemoryPurge.init();
    
    // API Export
    window.SANTIS.MemoryPurge = MemoryPurge;
    window.SantisPurge = MemoryPurge; // Legacy Bridge
}, ['temporal', 'medyum']); 
