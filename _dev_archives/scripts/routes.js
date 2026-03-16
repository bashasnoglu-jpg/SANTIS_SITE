/**

 * SANTIS CLUB - ROUTES.JS

 * Merkezi URL Yönetim Sistemi v1.0

 * 

 * Tüm site URL'lerini tek bir yerden yönetir.

 * Değişiklik yapmanız gerektiğinde sadece bu dosyayı güncelleyin.

 */



const SANTIS_ROUTES = {

    // ═══════════════════════════════════════════════════════════════

    // ANA SAYFALAR

    // ═══════════════════════════════════════════════════════════════

    HOME: "/index.html",

    get GALLERY() { return (window.SantisRouter ? SantisRouter.categoryPath('galeri') : '/tr/galeri/index.html'); },

    get PRODUCTS() { return (window.SantisRouter ? SantisRouter.categoryPath('urunler') : '/tr/urunler/index.html'); },

    BOOKING: "/booking.html",

    HOTEL: "/hotel.html",

    BLOG_DETAIL: "/blog-detail.html",



    // ═══════════════════════════════════════════════════════════════

    // KATEGORİ SAYFALARI

    // ═══════════════════════════════════════════════════════════════

    CATEGORY: {

        get HAMAM() { return (window.SantisRouter ? SantisRouter.categoryPath('hamam') : '/tr/hamam/index.html'); },

        get MASSAGE() { return (window.SantisRouter ? SantisRouter.categoryPath('masajlar') : '/tr/masajlar/index.html'); },

        get SKINCARE() { return (window.SantisRouter ? SantisRouter.categoryPath('cilt-bakimi') : '/tr/cilt-bakimi/index.html'); }

    },



    // ═══════════════════════════════════════════════════════════════

    // DİNAMİK SAYFALAR

    // ═══════════════════════════════════════════════════════════════



    /**

     * Servis detay sayfası URL'si oluşturur

     * @param {string} slug - Servis slug'ı (örn: "osmanli-ritueli")

     * @returns {string} Tam URL (örn: "/service-detail.html?slug=osmanli-ritueli")

     */

    serviceDetail(slug) {

        if (!slug) {

            console.warn("[ROUTES] serviceDetail: slug parametresi boş!");

            return SANTIS_ROUTES.HOME;

        }

        // STATIC URL FIX (V5.5)
        // Since we don't have the category context here, we must try to guess or use a general fallback.
        // ideally this function should accept a category.
        // For now, we will assume it's a product and let the server/404 handle if wrong, 
        // OR we can default to 'masajlar' if we can't determine.
        // BETTER: We can't easily guess section from just slug without data. 
        // But for the sake of the user request, we must NOT return service-detail.html.

        // If we can't determine section, we might need to rely on a catalogue lookup or default.
        // Let's check if we can access the catalog global here?
        let section = 'masajlar';
        if (window.productCatalog) {
            const item = window.productCatalog.find(p => p.slug === slug || p.id === slug);
            if (item) {
                const cat = (item.categoryId || item.category || '').toLowerCase();
                if (cat.includes('hammam') || cat.includes('hamam')) section = 'hamam';
                else if (cat.includes('skin') || cat.includes('cilt') || cat.includes('face') || cat.includes('sothys')) section = 'cilt-bakimi';
            }
        }

        const lang = (window.SITE_LANG || 'tr').toLowerCase();
        return `/${lang}/${section}/${slug}.html`;

    },



    /**

     * Kategori sayfası URL'si döndürür

     * @param {string} type - Kategori tipi (HAMAM, MASSAGE, SKINCARE)

     * @returns {string} Kategori URL'si

     */

    category(type) {

        const key = (type || "").toUpperCase();

        return SANTIS_ROUTES.CATEGORY[key] || SANTIS_ROUTES.HOME;

    },



    // ═══════════════════════════════════════════════════════════════

    // EXTERNAL LİNKLER

    // ═══════════════════════════════════════════════════════════════



    /**

     * WhatsApp rezervasyon linki oluşturur

     * @param {string} phone - Telefon numarası (default: 905348350169)

     * @param {string} message - Opsiyonel önceden yazılmış mesaj

     * @returns {string} WhatsApp URL'si

     */

    whatsapp(phone = "905348350169", message = "") {

        let url = `https://wa.me/${phone}`;

        if (message) {

            url += `?text=${encodeURIComponent(message)}`;

        }

        return url;

    },



    /**

     * WhatsApp rezervasyon linki (servis bilgisi ile)

     * @param {string} serviceName - Servis adı

     * @param {string} date - Tarih (opsiyonel)

     * @returns {string} WhatsApp URL'si

     */

    whatsappBooking(serviceName, date = "") {

        const dateText = date ? ` ${date} tarihinde` : "";

        const message = `Merhaba, ${serviceName}${dateText} için rezervasyon yapmak istiyorum.`;

        return SANTIS_ROUTES.whatsapp("905348350169", message);

    },



    // ═══════════════════════════════════════════════════════════════

    // SOSYAL MEDYA

    // ═══════════════════════════════════════════════════════════════

    SOCIAL: {

        INSTAGRAM: "https://instagram.com/santisclub",

        YOUTUBE: "https://youtube.com/@santisclub",

        TIKTOK: "https://tiktok.com/@santisclub",

        TUMBLR: "https://tumblr.com/santisclub",

        SPOTIFY: "https://open.spotify.com/user/santisclub"

    },



    // ═══════════════════════════════════════════════════════════════

    // YARDIMCI FONKSİYONLAR

    // ═══════════════════════════════════════════════════════════════



    /**

     * Mevcut sayfa yolunu döndürür

     * @returns {string} Sayfa yolu (örn: "/tr/hamam/index.html")

     */

    getCurrentPath() {

        return window.location.pathname;

    },



    /**

     * Mevcut sayfanın belirtilen kategoride olup olmadığını kontrol eder

     * @param {string} category - Kategori adı

     * @returns {boolean}

     */

    isInCategory(category) {

        const path = this.getCurrentPath().toLowerCase();

        const catLower = (category || "").toLowerCase();

        return path.includes(catLower);

    },



    /**

     * Harici link için güvenli attribute'lar döndürür

     * @returns {object} {target, rel}

     */

    externalLinkAttrs() {

        return {

            target: "_blank",

            rel: "noopener noreferrer"

        };

    },



    /**

     * URL'den slug parametresini çıkarır

     * @returns {string|null} Slug veya null

     */

    getSlugFromUrl() {

        const params = new URLSearchParams(window.location.search);

        return params.get("slug");

    }

};



// Global erişim için window'a ekle

window.SANTIS_ROUTES = SANTIS_ROUTES;



// Module export (ES6 modüller için)

if (typeof module !== 'undefined' && module.exports) {

    module.exports = SANTIS_ROUTES;

}



console.log("🛣️ Santis Routes v1.0 yüklendi.");

