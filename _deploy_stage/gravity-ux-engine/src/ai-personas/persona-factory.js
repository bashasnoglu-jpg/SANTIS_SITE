/**
 * ========================================================================
 * UX GRAVITY ENGINE — AI PERSONAS (Nöro-Bilişsel Bot Profilleri)
 * ========================================================================
 * Her sanal ziyaretçi bir "kişilik" ile doğar.
 * Bu kişilikler gerçek nöro-pazarlama araştırmalarına dayanır.
 */

export class PersonaFactory {

    static PROFILES = {
        /**
         * VIP HUNTER — Fiyata bakmaz, prestije bakar.
         * Kütlesi yüksek (pahalı/lüks) ürünlere daha güçlü çekilir.
         * Gerçek dünya: Altın kredi kartlı müşteri.
         */
        vip: {
            id: 'vip',
            name: 'VIP Hunter',
            color: '#d4af37',
            massAffinity: 1.8,        // Yüksek kütleli ürünlere %80 daha fazla çekim
            priceBlindness: 0.9,       // Fiyatı neredeyse görmez
            attentionSpan: 12000,      // 12 saniye sabır
            fPatternStrength: 0.3,     // F-Pattern zayıf (gezer, bakar)
            impulseThreshold: 0.2,     // Düşük dürtü eşiği (kolay satın alır)
            entryPattern: 'center',    // Sayfanın ortasından girer
            speed: { min: 1.5, max: 3 }
        },

        /**
         * IMPULSE BUYER — Parlak şeylere atlar, hızlı karar verir.
         * Küçük kütleli ama görsel olarak dikkat çekici ürünlere yönelir.
         * Gerçek dünya: Instagram'dan gelen trafik.
         */
        impulse: {
            id: 'impulse',
            name: 'Impulse Buyer',
            color: '#ff3366',
            massAffinity: 0.8,
            priceBlindness: 0.5,
            attentionSpan: 4000,       // 4 saniye sabır (hızlı terk eder)
            fPatternStrength: 0.1,     // F-Pattern yok (rastgele tarar)
            impulseThreshold: 0.7,     // Yüksek dürtü eşiği (ani karar)
            entryPattern: 'random',    // Rastgele noktadan girer
            speed: { min: 3, max: 6 }
        },

        /**
         * OBSERVER — F-Pattern tarayıcı, araştırmacı.
         * Sol üstten başlar, Z-formu ile tarar, nadiren satın alır.
         * Gerçek dünya: Google'dan gelen organik trafik.
         */
        observer: {
            id: 'observer',
            name: 'Observer (F-Pattern)',
            color: '#00e5ff',
            massAffinity: 1.0,
            priceBlindness: 0.2,       // Fiyatı çok önemser
            attentionSpan: 8000,       // 8 saniye
            fPatternStrength: 0.9,     // Güçlü F-Pattern (sol üstten başlar)
            impulseThreshold: 0.1,     // Çok düşük dürtü (zor satın alır)
            entryPattern: 'top-left',  // Sol üstten girer (F-Pattern başlangıcı)
            speed: { min: 1, max: 2.5 }
        },

        /**
         * BARGAIN SEEKER — İndirim ve fırsat avcısı.
         * Düşük fiyatlı ürünlere doğru çekilir.
         * Gerçek dünya: Kupon sitesinden gelen trafik.
         */
        bargain: {
            id: 'bargain',
            name: 'Bargain Seeker',
            color: '#4ade80',
            massAffinity: 0.4,        // Düşük kütleye (ucuz ürünlere) yönelir
            priceBlindness: 0.05,      // Fiyatı lazer gibi görür
            attentionSpan: 6000,
            fPatternStrength: 0.5,
            impulseThreshold: 0.4,
            entryPattern: 'top',
            speed: { min: 2, max: 4 }
        }
    };

    /**
     * Belirli bir dağılıma göre bot üret.
     * @param {number} count - Toplam bot sayısı
     * @param {object} distribution - { vip: 0.1, impulse: 0.3, observer: 0.4, bargain: 0.2 }
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    static generate(count, distribution, canvasWidth, canvasHeight) {
        const bots = [];
        const types = Object.entries(distribution);

        for (let i = 0; i < count; i++) {
            // Dağılıma göre tip seç
            let rand = Math.random();
            let persona = null;
            for (const [type, weight] of types) {
                rand -= weight;
                if (rand <= 0) {
                    persona = PersonaFactory.PROFILES[type];
                    break;
                }
            }
            if (!persona) persona = PersonaFactory.PROFILES.observer;

            // Giriş pozisyonu
            let x, y;
            switch (persona.entryPattern) {
                case 'center':
                    x = canvasWidth * 0.3 + Math.random() * canvasWidth * 0.4;
                    y = -50 - Math.random() * 200;
                    break;
                case 'top-left':
                    x = Math.random() * canvasWidth * 0.3;
                    y = -50 - Math.random() * 300;
                    break;
                case 'random':
                    x = Math.random() * canvasWidth;
                    y = -50 - Math.random() * canvasWidth;
                    break;
                default:
                    x = Math.random() * canvasWidth;
                    y = -50 - Math.random() * 200;
            }

            const speed = persona.speed.min + Math.random() * (persona.speed.max - persona.speed.min);

            bots.push({
                id: i,
                x,
                y,
                vx: 0,
                vy: speed,
                active: true,
                persona: persona.id,
                color: persona.color,
                massAffinity: persona.massAffinity,
                attentionSpan: persona.attentionSpan,
                impulseThreshold: persona.impulseThreshold,
                fPatternStrength: persona.fPatternStrength,
                bornAt: performance.now()
            });
        }

        return bots;
    }
}
