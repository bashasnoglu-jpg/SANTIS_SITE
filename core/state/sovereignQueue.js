/**
 * SovereignQueue: Otoriter Çevrimdışı Komut Kuyruğu (Yetimhane)
 * Native IndexedDB kullanarak çevrimdışıken verilen God Mode komutlarını saklar ve ağ geri geldiğinde ateşler.
 */

export const SovereignQueue = (() => {
    const DB_NAME = 'santis-sanctuary-db';
    const STORE_NAME = 'command-orphanage';
    const DB_VERSION = 1;
    let dbInstance = null;

    // 1. Veritabanını Başlat (Yetimhaneyi İnşa Et)
    const initDB = () => {
        return new Promise((resolve, reject) => {
            if (dbInstance) return resolve(dbInstance);

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    // Otomatik artan bir ID ile tabloyu oluştur
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                dbInstance = event.target.result;
                resolve(dbInstance);
            };

            request.onerror = (event) => {
                console.error("🚨 [SovereignQueue] Veritabanı başlatılamadı:", event.target.error);
                reject(event.target.error);
            };
        });
    };

    // 2. Kuyruğa Komut Ekle (Yetimhaneye Kayıt)
    const enqueue = async (commandPayload) => {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            // Komutun yanına timestamp ekleyerek sakla
            const request = store.add({
                payload: commandPayload,
                timestamp: new Date().toISOString(),
                status: 'pending'
            });

            request.onsuccess = () => {
                console.log("📦 [SovereignQueue] Komut çevrimdışı kuyruğa alındı:", commandPayload.action);
                resolve();
            };
            request.onerror = (e) => reject(e.target.error);
        });
    };

    // 3. Kuyruğu Temizle ve Backend'e Ateşle (Ağ Geri Geldiğinde)
    const processQueue = async (apiDispatcherCallback) => {
        if (!navigator.onLine) return; // Hala offline isek hiçbir şey yapma

        const db = await initDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = async () => {
            const orphans = request.result;
            if (orphans.length === 0) return;

            console.log(`🌐 [SovereignQueue] Ağ bağlantısı kuruldu. ${orphans.length} bekleyen komut işleniyor...`);

            for (const orphan of orphans) {
                try {
                    // API'ye göndermeyi dene (Başarılı olursa sil)
                    await apiDispatcherCallback(orphan.payload);
                    store.delete(orphan.id);
                    console.log(`✅ [SovereignQueue] Bekleyen komut başarıyla iletildi:`, orphan.payload.action);
                } catch (error) {
                    console.error(`❌ [SovereignQueue] Komut iletimi başarısız, kuyrukta kalmaya devam edecek:`, error);
                }
            }
        };
    };

    // 4. Otonom Dinleyiciler: Tarayıcı "Online" olduğu an kuyruğu işlet
    window.addEventListener('online', () => {
        // Not: Gerçek API fonksiyonunu buraya bağlamamız gerekecek
        document.dispatchEvent(new CustomEvent('sovereign:network:restored'));
    });

    return { init: initDB, enqueue, processQueue };
})();
