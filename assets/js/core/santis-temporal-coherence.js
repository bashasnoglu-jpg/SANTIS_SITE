/**
 * =======================================================
 * SANTIS DISTRIBUTED COGNITIVE RUNTIME - V42.5
 * Modül: Temporal Coherence Engine & Quantum Buffer
 * "Arayüz geleceği yaşar, Hafıza geçmişin özetini tutar."
 * =======================================================
 */

import { PRIORITY } from './sovereign-quarantine.js';

// 🗜️ 1. SEMANTIC COLLAPSER (Anlamsal Sıkıştırıcı)
class SemanticCollapser {
    static compress(rawEvents) {
        if (rawEvents.length === 0) return [];
        
        const compressed = [];
        let spatialSession = { active: false, type: null, dx: 0, dy: 0, count: 0, start: 0, end: 0 };
        
        for (const evt of rawEvents) {
            // CRITICAL / HIGH öncelikli olaylar ASLA ezilmez, direkt geçer.
            if (evt.priority <= PRIORITY.HIGH) {
                compressed.push(evt);
                continue;
            }
            
            // LOW öncelikli duyusal gürültüyü (Scroll, Pointer) Vektöre sıkıştır
            if (evt.type === 'SCROLL_TICK' || evt.type === 'POINTER_MOVE') {
                if (!spatialSession.active) {
                    spatialSession = { active: true, type: evt.type, dx: 0, dy: 0, count: 0, start: evt.timestamp, end: evt.timestamp };
                }
                spatialSession.dx += evt.payload.dx || 0;
                spatialSession.dy += evt.payload.dy || 0;
                spatialSession.end = evt.timestamp;
                spatialSession.count++;
            } else {
                compressed.push(evt); // Diğer NORMAL olaylar kütüğe aktarılır
            }
        }

        // Birikmiş uzamsal gürültüyü tek bir Kinetik Niyet'e (Kinetic Intent) dönüştür
        if (spatialSession.count > 0) {
            const dt = Math.max(spatialSession.end - spatialSession.start, 1);
            compressed.push({
                type: 'KINETIC_INTENT',
                priority: PRIORITY.LOW,
                timestamp: spatialSession.end,
                payload: {
                    source: spatialSession.type,
                    velocity: Math.sqrt(spatialSession.dx**2 + spatialSession.dy**2) / dt,
                    samplesCollapsed: spatialSession.count,
                    durationMs: dt
                }
            });
        }

        return compressed;
    }
}

// 📦 2. THE QUANTUM BUFFER (RAM Kalkanı & Kese)
export class QuantumMemoryBuffer {
    constructor(dbCommitFn, flushMs = 500, maxSize = 1000) {
        this.buffer = [];
        this.flushMs = flushMs;
        this.maxSize = maxSize; 
        this.timer = null;
        this.isFlushing = false;
        this.dbCommit = dbCommitFn; // Neural DB Bulk Insert fonksiyonu
    }

    ingest(event, currentPressure = 0) {
        // 🚨 BACKPRESSURE RULE (Acımasız Sistem Freni)
        // Kese taşıyorsa ve cihaz ısınıyorsa, önemsiz veriyi RAM'e bile alma!
        if (this.buffer.length > (this.maxSize * 0.7) && currentPressure > 0) {
            if (event.priority > PRIORITY.HIGH) {
                return; // OOM Drop Policy (Sıfır GC Maliyeti)
            }
        }

        this.buffer.push(event);

        // Kırmızı Çizgi: Kese dolduysa süreyi bekleme, ANINDA BOŞALT!
        if (this.buffer.length >= this.maxSize) {
            this.flush();
            return;
        }

        if (!this.timer) {
            this.timer = setTimeout(() => this.flush(), this.flushMs);
        }
    }

    async flush() {
        if (this.buffer.length === 0 || this.isFlushing) return;
        this.isFlushing = true;

        // RAM'i anında kopar (Main Thread'i kilitleme, yeni eventlere yer aç)
        const rawBatch = this.buffer.splice(0, this.buffer.length);
        if (this.timer) { clearTimeout(this.timer); this.timer = null; }

        // 🧠 Semantik Sıkıştırma (Örn: 1000 ham event -> 5 niyet vektörü)
        const compressedBatch = SemanticCollapser.compress(rawBatch);

        // 💾 TEK BİR TRANSACTION İLE YAZ (IndexedDB)
        try {
            if (this.dbCommit && compressedBatch.length > 0) {
                // requestIdleCallback ile UI thread'ini bölmeden diske yaz
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => this.dbCommit(compressedBatch), { timeout: 1000 });
                } else {
                    setTimeout(() => this.dbCommit(compressedBatch), 0);
                }
            }
        } catch (e) {
            console.error("💥 [SDCR] Kuantum Kesesi diske yazılamadı! Main Thread kurtarıldı.", e);
        } finally {
            this.isFlushing = false;
        }
    }
}

// 🔮 3. TEMPORAL COHERENCE ENGINE (Gecikme İllüzyonu Kırıcı)
export class TemporalCoherenceEngine {
    constructor(dbCommitFn) {
        this.quantumBuffer = new QuantumMemoryBuffer(dbCommitFn);
    }

    process(event) {
        // --- PREDICTIVE UI HOOK (Arayüzü Geleceğe Taşı) ---
        // Diske yazılmayı (500ms batch) beklemeden, UI'ın gelecekteki durumunu CSS'e fısılda!
        if ((event.type === 'SCROLL_TICK' || event.type === 'POINTER_MOVE') && event.payload && event.payload.velocity) {
            // JS Layout Thrashing YAPMADAN, sadece GPU Compositor'a ivmeyi ver:
            document.documentElement.style.setProperty('--l9-live-velocity', event.payload.velocity.toFixed(3));
        }

        // Donanım anlık basıncını oku
        const currentPressure = window.__SDCR_PRESSURE || 0;

        // Ham veriyi Kuantum Kesesine yolla, arkasını Buffer ve Collapser toplar
        this.quantumBuffer.ingest(event, currentPressure);
    }
}
