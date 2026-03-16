/**
 * 🌌 [SANTIS OMNISCIENCE] Phase 11: Gölge Hafıza (Zero-Click Intent Tracking)
 * Sovereign Shadow DB (IndexedDB Wrapper)
 * ------------------------------------------------------------------------
 * Kullanıcının Kuantum Havuzu'ndaki (Virtual Engine) "Dwell Time" (Gezinme Süresi)
 * verilerini, kartlara tıklayıp tıklamadığına bakmaksızın asenkron olarak saklar.
 * Sonraki gelişlerinde motoru doğrudan o indekse ışınlar.
 */

window.SovereignShadowDB = (function () {
    const DB_NAME = 'SantisShadowDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'dwell_memory';
    let db = null;
    let initPromise = null;

    function init() {
        if (initPromise) return initPromise;

        initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.warn("🌑 [Shadow DB] Başlatılamadı:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log("🌑 [Shadow DB] Online. Gölge Hafıza Aktif.");
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const upgradeDb = event.target.result;
                if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
                    upgradeDb.createObjectStore(STORE_NAME, { keyPath: 'railId' });
                }
            };
        });

        return initPromise;
    }

    async function saveMemory(railId, targetIndex) {
        if (!db) await init();
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);

                // Zaman damgası ile kaydet
                const data = {
                    railId: railId,
                    lastIndex: targetIndex,
                    timestamp: Date.now()
                };

                const request = store.put(data);

                request.onsuccess = () => resolve(true);
                request.onerror = (e) => reject(e.target.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async function getMemory(railId) {
        if (!db) await init();
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(railId);

                request.onsuccess = (event) => {
                    const data = event.target.result;
                    if (data) {
                        // Hafıza 3 günden eski mi kontrol et (Eski datayı unut)
                        const daysOld = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
                        if (daysOld > 3) {
                            resolve(null);
                        } else {
                            resolve(data.lastIndex);
                        }
                    } else {
                        resolve(null);
                    }
                };
                request.onerror = (e) => reject(e.target.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    return {
        init,
        saveMemory,
        getMemory
    };
})();

// Bootloader'dan önce DB'yi hazırlamaya başla (Non-blocking)
if (window.indexedDB) {
    window.SovereignShadowDB.init().catch(() => { });
}
