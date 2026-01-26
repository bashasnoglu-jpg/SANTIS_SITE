import os

db_path = r"c:\Users\tourg\Desktop\SANTIS_SITE\assets\js\db.js"

new_products = """
  // --- 2. SOTHYS PARIS SKINCARE COLLECTION (2026 UPDATE) ---
  {
    id: 'SOTHYS-HYDRA-INTENSIVE-SERUM',
    brand: 'Sothys',
    cat: 'skincare',
    subcat: 'Hydra Hyaluronic Acid4',
    name: {
      tr: 'Hydrating Intensive Serum',
      en: 'Hydrating Intensive Serum',
      de: 'Hydrating Intensive Serum',
      fr: 'Sérum intensif hydratant',
      ru: 'Hydrating Intensive Serum'
    },
    price: 95,
    img: 'images/sothys/hydra-serum.jpg',
    desc: {
      tr: 'Hafif dokuda yoğun nem desteği. Cildin su tutma kapasitesini artırır.',
      en: 'Lightweight intensive hydration. Boosts skin water retention.'
    },
    labels: { tr: { subtitle: "Hafif dokuda yoğun nem desteği" } },
    slug: 'hydrating-intensive-serum'
  },
  {
    id: 'SOTHYS-HYDRA-YOUTH-CREAM',
    brand: 'Sothys',
    cat: 'skincare',
    subcat: 'Hydra Hyaluronic Acid4',
    name: {
      tr: 'Hydra Crème jeunesse',
      en: 'Hydra Youth Cream',
      de: 'Hydra Crème jeunesse',
      fr: 'Crème jeunesse hydratation',
      ru: 'Hydra Youth Cream'
    },
    price: 85,
    img: 'images/sothys/hydra-cream.jpg',
    desc: {
      tr: 'Günlük nem ve dolgun görünüm sağlayan gençlik kremi.',
      en: 'Daily hydration and plumping youth cream.'
    },
    labels: { tr: { subtitle: "Günlük nem + dolgun görünüm" } },
    slug: 'hydra-creme-jeunesse'
  },
  {
    id: 'SOTHYS-SENSITIVE-NUTRISOOTHING-MASK',
    brand: 'Sothys',
    cat: 'skincare',
    subcat: 'Sensitive',
    name: {
      tr: 'Nutri-Soothing Mask',
      en: 'Nutri-Soothing Mask',
      de: 'Nutri-Soothing Maske',
      fr: 'Masque nutri-apaisant',
      ru: 'Nutri-Soothing Mask'
    },
    price: 65,
    img: 'images/sothys/sensitive-mask.jpg',
    desc: {
      tr: 'Hassas ciltte konfor ve denge sağlayan besleyici maske.',
      en: 'Nutritious mask providing comfort and balance for sensitive skin.'
    },
    labels: { tr: { subtitle: "Hassas ciltte konfor ve denge" } },
    slug: 'nutri-soothing-mask'
  },
  {
    id: 'SOTHYS-SENSITIVE-SOOTHING-VELVET-CREAM',
    brand: 'Sothys',
    cat: 'skincare',
    subcat: 'Sensitive',
    name: {
      tr: 'Soothing Velvet Cream',
      en: 'Soothing Velvet Cream',
      de: 'Beruhigende Samtcreme',
      fr: 'Crème velours apaisante',
      ru: 'Soothing Velvet Cream'
    },
    price: 75,
    img: 'images/sothys/sensitive-cream.jpg',
    desc: {
      tr: 'Hassas cilt için günlük koruma sağlayan kadifemsi krem.',
      en: 'Velvety cream providing daily protection for sensitive skin.'
    },
    labels: { tr: { subtitle: "Hassas cilt için günlük koruma" } },
    slug: 'soothing-velvet-cream'
  },
  {
    id: 'SOTHYS-FOCUS-TACHES-SERUM',
    brand: 'Sothys',
    cat: 'skincare',
    subcat: 'Focus Taches',
    name: {
      tr: 'Sérum Focus Taches',
      en: 'Focus Taches Serum',
      de: 'Focus Taches Serum',
      fr: 'Sérum Focus Taches',
      ru: 'Focus Taches Serum'
    },
    price: 110,
    img: 'images/sothys/focus-serum.jpg',
    desc: {
      tr: 'Leke görünümünü hedefleyen yoğun bakım serumu.',
      en: 'Intensive serum targeting the appearance of dark spots.'
    },
    labels: { tr: { subtitle: "Leke görünümünü hedefleyen bakım" } },
    slug: 'serum-focus-taches'
  },
  {
    id: 'SOTHYS-FOCUS-TACHES-CREAM',
    brand: 'Sothys',
    cat: 'skincare',
    subcat: 'Focus Taches',
    name: {
      tr: 'Crème Focus Taches',
      en: 'Focus Taches Cream',
      de: 'Focus Taches Creme',
      fr: 'Crème Focus Taches',
      ru: 'Focus Taches Cream'
    },
    price: 95,
    img: 'images/sothys/focus-cream.jpg',
    desc: {
      tr: 'Günlük kullanım için leke karşıtı ve ışıltı verici krem.',
      en: 'Daily anti-spot and radiance cream.'
    },
    labels: { tr: { subtitle: "Günlük kullanım: leke + ışıltı" } },
    slug: 'creme-focus-taches'
  },
  {
    id: 'SOTHYS-DETOX-SERUM',
    brand: 'Sothys',
    cat: 'skincare',
    subcat: 'Detox Energie',
    name: {
      tr: 'Sérum énergisant intégral',
      en: 'Integral Energizing Serum',
      de: 'Energizing Serum',
      fr: 'Sérum énergisant intégral',
      ru: 'Energizing Serum'
    },
    price: 105,
    img: 'images/sothys/detox-serum.jpg',
    desc: {
      tr: 'Detoks etkili, enerji veren hafif yapılı serum.',
      en: 'Detoxifying, energizing lightweight serum.'
    },
    labels: { tr: { subtitle: "Detoks & enerji hissi, hafif doku" } },
    slug: 'serum-energisant-integral'
  },
  {
    id: 'SOTHYS-PRESTIGE-LA-CREME-128',
    brand: 'Sothys',
    cat: 'skincare',
    subcat: 'Secrets de Sothys',
    name: {
      tr: 'La Crème 128',
      en: 'La Crème 128',
      de: 'La Crème 128',
      fr: 'La Crème 128',
      ru: 'La Crème 128'
    },
    price: 550,
    img: 'images/sothys/la-creme-128.jpg',
    desc: {
      tr: 'Sothys’in en prestijli ikonik gençlik kremi. Porselen kavanozda sunulur.',
      en: 'Sothys\' most prestigious iconic youth cream. Presented in a porcelain jar.'
    },
    labels: { tr: { subtitle: "Prestige youth krem (ikon ürün)" } },
    slug: 'la-creme-128'
  },
  {
    id: 'SOTHYS-HOMME-MULTI-OIL',
    brand: 'Sothys',
    cat: 'skincare',
    subcat: 'Homme',
    name: {
      tr: 'Sothys Homme – Multi-Oil',
      en: 'Sothys Homme – Multi-Oil',
      de: 'Sothys Homme – Multi-Öl',
      fr: 'Huile multi-usages',
      ru: 'Homme Multi-Oil'
    },
    price: 55,
    img: 'images/sothys/homme-oil.jpg',
    desc: {
      tr: 'Tıraş, sakal, yüz ve vücut için çok amaçlı bakım yağı.',
      en: 'Multi-purpose care oil for shave, beard, face, and body.'
    },
    labels: { tr: { subtitle: "Tıraş + sakal + yüz/beden çok amaçlı" } },
    slug: 'sothys-homme-multi-oil'
  }
"""

with open(db_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the last occurrence of ];
index = content.rfind('];')

if index != -1:
    # Insert new products before ];
    # Add a comma if strictly JSON array, but this is JS array so comma is usually fine or needed
    updated_content = content[:index] + "," + new_products + "\n];"
    
    with open(db_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    print("Sothys products appended successfully!")
else:
    print("Error: Could not find closing bracket ];")
