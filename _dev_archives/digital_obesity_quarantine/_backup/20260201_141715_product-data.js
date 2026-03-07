
// SANTIS CLUB - PRODUCT CATALOG DATABASE
// 2025 Sothys & Home Collection

const productCatalog = [
    // FACE - YOUTH
    {
        id: 1,
        name: "Secrets de Sothys® Cream",
        cat: "face-youth",
        price: "Bilgi Al",
        img: "product-cream.png",
        badge: "PRESTIGE",
        desc: "Gençlik genlerini harekete geçiren lüks anti-aging bakım kremi. Sothys Gülü kök hücreleri ile formüle edilmiştir. Cildin biyolojik saatini yavaşlatır.",
        benefit: "Kırışıklık görünümünü azaltır ve cildi sıkılaştırır.",
        usage: "Sabah ve akşam temiz cilde uygulayın."
    },
    {
        id: 2,
        name: "Youth Serums Pack",
        cat: "face-youth",
        price: "Bilgi Al",
        img: "product-oil.png",
        badge: "SET",
        desc: "Kırışıklık ve sıkılaşma karşıtı 6 farklı aktif serum kiti. Cildin ihtiyacına göre kombine edilebilir. Kişiselleştirilmiş gençlik bakımı.",
        benefit: "Cildi yeniden yapılandırır ve toparlar.",
        usage: "Serumları karıştırarak veya tek başına uygulayın."
    },

    // FACE - HYDRA
    {
        id: 3,
        name: "Hydra3Ha™ Intensive Serum",
        cat: "face-hydra",
        price: "Bilgi Al",
        img: "product-cream.png",
        badge: "BEST SELLER",
        desc: "Cildin nem hafızasını canlandıran hyalüronik asit serumu. Anında dolgunluk etkisi sağlar ve nem bariyerini güçlendirir.",
        benefit: "Derinlemesine nemlendirme ve dolgunlaştırma.",
        usage: "Nemlendiriciden önce sabah/akşam uygulayın."
    },
    {
        id: 4,
        name: "Hydra3Ha™ Gel-Cream",
        cat: "face-hydra",
        price: "Bilgi Al",
        img: "product-cream.png",
        badge: "",
        desc: "Normal ve karma ciltler için ferahlatıcı nemlendirici. Hafif dokusuyla hızla emilir ve cildi yumuşatır.",
        benefit: "Hafif dokulu, uzun süreli nemlendirme.",
        usage: "Temiz cilde günde iki kez uygulayın."
    },

    // FACE - DETOX
    {
        id: 5,
        name: "Detox Energie™ Serum",
        cat: "face-detox",
        price: "Bilgi Al",
        img: "product-oil.png",
        badge: "NEW",
        desc: "Hücresel enerjiyi artıran ve kirliliğe karşı koruyan serum. Cildi canlandırır, ışıltı verir ve çevresel faktörlere karşı kalkan oluşturur.",
        benefit: "Cildi arındırır ve enerji verir.",
        usage: "Detox kremi öncesinde uygulayın."
    },

    // FACE - MEN
    {
        id: 6,
        name: "Sothys Homme Cleanser",
        cat: "face-men",
        price: "Bilgi Al",
        img: "product-soap.png",
        badge: "",
        desc: "Erkek cildi için 3'ü 1 arada temizleyici ve canlandırıcı. Yüz, vücut ve saç için uygundur. Enerji veren volkanik kaya özleri içerir.",
        benefit: "Tek adımda temizlik ve canlılık.",
        usage: "Her sabah duşta veya yüz yıkarken kullanın."
    },
    {
        id: 7,
        name: "Age-Defying Humectant",
        cat: "face-men",
        price: "Bilgi Al",
        img: "product-cream.png",
        badge: "",
        desc: "Erkekler için yaşlanma karşıtı nemlendirici fluid. Hafif yapısıyla yağlı his bırakmaz, cildi rahatlatır.",
        benefit: "Yaşlanma belirtilerini geciktirir.",
        usage: "Tıraş sonrası veya sabah/akşam uygulayın."
    },

    // BODY & SLIMMING
    {
        id: 8,
        name: "Slimming Activator",
        cat: "body-slim",
        price: "Bilgi Al",
        img: "product-cream.png",
        badge: "",
        desc: "Selülit görünümünü azaltmaya yardımcı vücut serumu. Düzenli kullanımda incelme etkisi sağlar ve cilt dokusunu düzeltir.",
        benefit: "Sıkılaşma ve portakal kabuğu görünümünde azalma.",
        usage: "Sorunlu bölgelere masaj yaparak uygulayın."
    },
    {
        id: 9,
        name: "Hammam Scrub",
        cat: "body-care",
        price: "Bilgi Al",
        img: "product-soap.png",
        badge: "",
        desc: "Geleneksel kese etkisi yaratan aromatik vücut peelingi. Ölü derileri nazikçe temizler ve cildi ipek gibi yapar.",
        benefit: "Pürüzsüz ve yenilenmiş bir cilt.",
        usage: "Haftada 1-2 kez duşta uygulayın."
    },

    // SUN CARE
    {
        id: 10,
        name: "Self-Tanning Gel",
        cat: "sun-care",
        price: "Bilgi Al",
        img: "product-cream.png",
        badge: "SUMMER",
        desc: "Güneşsiz, doğal ve eşit bronzluk sağlayan yüz/vücut jeli. İtalyan misafirlerin favorisi. Lekesiz ve doğal bir ton sağlar.",
        benefit: "Güneşe çıkmadan doğal bronzluk.",
        usage: "Eşit şekilde tüm vücuda yayın, elleri yıkayın."
    },
    {
        id: 11,
        name: "SPF30 Protective Oil",
        cat: "sun-care",
        price: "Bilgi Al",
        img: "product-oil.png",
        badge: "",
        desc: "Saç ve vücut için koruyucu, besleyici kuru yağ. Suya dayanıklı formül. Tiare çiçeği kokusuyla yazı hissettirir.",
        benefit: "UVA/UVB koruması ve saten bitiş.",
        usage: "Güneşe çıkmadan önce cilde ve saça uygulayın."
    },
    {
        id: 12,
        name: "After-Sun Milk",
        cat: "sun-care",
        price: "Bilgi Al",
        img: "product-cream.png",
        badge: "",
        desc: "Bronzluğu uzatan ve cildi yatıştıran bakım sütü. Güneş yanığı etkilerini hafifletir ve cildi besler.",
        benefit: "Yatıştırma ve bronzluğu koruma.",
        usage: "Güneş sonrası temiz cilde bolca uygulayın."
    },

    // ORGANICS
    {
        id: 13,
        name: "Organic Radiance Mask",
        cat: "organics",
        price: "Bilgi Al",
        img: "product-cream.png",
        badge: "ECO-CERT",
        desc: "Huş ağacı özlü organik ışıltı maskesi. Cildi derinlemesine nemlendirir ve canlandırır. %99 doğal içerik.",
        benefit: "Doğal ışıltı ve nem.",
        usage: "Haftada bir kez ince tabaka halinde uygulayın."
    },

    // SANTIS HOME
    {
        id: 14,
        name: "Santis Signature Robe",
        cat: "home-textile",
        price: "Bilgi Al",
        img: "hammam.png",
        badge: "LUXURY",
        desc: "%100 Pamuklu, özel dokuma premium spa bornozu. Otelimizdeki lüks deneyimi evinize taşıyın. Waffle dokusuyla hafiftir.",
        benefit: "Spa konforunu evinizde yaşayın.",
        usage: "Yıkama talimatına uygun temizleyin."
    },
    {
        id: 15,
        name: "Premium Havlu Seti",
        cat: "home-textile",
        price: "Bilgi Al",
        img: "santis_card_hammam_v1.png",
        badge: "",
        desc: "3'lü (El, Yüz, Banyo) ultra yumuşak havlu seti. Yüksek emiş gücü ve yumuşak doku. Santis Club nakışlı.",
        benefit: "Yumuşaklık ve yüksek emicilik.",
        usage: "İlk kullanımdan önce yıkayın."
    },
    {
        id: 16,
        name: "Relaxing Aroma Oil",
        cat: "home-aroma",
        price: "Bilgi Al",
        img: "product-oil.png",
        badge: "",
        desc: "Santis'in imza kokusu: Lavanta ve Sandal ağacı. Difüzör ve buhurdanlık kullanımı için uygundur. Zihni sakinleştirir.",
        benefit: "Ortamın havasını değiştirir, rahatlatır.",
        usage: "Difüzöre 3-4 damla damlatın."
    },
    {
        id: 17,
        name: "Hediye Kartı (Gift Card)",
        cat: "home-gift",
        price: "Limit Seç",
        img: "santis_card_products_v1.png",
        badge: "",
        desc: "Sevdiklerinize spa deneyimi hediye edin. Tuz Odası, Masaj veya Hamam ritüelleri için geçerlidir. 6 ay kullanım süresi.",
        benefit: "Unutulmaz bir deneyim hediye edin.",
        usage: "Resepsiyonda veya rezervasyonda kullanılır."
    }
];

function getCatName(cat) {
    const map = {
        'face-youth': 'Yüz / Gençlik', 'face-hydra': 'Yüz / Nem', 'face-detox': 'Yüz / Detox',
        'face-men': 'Erkek Bakımı', 'body-slim': 'Vücut / İncelme', 'body-care': 'Vücut Bakımı',
        'sun-care': 'Güneş Serisi', 'organics': 'Organik Seri', 'home-textile': 'Santis Home',
        'home-aroma': 'Aromaterapi', 'home-gift': 'Hediye'
    };
    return map[cat] || 'Koleksiyon';
}
