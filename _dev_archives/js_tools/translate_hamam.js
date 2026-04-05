const fs = require('fs');
const cheerio = require('cheerio');

const filePath = 'c:/Users/tourg/Desktop/SANTIS_SITE/hamam.html';
let html = fs.readFileSync(filePath, 'utf8');

const mainMatch = html.match(/<main[\s\S]*?<\/main>/);
if (!mainMatch) throw new Error('No <main> block found');

const $ = cheerio.load(mainMatch[0], null, false);

const translations = {
    "Biyometrik Matrix": "Biometric Matrix",
    "Osmanlı'nın Arınma Sırları": "Ottoman Purification Secrets",
    "Altın Maske Hamam": "Gold Mask Hammam",
    "Klasik Osmanlı Ritüeli": "Classic Ottoman Ritual",
    "Gelin Hamamı": "Bridal Hammam",
    "Osmanlı Paşa": "Ottoman Pasha",
    "Kahve Detox": "Coffee Detox",
    "Çikolata Bakımı": "Chocolate Treatment",
    "Geleneksel Arınma": "Traditional Purification",
    "Sadece Köpük Masajı": "Foam Massage Only",
    "Kişiselleştirilmiş Bakımlar": "Personalized Treatments",
    "Hamam Koleksiyonu": "Hammam Collection",
    "Kese & Köpük": "Scrub & Foam",
    "Tuz Peeling Ritüeli": "Salt Peeling Ritual",
    "Derinlemesine Yenilenme": "Deep Renewal",
    "Yoğun Peeling": "Intense Peeling",
    "Kahve Detox Arınma": "Coffee Detox Purification",
    "Geleneksel Kese & Köpük": "Traditional Scrub & Foam",
    "Gül Yaprağı Terapisi": "Rose Petal Therapy",
    "Tatlı Yenilenme": "Sweet Renewal",
    "OSMANLI MİRASI": "OTTOMAN LEGACY",
    "Terapi Yağı": "Therapy Oil",
    "Süre": "Duration",
    "Hemen Rezervasyon": "Book Now",
    "Çikolata Bakımı & Hamam": "Chocolate Treatment & Hammam",
    "Saray Terapisi": "Palace Therapy",
    "Özel Seremoni": "Special Ceremony",
    "Premium Arınma Ritüelleri": "Premium Purification Rituals",
    "Geleneksel Hamam Seremonileri": "Traditional Hammam Ceremonies",
    // Titles and texts not in carousel meta but good to have
    "Geleneksel": "Traditional",
    "Hamam Ritüelleri": "Hammam Rituals"
};

// Function to generate missing translations generically
function getTranslation(trText) {
    if (translations[trText]) return translations[trText];
    if (trText.startsWith("Santis Signature terapisi ile geliştirilmiş")) {
        let match = trText.match(/profesyonel (.*?) ritüeli/);
        let name = match ? match[1] : '';
        let enName = getTranslation(name) || name;
        return `A professional ${enName} ritual enhanced with the Santis Signature therapy, purifying your body and refreshing your soul.`;
    }
    // Prices like €60, etc., map to themselves
    if (/^€[0-9]+$/.test(trText)) return trText;
    
    return trText; // Fallback (returns original if not found)
}

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
