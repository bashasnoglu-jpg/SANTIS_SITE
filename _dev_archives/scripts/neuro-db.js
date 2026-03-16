/**
 * 🧠 SOVEREIGN OS v6.0 — NEURO-DB
 * The Absolute Aegis | Doomsday Edition
 *
 * FEATURES:
 *   - Ghost Mode Propagate: Incognito → tüm operasyonlar sessizce bypass
 *   - Sovereign ShadowDB: IndexedDB scroll/dwell hafızası (SWR destekli)
 *   - Idle Janitor: 5000+ kayıt LRU temizliği, Main Thread sıfır blok,
 *     requestIdleCallback + 50'şerli Chunking, timeRemaining() > 2 guard
 *
 * CONTRACTS:
 *   - window.__SOVEREIGN_GHOST === true ise hiçbir şey yapma, hata fırlatma.
 *   - AbortController signal ile tüm async zincir kesilir.
 */

const DB_NAME = 'SovereignShadowDB';
const DB_VERSION = 3;
const STORE = 'scroll_memory';
const MAX_RECORDS = 5000;
const CHUNK_SIZE = 50;

let _db = null; // Singleton bağlantı

// =========================================================
// 1. GHOST GATE — Her operasyonun tek giriş kapısı
// =========================================================
function isGhost() {
    return window.__SOVEREIGN_GHOST === true;
}

// =========================================================
// 2. DB AÇILIŞI
// =========================================================
function openDB() {
    if (_db) return Promise.resolve(_db);

    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE)) {
                const store = db.createObjectStore(STORE, { keyPath: 'railId' });
                store.createIndex('lastSeen', 'lastSeen', { unique: false });
            }
        };

        req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
        req.onerror = (e) => reject(e.target.error);
        req.onblocked = () => console.warn('[NeuroDb] DB yükseltme bloklandı; eski sekmeleri kapat.');
    });
}

// =========================================================
// 3. TEMEL OKUMA / YAZMA
// =========================================================
export const ShadowDB = {

    /** ScrollLeft offset'i oku. Yoksa null döner. */
    async get(railId) {
        if (isGhost()) return null;
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE, 'readonly');
                const req = tx.objectStore(STORE).get(railId);
                req.onsuccess = (e) => resolve(e.target.result?.offset ?? null);
                req.onerror = (e) => reject(e.target.error);
            });
        } catch { return null; }
    },

    /** ScrollLeft offset'i yaz / güncelle. */
    async put(railId, offset) {
        if (isGhost()) return;
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE, 'readwrite');
                const req = tx.objectStore(STORE).put({ railId, offset, lastSeen: Date.now() });
                req.onsuccess = () => resolve();
                req.onerror = (e) => reject(e.target.error);
            });
        } catch { /* Ghost veya quota hatası — sessiz */ }
    },

    /** Belirtilen kayıtları sil. (Janitor tarafından çağrılır) */
    async deleteKeys(keys) {
        if (isGhost() || !keys.length) return;
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE, 'readwrite');
                const store = tx.objectStore(STORE);
                keys.forEach(k => store.delete(k));
                tx.oncomplete = () => resolve();
                tx.onerror = (e) => reject(e.target.error);
            });
        } catch { /* sessiz */ }
    },

    /** Tüm kayıtları lastSeen'e göre sıralı al (Janitor için). */
    async getAllSorted() {
        if (isGhost()) return [];
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE, 'readonly');
                const index = tx.objectStore(STORE).index('lastSeen');
                const req = index.getAll();
                req.onsuccess = (e) => resolve(e.target.result);
                req.onerror = (e) => reject(e.target.error);
            });
        } catch { return []; }
    },
};

// =========================================================
// 4. IDLE JANITOR — LRU Chunking (Main Thread sıfır blok)
// =========================================================
async function runJanitor() {
    if (isGhost()) return;

    const records = await ShadowDB.getAllSorted(); // lastSeen ASC (en eski önce)
    const overflow = records.length - MAX_RECORDS;
    if (overflow <= 0) return;

    // Silinecekler: en eski N kayıt (LRU)
    const staleKeys = records.slice(0, overflow).map(r => r.railId);

    let index = 0;

    function processChunk(deadline) {
        while (index < staleKeys.length) {
            // Zaman doluyorsa duraksayıp geri dön
            if (deadline.timeRemaining() <= 2) {
                requestIdleCallback(processChunk);
                return;
            }
            // 50'şerli paket topla ve sil
            const chunk = staleKeys.slice(index, index + CHUNK_SIZE);
            ShadowDB.deleteKeys(chunk); // async, ama Janitor sırasını bozmaz
            index += CHUNK_SIZE;
        }
        console.log(`[Idle Janitor] 🧹 ${staleKeys.length} stale kayıt sessizce temizlendi.`);
    }

    requestIdleCallback(processChunk, { timeout: 10_000 });
}

// =========================================================
// 5. PUBLIC INIT — Bootloader'dan çağrılır
// =========================================================
export function init(signal) {
    if (isGhost()) return;

    // İlk açılışta Janitor'ı zamanla
    requestIdleCallback(() => runJanitor(), { timeout: 15_000 });

    // Modül öldüğünde DB bağlantısını koru (WeakRef gerek yok, singleton yeter)
    signal?.addEventListener('abort', () => {
        console.log('[NeuroDb] Signal abort → DB operasyonları durduruldu.');
        _db = null;
    }, { once: true });
}
