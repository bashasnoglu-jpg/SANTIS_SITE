/**
 * ═══════════════════════════════════════════════════════════════
 * 🧠 SANTIS EVENT ISOLATION BUS (İzole Sinir Sistemi)
 * ═══════════════════════════════════════════════════════════════
 * 
 * V5 Dual-Clutch Mimarisinin İletişim Omurgası.
 * Sistemdeki hiçbir olay doğrudan bir işlevi tetikleyemez. Her şey
 * Event Bus'a bildirilir, Event Bus bunları Task olarak paketleyip
 * SantisKernel'e (Scheduler) aktarır. Loose Coupling!
 */

import { Priority } from './santis-kernel.js';

export class SantisEventBus {
    constructor() {
        this.events = {};
    }

    /**
     * Bir modülün belli bir sinyale abone olmasını sağlar.
     * @param {string} eventName - Dinlenecek olayın adı.
     * @param {function} callback - Olay gerçekleştiğinde çalıştırılacak fonksiyon.
     * @param {number} priority - Fonksiyonun SantisKernel'deki çalışma önceliği.
     * @returns {function} Aboneliği iptal etme (unsubscribe) metodu.
     */
    subscribe(eventName, callback, priority = Priority.NORMAL) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }

        // Çift dinlemeyi (duplicate memory leak) engelle
        const exists = this.events[eventName].find(l => l.callback === callback);
        if (!exists) {
            this.events[eventName].push({ callback, priority });
        }

        // React 'useEffect' benzeri kolay cleanup mekanizması
        return () => this.unsubscribe(eventName, callback);
    }

    /**
     * Olayı dinlemeyi bırakır (Apoptosis / Garbage Collection)
     */
    unsubscribe(eventName, callback) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter(l => l.callback !== callback);
        if (this.events[eventName].length === 0) {
            delete this.events[eventName];
        }
    }

    /**
     * Olayı Şehir Şebekesine (Bus) fırlatır.
     * DİKKAT: Fonksiyonları ASLA kendisi çalıştırmaz! 
     * Tüm emirleri SantisKernel'e paketleyip (enqueue) yollar.
     */
    emit(eventName, payload) {
        if (!this.events[eventName]) return;

        this.events[eventName].forEach(listener => {
            // Sinyali al ve Diktatör'e (Kernel'e) teslim et!
            if (window.SantisKernel && typeof window.SantisKernel.enqueue === 'function') {
                window.SantisKernel.enqueue(
                    () => listener.callback(payload),
                    listener.priority,
                    `Event: [${eventName}]`
                );
            } else {
                // Eğer Kernel henüz hayatta değilse (Pre-boot phase), acil durum fallback'i (senkron çalışma)
                console.warn(`⚠️ [Santis Bus] Kernel çevrimdışı. Olay bypass edildi: ${eventName}`);
                try { listener.callback(payload); } catch(e) { console.error(e); }
            }
        });
    }

    /**
     * Ağır DOM olaylarını (Scroll, Resize, MouseMove) asimile eder.
     * Bu sayede tarayıcının Main Thread'ini boğmaz.
     */
    proxyDomEvent(element, domEventName, busEventName, priority = Priority.HIGH) {
        if (!element) return;
        
        element.addEventListener(domEventName, (e) => {
            // Pasif payload transferi. Default eylemleri (prevent default) ASLA çağıramaz
            this.emit(busEventName, e);
        }, { passive: true }); // passive true -> Scroll blokajını engeller
    }
}

// 🌐 KÜRESEL İZOLE SİSTEM MÜHRÜ
if (!window.SantisBus) {
    window.SantisBus = new SantisEventBus();
}
