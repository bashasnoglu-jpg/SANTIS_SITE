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
    GALLERY: "/gallery.html",
    PRODUCTS: "/products.html",
    BOOKING: "/booking.html",
    HOTEL: "/hotel.html",
    BLOG_DETAIL: "/blog-detail.html",

    // ═══════════════════════════════════════════════════════════════
    // KATEGORİ SAYFALARI
    // ═══════════════════════════════════════════════════════════════
    CATEGORY: {
        HAMAM: "/tr/hamam/index.html",
        MASSAGE: "/tr/masajlar/index.html",
        SKINCARE: "/tr/cilt-bakimi/index.html"
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
        return `/service-detail.html?slug=${encodeURIComponent(slug)}`;
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
