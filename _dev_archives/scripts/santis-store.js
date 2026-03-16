/**
 * ========================================================================
 * SOVEREIGN OS v10 - LAYER 3: SANTIS STATE STORE (REACTIVE HUB)
 * ========================================================================
 * Görevi: Merkezi Durum Yönetimi. Admin paneli ile Motor arasındaki vites kutusu.
 */
import { SantisDataAegis } from './santis-data-middleware.js';
import { SantisCache } from './santis-cache.js';

class SantisStateStore {
    constructor() {
        this.engineListeners = new Set();
    }

    // V10 Motoru ayağa kalktığında kulağını buraya dayar (Subscribe)
    subscribe(engineInstance) {
        if (engineInstance && typeof engineInstance.onStoreMutation === 'function') {
            this.engineListeners.add(engineInstance);
            console.log('🔌 [SantisStore] V10 Engine reaktif ağa bağlandı.');
        }
    }

    unsubscribe(engineInstance) {
        this.engineListeners.delete(engineInstance);
    }

    // 🟢 YENİ ÜRÜN EKLENDİ (Admin'den)
    addService(rawPayload) {
        const pureData = SantisDataAegis.normalizeService(rawPayload);
        if (pureData) {
            SantisCache.surgicalPatch('ADD', pureData);
            this.notifyEngines('ADD', pureData);
        }
    }

    // 🟡 ÜRÜN GÜNCELLENDİ (Fiyat değişti vs.)
    updateService(rawPayload) {
        const pureData = SantisDataAegis.normalizeService(rawPayload);
        if (pureData) {
            SantisCache.surgicalPatch('UPDATE', pureData);
            this.notifyEngines('UPDATE', pureData);
        }
    }

    // 🔴 ÜRÜN SİLİNDİ (Soft Delete)
    deleteService(id, category = null) {
        if (!id) return;
        const payload = { id, category };
        SantisCache.surgicalPatch('DELETE', payload);
        this.notifyEngines('DELETE', payload);
    }

    // Tüm Bağlı Motorlara Sinyali Ateşle
    notifyEngines(action, payload) {
        this.engineListeners.forEach(engine => {
            try {
                engine.onStoreMutation(action, payload);
            } catch (e) {
                console.error('🚨 [SantisStore] Motor reaksiyon hatası:', e);
            }
        });
    }
}

// Global Singleton (SPA geçişinde State ölmez)
window.__SANTIS_STORE__ = window.__SANTIS_STORE__ || new SantisStateStore();
export const Store = window.__SANTIS_STORE__;
