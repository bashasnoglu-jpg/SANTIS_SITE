// SOVEREIGN MENU MANIFEST v1.0
// Tek Hakikat Kaynağı (Single Source of Truth)

const RAW_SERVICES = [
  // ================= HAMAM =================
  {
    id: 'hamam-peeling-foam-30',
    slug: 'hamam-peeling-foam-30',
    category: 'hamam',
    name: { tr: 'Kese ve Köpük Masajı', en: 'Peeling and Foam Massage' },
    durationMinutes: 30,
    priceEUR: 45,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'hamam_peeling_foam_30'
  },
  {
    id: 'hamam-foam-30',
    slug: 'hamam-foam-30',
    category: 'hamam',
    name: { tr: 'Sadece Köpük Masajı', en: 'Foam Massage' },
    durationMinutes: 30,
    priceEUR: 45,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'hamam_foam_30'
  },
  {
    id: 'hamam-coffee-peeling-foam-30',
    slug: 'hamam-coffee-peeling-foam-30',
    category: 'hamam',
    name: { tr: 'Kahve Peeling ve Köpük', en: 'Coffee Peeling and Foam' },
    durationMinutes: 30,
    priceEUR: 50,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'hamam_coffee_peeling_foam_30'
  },
  {
    id: 'hamam-sea-salt-foam-30',
    slug: 'hamam-sea-salt-foam-30',
    category: 'hamam',
    name: { tr: 'Deniz Tuzu Peeling ve Köpük', en: 'Sea Salt Peeling and Foam' },
    durationMinutes: 30,
    priceEUR: 50,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'hamam_sea_salt_foam_30'
  },
  {
    id: 'hamam-honey-foam-30',
    slug: 'hamam-honey-foam-30',
    category: 'hamam',
    name: { tr: 'Bal ve Köpük Masajı', en: 'Honey and Foam Massage' },
    durationMinutes: 30,
    priceEUR: 55,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'hamam_honey_foam_30'
  },
  {
    id: 'hamam-chocolate-foam-30',
    slug: 'hamam-chocolate-foam-30',
    category: 'hamam',
    name: { tr: 'Çikolata ve Köpük Masajı', en: 'Chocolate and Foam Massage' },
    durationMinutes: 30,
    priceEUR: 55,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'hamam_chocolate_foam_30'
  },
  {
    id: 'hamam-algen-foam-30',
    slug: 'hamam-algen-foam-30',
    category: 'hamam',
    name: { tr: 'Yosun ve Köpük Masajı', en: 'Algen and Foam Massage' },
    durationMinutes: 30,
    priceEUR: 55,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'hamam_algen_foam_30'
  },
  {
    id: 'hamam-ottoman-tradition-50',
    slug: 'hamam-ottoman-tradition-50',
    category: 'hamam',
    name: { tr: 'Osmanlı Hamam Geleneği', en: 'Ottoman Hamam Tradition' },
    durationMinutes: 50,
    priceEUR: 90,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'hamam_ottoman_tradition_50'
  },

  // ================= MASAJ (KLASİK) =================
  {
    id: 'massage-classic-30',
    slug: 'massage-classic-30',
    category: 'massage_classic',
    name: { tr: 'Klasik Masaj (Lokal)', en: 'Classic Massage' },
    durationMinutes: 30,
    priceEUR: 50,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_classic_30'
  },
  {
    id: 'massage-feet-reflex-30',
    slug: 'massage-feet-reflex-30',
    category: 'massage_classic',
    name: { tr: 'Ayak Refleks Masajı', en: 'Feet Reflex Zone Massage' },
    durationMinutes: 30,
    priceEUR: 50,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_feet_reflex_30'
  },
  {
    id: 'massage-classic-50',
    slug: 'massage-classic-50',
    category: 'massage_classic',
    name: { tr: 'Tam Vücut Klasik Masaj', en: 'Classic Massage' },
    durationMinutes: 50,
    priceEUR: 80,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_classic_50'
  },
  {
    id: 'massage-anti-stress-50',
    slug: 'massage-anti-stress-50',
    category: 'massage_classic',
    name: { tr: 'Anti-Stres Masajı', en: 'Anti-Stress Massage' },
    durationMinutes: 50,
    priceEUR: 80,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_anti_stress_50'
  },
  {
    id: 'massage-aroma-50',
    slug: 'massage-aroma-50',
    category: 'massage_classic',
    name: { tr: 'Aromaterapi Masajı', en: 'Aroma Massage' },
    durationMinutes: 50,
    priceEUR: 80,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_aroma_50'
  },
  {
    id: 'massage-bronze-50',
    slug: 'massage-bronze-50',
    category: 'massage_classic',
    name: { tr: 'Bronzlaştırıcı Masaj', en: 'Bronze Massage' },
    durationMinutes: 50,
    priceEUR: 80,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_bronze_50'
  },
  {
    id: 'massage-sport-50',
    slug: 'massage-sport-50',
    category: 'massage_classic',
    name: { tr: 'Sporcu Masajı', en: 'Sport Massage' },
    durationMinutes: 50,
    priceEUR: 90,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_sport_50'
  },
  {
    id: 'massage-anti-cellulite-50',
    slug: 'massage-anti-cellulite-50',
    category: 'massage_classic',
    name: { tr: 'Anti-Selülit Masajı', en: 'Anti Cellulite Massage' },
    durationMinutes: 50,
    priceEUR: 90,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_anti_cellulite_50'
  },

  // ================= MASAJ (ASYA) =================
  {
    id: 'massage-thai-reflex-30',
    slug: 'massage-thai-reflex-30',
    category: 'massage_asian',
    name: { tr: 'Thai Refleksoloji', en: 'Thai Reflex Massage' },
    durationMinutes: 30,
    priceEUR: 55,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_thai_reflex_30'
  },
  {
    id: 'massage-indian-head-30',
    slug: 'massage-indian-head-30',
    category: 'massage_asian',
    name: { tr: 'Hint Baş Masajı', en: 'Indian Head Massage' },
    durationMinutes: 30,
    priceEUR: 55,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_indian_head_30'
  },
  {
    id: 'massage-bali-50',
    slug: 'massage-bali-50',
    category: 'massage_asian',
    name: { tr: 'Geleneksel Bali Masajı', en: 'Bali Massage' },
    durationMinutes: 50,
    priceEUR: 90,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_bali_50'
  },
  {
    id: 'massage-bali-aroma-50',
    slug: 'massage-bali-aroma-50',
    category: 'massage_asian',
    name: { tr: 'Bali Aroma Masajı', en: 'Bali Aroma Massage' },
    durationMinutes: 50,
    priceEUR: 90,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_bali_aroma_50'
  },
  {
    id: 'massage-thai-traditional-50',
    slug: 'massage-thai-traditional-50',
    category: 'massage_asian',
    name: { tr: 'Geleneksel Thai Masajı', en: 'Traditional Thai Massage' },
    durationMinutes: 50,
    priceEUR: 100,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_thai_traditional_50'
  },
  {
    id: 'massage-ayurveda-50',
    slug: 'massage-ayurveda-50',
    category: 'massage_asian',
    name: { tr: 'Ayurveda Masajı', en: 'Ayurveda Massage' },
    durationMinutes: 50,
    priceEUR: 90,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_ayurveda_50'
  },
  {
    id: 'massage-shiatsu-50',
    slug: 'massage-shiatsu-50',
    category: 'massage_asian',
    name: { tr: 'Shiatsu Masajı', en: 'Shiatsu Massage' },
    durationMinutes: 50,
    priceEUR: 100,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_shiatsu_50'
  },
  {
    id: 'massage-mandara-4hand-50',
    slug: 'massage-mandara-4hand-50',
    category: 'massage_asian',
    name: { tr: 'Mandara (4 El) Masajı', en: 'Mandara Massage (4 Hand)' },
    durationMinutes: 50,
    priceEUR: 150,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_mandara_4hand_50'
  },

  // ================= MASAJ (EXTRA) =================
  {
    id: 'massage-local-deep-tissue-30',
    slug: 'massage-local-deep-tissue-30',
    category: 'massage_extra',
    name: { tr: 'Lokal Derin Doku', en: 'Local Deep Tissue' },
    durationMinutes: 30,
    priceEUR: 55,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_local_deep_tissue_30'
  },
  {
    id: 'massage-hot-stone-50',
    slug: 'massage-hot-stone-50',
    category: 'massage_extra',
    name: { tr: 'Sıcak Taş Masajı', en: 'Hot Stone Massage' },
    durationMinutes: 50,
    priceEUR: 90,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_hot_stone_50'
  },
  {
    id: 'massage-deep-tissue-50',
    slug: 'massage-deep-tissue-50',
    category: 'massage_extra',
    name: { tr: 'Derin Doku Masajı', en: 'Deep Tissue Massage' },
    durationMinutes: 50,
    priceEUR: 90,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_deep_tissue_50'
  },
  {
    id: 'massage-lymphatic-50',
    slug: 'massage-lymphatic-50',
    category: 'massage_extra',
    name: { tr: 'Lenf Drenaj Masajı', en: 'Lymphatic Drainage Massage' },
    durationMinutes: 50,
    priceEUR: 90,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_lymphatic_50'
  },
  {
    id: 'massage-combination-50',
    slug: 'massage-combination-50',
    category: 'massage_extra',
    name: { tr: 'Kombine Masaj (50 Dk)', en: 'Combination Massage' },
    durationMinutes: 50,
    priceEUR: 100,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_combination_50'
  },
  {
    id: 'massage-combination-90',
    slug: 'massage-combination-90',
    category: 'massage_extra',
    name: { tr: 'Kombine Masaj (90 Dk)', en: 'Combination Massage' },
    durationMinutes: 90,
    priceEUR: 130,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_combination_90'
  },
  {
    id: 'massage-mix-manuel-90',
    slug: 'massage-mix-manuel-90',
    category: 'massage_extra',
    name: { tr: 'Mix Manuel Terapi', en: 'Mix Manuel Therapy' },
    durationMinutes: 90,
    priceEUR: 180,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'massage_mix_manuel_90'
  },

  // ================= CİLT BAKIMI (FACE CARE) =================
  {
    id: 'face-classic-50',
    slug: 'face-classic-50',
    category: 'face_care',
    name: { tr: 'Klasik Cilt Bakımı', en: 'Classic Skin Care' },
    durationMinutes: 50,
    priceEUR: 85,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'face_classic_50'
  },
  {
    id: 'face-anti-aging-50',
    slug: 'face-anti-aging-50',
    category: 'face_care',
    name: { tr: 'Anti-Aging Cilt Bakımı', en: 'Anti-Aging Skin Care' },
    durationMinutes: 50,
    priceEUR: 100,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'face_anti_aging_50'
  },
  {
    id: 'face-acne-treatment-50',
    slug: 'face-acne-treatment-50',
    category: 'face_care',
    name: { tr: 'Akne Tedavisi & Bakım', en: 'Acne Treatment & Skin Care' },
    durationMinutes: 50,
    priceEUR: 100,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'face_acne_treatment_50'
  },
  {
    id: 'face-collagen-mask-30',
    slug: 'face-collagen-mask-30',
    category: 'face_care',
    name: { tr: 'Kolajen Maskesi', en: 'Collagen Mask' },
    durationMinutes: 30,
    priceEUR: 60,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'face_collagen_mask_30'
  },
  {
    id: 'face-algen-mask-30',
    slug: 'face-algen-mask-30',
    category: 'face_care',
    name: { tr: 'Yosun Maskesi', en: 'Algen Mask' },
    durationMinutes: 30,
    priceEUR: 60,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'face_algen_mask_30'
  },
  {
    id: 'face-gold-mask-30',
    slug: 'face-gold-mask-30',
    category: 'face_care',
    name: { tr: 'Altın Maske', en: 'Gold Mask' },
    durationMinutes: 30,
    priceEUR: 65,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'face_gold_mask_30'
  },
  {
    id: 'face-scalp-massage-30',
    slug: 'face-scalp-massage-30',
    category: 'face_care',
    name: { tr: 'Yüz & Kafa Derisi Masajı', en: 'Face & Scalp Massage' },
    durationMinutes: 30,
    priceEUR: 50,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'face_scalp_massage_30'
  },
  {
    id: 'face-mens-skincare-50',
    slug: 'face-mens-skincare-50',
    category: 'face_care',
    name: { tr: 'Erkek Cilt Bakımı', en: "Men's Skincare" },
    durationMinutes: 50,
    priceEUR: 80,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'face_mens_skincare_50'
  },

  // ================= SPA RİTÜELLERİ (PROGRAMS) =================
  {
    id: 'ritual-child-care-75',
    slug: 'ritual-child-care-75',
    category: 'spa_programs',
    name: { tr: 'Çocuk Bakım Programı', en: 'Child Care Program' },
    durationMinutes: 75,
    priceEUR: 80,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'ritual_child_care_75'
  },
  {
    id: 'ritual-relax-95',
    slug: 'ritual-relax-95',
    category: 'spa_programs',
    name: { tr: 'Relax Programı', en: 'Relax Program' },
    durationMinutes: 95,
    priceEUR: 100,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'ritual_relax_95'
  },
  {
    id: 'ritual-medical-95',
    slug: 'ritual-medical-95',
    category: 'spa_programs',
    name: { tr: 'Medikal Program', en: 'Medical Program' },
    durationMinutes: 95,
    priceEUR: 115,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'ritual_medical_95'
  },
  {
    id: 'ritual-bronze-95',
    slug: 'ritual-bronze-95',
    category: 'spa_programs',
    name: { tr: 'Bronz Program', en: 'Bronze Program' },
    durationMinutes: 95,
    priceEUR: 105,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'ritual_bronze_95'
  },
  {
    id: 'ritual-delux-115',
    slug: 'ritual-delux-115',
    category: 'spa_programs',
    name: { tr: 'Delux Program', en: 'Delux Program' },
    durationMinutes: 115,
    priceEUR: 175,
    bookingEnabled: true,
    active: true,
    telemetryLabel: 'ritual_delux_115'
  }
];

export const SOVEREIGN_MENU = RAW_SERVICES;

export const MENU_BY_ID = new Map(
  RAW_SERVICES.map(service => [service.id, service])
);

export function getServiceById(id) {
  return MENU_BY_ID.get(id);
}

export function getServicesByCategory(category) {
  return RAW_SERVICES.filter(service => service.category === category);
}
