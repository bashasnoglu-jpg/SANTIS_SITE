/**
 * =======================================================
 * SANTIS DISTRIBUTED COGNITIVE RUNTIME - V43.1
 * Modül: SOVEREIGN NEURAL DB & QUANTUM BUFFER
 * "Sistem ölmez, kuyruklar öldürür. Gerçekliği sıkıştır."
 * =======================================================
 */

import { PRIORITY } from './sovereign-quarantine.js';

class QuantumBufferCore {
    constructor(dbOrchestrator, storeName, flushMs = 500, maxSize = 2000) {
        this.dbO = dbOrchestrator;
        this.storeName = storeName;
        this.buffer = [];
        this.flushMs = flushMs;
        this.maxSize = maxSize;
        this.timer = null;
        
        // 🧠 3. EVENT COLLAPSER (Semantik Sıkıştırma Belleği)
        this.lastKineticEvent = null; 
    }

    push(event, priority = PRIORITY.NORMAL) {
        // 🛑 2. BACKPRESSURE RULE (Sistem Freni)
        // Eğer buffer %80 dolduysa, düşük/normal önemdeki olayları sil (Load Shedding)
        if (this.buffer.length > this.maxSize * 0.8 && priority > PRIORITY.HIGH) {
            return; 
        }

        // 🧠 3. EVENT COLLAPSER (Semantik Sıkıştırma)
        // Optik sinirin 1000 mouse hareketini 1 kinetik vektöre indirge
        if (event.type === 'KINETIC_VECTOR') {
            if (this.lastKineticEvent) {
                // Hızı (Velocity) birleştirerek yeni niyet oluştur (Aggregation)
                this.lastKineticEvent.v = (this.lastKineticEvent.v * 0.8) + (event.v * 0.2);
                this.lastKineticEvent.timestamp = performance.now();
                return; // Buffer'a yeni obje atma, mevcut referansı güncelledik!
            } else {
                this.lastKineticEvent = { ...event };
                this.buffer.push(this.lastKineticEvent);
            }
        } else {
            this.buffer.push(event);
        }

        // 🛑 1. EVENT CORK (RAM GATE) Limit Tetikleyicisi
        if (this.buffer.length >= this.maxSize) {
            this.flush();
            return;
        }

        if (!this.timer) {
            this.timer = setTimeout(() => this.flush(), this.flushMs);
        }
    }

    flush() {
        if (this.buffer.length === 0) return;

        const batch = [...this.buffer];
        this.buffer = [];
        this.timer = null;
        this.lastKineticEvent = null; // Sıkıştırma zincirini sıfırla

        // 🔥 TEK TRANSACTION - Toplu Yazım (Bulk Insert)
        this.dbO._commitBatch(this.storeName, batch);
    }
}

class SovereignNeuralDatabase {
    constructor() {
        this.dbName = 'SantisCognitiveCortex';
        this.dbVersion = 1;
        this.db = null;
        
        this.STORES = {
            TELEMETRY: 'telemetry_stream',
            INTENT: 'user_intent_vectors',
            FRAGMENTS: 'time_fragments'
        };

        this.initPromise = this._connect();
        
        // CORTEX LOBELARI: Her store için izole Quantum Buffer kapıları
        this.buffers = {
            [this.STORES.TELEMETRY]: new QuantumBufferCore(this, this.STORES.TELEMETRY, 500, 2000),
            [this.STORES.INTENT]: new QuantumBufferCore(this, this.STORES.INTENT, 1000, 500)
        };
        
        console.log('🧠 [NEURAL DB] Cortex V43.1 (Quantum Buffer Engine) Started.');
    }

    _connect() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = (e) => reject(e.target.error);
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.STORES.TELEMETRY)) 
                    db.createObjectStore(this.STORES.TELEMETRY, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(this.STORES.INTENT)) {
                    const store = db.createObjectStore(this.STORES.INTENT, { keyPath: 'signature' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
                if (!db.objectStoreNames.contains(this.STORES.FRAGMENTS)) 
                    db.createObjectStore(this.STORES.FRAGMENTS, { keyPath: 'vectorTime' });
            };
        });
    }

    // Eski tehlikeli "fireAndForget" yerine yeni V8 Zırhlı Buffer Yönlendirici (OOM Kalkanı)
    fireAndForget(storeName, data, priority = PRIORITY.NORMAL) {
        if (this.buffers[storeName]) {
            this.buffers[storeName].push({ ...data, _syncTime: Date.now() }, priority);
        } else {
            // Buffer'ı olmayan izole mağazalar için (Drop Policy ile korunmalı)
            this.writeSync(storeName, data).catch(()=>{}); 
        }
    }

    // ⚡ OTONOM BATCH YAZIMI (Tek transaction'da binlerce log)
    async _commitBatch(storeName, batchArray) {
        await this.initPromise;
        if (!this.db || batchArray.length === 0) return;

        try {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Tüm loop aynı single transaction referansını paylaşıyor. GC rahatladı.
            batchArray.forEach(item => store.add(item));
            
            // V8 Engine Optimization: transaction oncomplete event fires organically.
        } catch (e) {
            console.error(`[CORTEX FLUSH] Batch OOM engellendi. Memory dropped.`);
        }
    }

    // Nadir ve hayati anlar için anlık senkron yazım
    async writeSync(storeName, data) {
        await this.initPromise; 
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("Cortex Offline");
            const transaction = this.db.transaction([storeName], 'readwrite');
            const request = transaction.objectStore(storeName).add({ ...data, _syncTime: Date.now() });
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async readAll(storeName) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            if (!this.db) return reject("Cortex Offline");
            const store = this.db.transaction([storeName], 'readonly').objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }
}

export const NeuralDB = new SovereignNeuralDatabase();
window.NeuralDB = NeuralDB;
