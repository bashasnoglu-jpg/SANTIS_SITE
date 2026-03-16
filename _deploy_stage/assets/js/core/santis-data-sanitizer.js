/**
 * SANTIS OS - SOVEREIGN DATA SANITIZER V1
 * Kuantum Veri Güvenliği: "Sessiz Lüks" asla kırık veri (null, undefined, "") sızdırmaz.
 * Factory Pattern'a ulaşmadan önce gelen ham JSON'u bir DTO (Data Transfer Object) olarak arıtır.
 */

export class SovereignDataSanitizer {
    /**
     * Ham JSON ritüel objesini alır, null/undefined sızıntılarını mühürleyip kusursuz bir DTO döndürür.
     */
    static sanitizeRitual(raw) {
        if (!raw) return this.getVoidFallback();

        // 1. DTO (Data Transfer Object) İnşası: 
        // Burada || mantıksal operatörünü sadece "gerçekten boş" kalmasını istemediğimiz stringler için kullanıyoruz.
        // Fiyat gibi sayı olabilecek değerlerde "??" (Nullish Coalescing) veya tip kontrolü kullanıyoruz.

        const DTO = {
            id: raw.id || raw.key || `sovereign-void-${Math.random().toString(36).substr(2, 9)}`,

            // Dinamik çok-dilli title veya fallback
            title: raw.content?.tr?.title || raw.ui?.title || raw.name || raw.title || "Özel Sovereign Deneyimi",

            // Kuru price nesnesinden amount çıkart ve euro formatına sok, [object Object] sızıntısını engelle
            price: raw.price?.amount ? `€${raw.price.amount}` :
                (raw.ui?.price_eur ? `€${raw.ui.price_eur}` :
                    (typeof raw.price === 'string' ? raw.price : "Sizi Bekliyor")),

            duration: raw.duration || "Özel Randevu",

            // Kuantum Aura
            aura_color: (raw.gpu_dna?.color) ? `rgb(${raw.gpu_dna.color.join(',')})` : (raw.aura_color || "var(--nv-gold-muted, #B39B59)"),

            // Media resmini /assets/img/cards/ kök yolu ile birleştir
            image_url: raw.image ? raw.image :
                (raw.media?.hero ? `/assets/img/cards/${raw.media.hero}` :
                    (raw.media?.thumb ? `/assets/img/cards/${raw.media.thumb}` : "/assets/img/placeholder-sovereign-void.jpg")),

            alt_text: (raw.content?.tr?.title || raw.title || "Santis Club") + " - Sovereign Ritüeli",

            // Dinamik Yönlendirici: API'den gelirse kullan, yoksa tahmini route'u Global Resolver ile bul
            detail_url: raw.detailUrl || raw.url || (
                typeof window !== 'undefined' && window.SANTIS_RESOLVE_PATH
                    ? window.SANTIS_RESOLVE_PATH(raw.slug || raw.id || raw.key || 'santis-exclusive')
                    : `/tr/hizmet-detay.html?id=${raw.id || raw.key || 'santis-exclusive'}`
            )
        };


        // Kuantum Mührünü Bas (O(1) Hash)
        DTO.hash = this.generateSovereignHash(DTO.title, DTO.price, DTO.aura_color);

        return DTO;
    }

    /**
     * Kuantum O(1) Parmak İzi (Hash) Oluşturucu.
     * Sadece değişmeye yatkın (mutable) değerlerden müthiş hızlı bir 32-bit Kuantum Mühür üretir.
     */
    static generateSovereignHash(title, price, aura_color) {
        const rawState = `${price}|${title}|${aura_color}`;
        let hash = 0;
        for (let i = 0; i < rawState.length; i++) {
            const char = rawState.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash &= hash; // 32-bit integer'a zorla
        }
        return `sq_${Math.abs(hash).toString(36)}`;
    }

    /**
     * Düzeltilemeyecek kadar bozuk bir obje (`null`) geldiğinde döndürülecek mutlak karanlık kalkanı.
     */
    static getVoidFallback() {
        return {
            id: "santis-unknown-ritual",
            title: "Sovereign Kuantum Ritüeli",
            price: "Keşfetmek İçin Bize Ulaşın",
            duration: "Görüşme İle Belirlenir",
            aura_color: "var(--nv-gold-muted, #B39B59)",
            image_url: "assets/img/placeholder-sovereign-void.jpg",
            alt_text: "Santis Club - Sovereign Aura",
            detail_url: "/tr/"
        };
    }
}
