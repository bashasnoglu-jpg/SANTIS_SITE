// /assets/js/core/santis-data-bridge.js

export class SantisDataBridge {
    constructor() {
        this.universeEndpoint = '/assets/data/santis-universe.json';
        this.cache = null;
    }

    /**
     * Sovereign Knowledge Graph'ı sunucudan çeker ve hafızaya alır.
     */
    async fetchUniverse() {
        if (this.cache) return this.cache;

        try {
            console.log("[DATA BRIDGE] Sovereign Universe verisi çekiliyor...");
            const response = await fetch(this.universeEndpoint);
            
            if (!response.ok) throw new Error(`HTTP Hata: ${response.status}`);
            
            this.cache = await response.json();
            console.log(`[DATA BRIDGE] Evren başarıyla yüklendi. Versiyon: ${this.cache.system_config.version}`);
            
            // Veri yüklendiğinde Event Bus üzerinden tüm sisteme haber ver
            if (window.SantisBus) {
                window.SantisBus.emit('data.universe_ready', { data: this.cache });
            }
            
            return this.cache;

        } catch (error) {
            console.error("[DATA BRIDGE EXCEPTION] Veri evreni çöktü!", error);
            // Kalkanın devreye girebilir
            if (window.SantisBus) {
                window.SantisBus.emit('system.ghost_mode_activated', { error });
            }
            return null;
        }
    }

    /** Belirli bir kategoriyi (örneğin sadece boutique'i) getiren yardımcı metod */
    getBoutiqueData() {
        return this.cache ? this.cache.experiences.boutique : null;
    }

    /** 
     * Guided Luxury Commerce Information Architecture 
     * Kategori (Keşif) ve Filtre (Rafine Etme) mimarisini asenkron çözer.
     */
    async loadBoutiqueTaxonomy() {
        try {
            console.log("[DATA BRIDGE] Boutique Taxonomy ve Catalog verileri çekiliyor...");
            const [categoriesRes, filtersRes, catalogRes] = await Promise.all([
                fetch('/assets/data/boutique.categories.json'),
                fetch('/assets/data/boutique.filters.json'),
                fetch('/assets/data/boutique.catalog.json')
            ]);
            
            if (!categoriesRes.ok || !filtersRes.ok || !catalogRes.ok) {
                throw new Error("Ağ hatası: JSON'lar çekilemedi.");
            }

            this.categories = await categoriesRes.json();
            this.filters = await filtersRes.json();
            this.catalog = await catalogRes.json();
            
            console.log(`[DATA BRIDGE] Taxonomy ve ${this.catalog.length} ürün başarıyla yüklendi.`);
        } catch (error) {
            console.error("[DATA BRIDGE EXCEPTION] Veri Yüklenemedi!", error);
            this.categories = [];
            this.filters = {};
            this.catalog = [];
        }
    }

    /**
     * Guided Ritual Platform Architecture
     * Hamam, Servis ve Upgrade JSON veri dizilerini otonom olarak belleğe alır.
     */
    async loadRitualTaxonomy() {
        try {
            console.log("🦅 [DATA BRIDGE] Ritual Orchestrator verileri çekiliyor...");
            const [hamamRes, servicesRes, upgradesRes] = await Promise.all([
                fetch('/assets/data/hamam.catalog.json'),
                fetch('/assets/data/services.catalog.json'),
                fetch('/assets/data/ritual.upgrades.json')
            ]);
            
            if (!hamamRes.ok || !servicesRes.ok || !upgradesRes.ok) {
                throw new Error("Ağ hatası: Ritual JSON'ları çekilemedi.");
            }

            this.hamamCatalog = await hamamRes.json();
            this.servicesCatalog = await servicesRes.json();
            this.ritualUpgrades = await upgradesRes.json();
            
            console.log("[DATA BRIDGE] Ritual Taxonomy (Hamam, Servisler, Upgrades) başarıyla belleğe alındı.");

            // Veriler yüklendiğinde sistemi haberdar et
            document.dispatchEvent(new CustomEvent('santis:rituals:ready'));
        } catch (error) {
            console.error("🚨 [DATA BRIDGE EXCEPTION] Ritual Taxonomy yüklenirken kritik hata!", error);
            this.hamamCatalog = null;
            this.servicesCatalog = null;
            this.ritualUpgrades = null;
        }
    }

    /**
     * Sovereign SSOT (Single Source of Truth)
     * Yeni Master Catalog yükleme köprüsü.
     */
    async loadMasterCatalog() {
        try {
            console.log("🦅 [Data Bridge] Master Catalog Tüneli Açılıyor...");
            const response = await fetch('/assets/data/santis-master-catalog.json');
            
            if (!response.ok) throw new Error("Katalog sinyali koptu!");
            
            this.masterCatalog = await response.json();
            console.log("✅ [Data Bridge] SSOT Hafızaya Alındı:", this.masterCatalog);
            
            // Veri hazır olduğunda Sovereign Bus üzerinden sinyal çak
            document.dispatchEvent(new CustomEvent('santis:data:ready'));
        } catch (error) {
            console.error("❌ [Data Bridge] Veri Sızıntısı:", error);
        }
    }

    getFiltersForCategory(categoryId) {
        return this.filters && this.filters[categoryId] ? this.filters[categoryId].groups : [];
    }

    getProductsForCategory(categoryId, refinement = null) {
        if (!this.catalog) return [];
        let filtered = categoryId === 'ALL' ? this.catalog : this.catalog.filter(p => p.category === categoryId);
        
        if (refinement && refinement.optionId && refinement.groupId) {
            filtered = filtered.filter(p => p[refinement.groupId] === refinement.optionId);
        }
        return filtered;
    }
}

// Global olarak köprüyü oluştur
window.SantisData = new SantisDataBridge();
