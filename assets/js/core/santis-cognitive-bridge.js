/**
 * ═══════════════════════════════════════════════════════════════
 * 🌉 SANTIS COGNITIVE BRIDGE (Worker - Ana İplik Köprüsü)
 * ═══════════════════════════════════════════════════════════════
 * Cognitive Worker'ı uyandırır ve Event Bus (SantisBus) ile 
 * senkronize eder. İzole akıldan gelen mesajları Bus'a aktarır.
 */

import { Priority } from './santis-kernel.js';

class CognitiveBridge {
    constructor() {
        this.worker = null;
        this.bootWorker();
    }

    bootWorker() {
        try {
            // Web Worker'ın otonom uyanışı
            this.worker = new Worker('/assets/js/workers/santis-cognitive-worker.js');
            
            // 📡 1. Worker'dan Gelen Sinyalleri Dinle (Gümrük Kapısı)
            this.worker.addEventListener('message', (e) => {
                const { type, event, payload } = e.data;
                
                if (type === 'BUS_EMIT' && window.SantisBus) {
                    // Worker'ın ürettiği bir bilgiyi Ana İplik Event Bus'ına fırlat
                    // Ana İplik (Main Thread) rahatken bunu Scheduler çözecektir.
                    window.SantisBus.emit(event, payload);
                } else if (type === 'ACK') {
                    console.info("🧠 [Cognitive Bridge] Worker çevrimiçi ve izole boyutta faaliyetine başladı.");
                }
            });

            // Worker'ın nabzını kontrol et
            this.worker.postMessage({ type: 'HEARTBEAT' });

            // 📡 2. Ana İplikteki Sinyalleri Worker'a Yönlendir (Postacı)
            this.bindToBus();

        } catch (error) {
            console.error("🚨 [Cognitive Bridge] İzole Worker uyandırılamadı!", error);
        }
    }

    bindToBus() {
        if (!window.SantisBus) {
            console.warn("⚠️ [Cognitive Bridge] SantisBus bulunamadı. Köprü kurulamıyor.");
            return;
        }

        // Fare Hareketlerini (Mousemove/Touch) yorulmadan Worker'a ilet
        window.SantisBus.subscribe('dom:interaction_intent', (payload) => {
            this.worker.postMessage({ type: 'ANALYZE_INTENT', payload });
        });

        // Tüm modüllerden gelen Telemetri paketlerini tek bir batch işlemi için Worker'a at
        window.SantisBus.subscribe('telemetry:log', (payload) => {
            this.worker.postMessage({ type: 'PROCESS_TELEMETRY', payload });
        });
        
        // Cihaz uykusu, sayfa gizlenmesi (Visibility API) gibi kritik görevlerde
        // belleği boşaltması için uyar
        window.SantisBus.subscribe('system:hibernate', () => {
             this.worker.postMessage({ type: 'FORCE_FLUSH' });
        }, Priority.CRITICAL);
    }
}

// 🌐 KÖPRÜ MÜHRÜ
if (!window.SantisCognitiveBridge) {
    window.SantisCognitiveBridge = new CognitiveBridge();
}
