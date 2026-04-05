const fs = require('fs');
const cheerio = require('cheerio');

const filePath = 'c:/Users/tourg/Desktop/SANTIS_SITE/cilt-bakimi.html';
let html = fs.readFileSync(filePath, 'utf8');

const mainMatch = html.match(/<main[\s\S]*?<\/main>/);
if (!mainMatch) throw new Error('No <main> block found');

const $ = cheerio.load(mainMatch[0], null, false);

const translations = {
    // Categories and Headers
    "SOTHYS PARİS İLE": "POWERED BY SOTHYS PARIS",
    "Bilimsel Güzellik, Doğal Zarafet": "Scientific Beauty, Natural Elegance",
    "RİTÜELLER": "RITUALS",
    "Öne Çıkan Bakımlar": "Signature Treatments",
    "Arındırma": "Purification",
    "Toksinlerden Kurtuluş": "Detoxification Release",
    "Nem & Işıltı": "Hydration & Radiance",
    "Derinlemesine Besleyici": "Deeply Nourishing",
    "Anti-Aging": "Anti-Aging",
    "Zamana Karşı Kalkan": "Shield Against Time",
    "Erkek Bakımı": "Men's Grooming",
    "Güçlü Maskülen Cilt": "Strong Masculine Skin",
    "Tüm Hizmetlerimiz": "All Our Services",

    // Labels & UI
    "Hemen Rezervasyon": "Book Now",

    // Specific Treatment Names (Turkish ones, the French/English ones remain)
    "Gold Mask Ritüeli": "Gold Mask Ritual",
    "24K Altın Işıltısı": "24K Gold Radiance",
    "Kore Güzellik Sırrı": "Korean Beauty Secret",
    "Anti-Aging Pro": "Anti-Aging Pro",
    "Zamanın Ötesinde": "Beyond Time",
    "Vitamin C Glow": "Vitamin C Glow",
    "Canlandırıcı Enerji": "Revitalizing Energy",
    "Hyaluron Nem": "Hyaluron Hydration",
    "Derinlemesine Terapi": "Deep Therapy",
    "Akne & Sebum Denge Bakımı": "Acne & Sebum Balance Care",
    "Derin Temizleme Bakımı": "Deep Cleansing Care",
    "Detox Kömür Maske": "Detox Charcoal Mask",
    "Enzim Peeling Bakımı": "Enzyme Peeling Care",
    "Anti-Aging Pro Bakım": "Anti-Aging Pro Care",
    "Bariyer Onarıcı Bakım": "Barrier Repair Care",
    "Leke Karşıtı Aydınlatıcı Bakım": "Anti-Blemish Brightening Care",
    "Klasik Cilt Bakımı": "Classic Skincare",
    "Kolajen Lifting Bakımı": "Collagen Lifting Care",
    "Göz Çevresi Bakımı": "Eye Contour Care",
    "Glass Skin Ritüeli": "Glass Skin Ritual",
    "Hyaluron Nem Terapisi": "Hyaluron Hydration Therapy",
    "Dudak Bakımı": "Lip Care",
    "Erkek Cilt Bakımı": "Men's Skincare",
    "Micro Polish Bakımı": "Micro Polish Care",
    "Oksijen Boost Bakımı": "Oxygen Boost Care",
    "Hassas Cilt Sakinleştirici Bakım": "Sensitive Skin Soothing Care",
};

// Function to generate missing translations generically
function getTranslation(trText) {
    if (translations[trText]) return translations[trText];
    if (trText.startsWith("Sothys Paris'in özel aktif içerikleriyle geliştirilmiş")) {
        let match = trText.match(/profesyonel (.*?) ritüeli/);
        let name = match ? match[1] : '';
        let enName = getTranslation(name) || name;
        return `A professional ${enName} ritual developed with Sothys Paris's exclusive active ingredients, revitalizing your skin.`;
    }
    // Prices like €60, etc., map to themselves
    if (/^€[0-9]+$/.test(trText)) return trText;
    
    return trText; // Fallback (returns original if not found)
}

// Ensure no V18 Kernel duplicates remain - the user asked us to purge legacy scripts
// Remove V18 bootloader comment and any subsequent specific legacy scripts that are dead.
// (cilt-bakimi.html has an empty comment block, let's just make sure we don't break valid scripts).

// Process Text Nodes
$('.santis-kicker, .santis-title, .santis-stack-card h3, .santis-stack-meta, .santis-stagger-item').each(function() {
    if (!$(this).attr('data-lang')) {
        let text = $(this).text().trim();
        if (text) {
            let trText = text;
            let enText = getTranslation(trText);
            
            // Set TR
            $(this).attr('data-lang', 'tr');
            
            // Create EN clone
            let clone = $(this).clone();
            clone.attr('data-lang', 'en');
            
            // Handle inline styles logic properly
            let existingStyle = clone.attr('style') || '';
            clone.attr('style', existingStyle + (existingStyle && !existingStyle.endsWith(';') ? ';' : '') + ' display:none;');
            
            // Handle children vs pure text
            if (clone.children().length > 0) {
                clone.contents().filter(function() { return this.nodeType === 3; }).each(function() {
                    let t = this.data.trim();
                    if(t) this.data = getTranslation(t) || t;
                });
            } else {
                clone.text(enText);
            }
            $(this).after(clone);
        }
    }
});

html = html.replace(mainMatch[0], $.html());
fs.writeFileSync(filePath, html);
console.log('Successfully injected TR-EN Sync to ' + filePath);
