const fs = require('fs');
const cheerio = require('cheerio');

const filePath = 'c:/Users/tourg/Desktop/SANTIS_SITE/masaj.html';
let html = fs.readFileSync(filePath, 'utf8');

// Safely extract only the <main> and <section> content that needs modifying
// We don't want to parse <head> or <body> tags
const mainMatch = html.match(/<main[\s\S]*?<\/main>/);
if (!mainMatch) throw new Error('No <main> block found');

// Load fragment
const $ = cheerio.load(mainMatch[0], null, false);

const translations = {
    "RİTÜELLER": "RITUALS",
    "Öne Çıkan Masajlar": "Featured Massages",
    "Deep Tissue": "Deep Tissue",
    "Derin Rahatlama": "Deep Relaxation",
    "Santis Signature terapisi ile geliştirilmiş, bedeninizi arındıran ve ruhunuzu tazeleyen profesyonel Deep Tissue ritüeli.": "A professional Deep Tissue ritual enhanced with the Santis Signature therapy, purifying your body and refreshing your soul.",
    "Hemen Rezervasyon": "Book Now",
    "Thai Masajı": "Thai Massage",
    "Esneklik ve Enerji": "Flexibility & Energy",
    "Santis Signature terapisi ile geliştirilmiş, bedeninizi arındıran ve ruhunuzu tazeleyen profesyonel Thai Masajı ritüeli.": "A professional Thai Massage ritual enhanced with the Santis Signature therapy, purifying your body and refreshing your soul.",
    "Sıcak Taş": "Hot Stone",
    "Volkanik Terapi": "Volcanic Therapy",
    "Santis Signature terapisi ile geliştirilmiş, bedeninizi arındıran ve ruhunuzu tazeleyen profesyonel Sıcak Taş ritüeli.": "A professional Hot Stone ritual enhanced with the Santis Signature therapy, purifying your body and refreshing your soul.",
    "Aromaterapi": "Aromatherapy",
    "Ruhsal Dinlenme": "Spiritual Rest",
    "Santis Signature terapisi ile geliştirilmiş, bedeninizi arındıran ve ruhunuzu tazeleyen profesyonel Aromaterapi ritüeli.": "A professional Aromatherapy ritual enhanced with the Santis Signature therapy, purifying your body and refreshing your soul.",
    "Bali Masajı": "Balinese Massage",
    "Geleneksel Dokunuş": "Traditional Touch",
    "Santis Signature terapisi ile geliştirilmiş, bedeninizi arındıran ve ruhunuzu tazeleyen profesyonel Bali Masajı ritüeli.": "A professional Balinese Massage ritual enhanced with the Santis Signature therapy, purifying your body and refreshing your soul.",
    
    // Klasik Masajlar
    "Klasik Masajlar": "Classic Massages",
    "Kusursuz Başlangıçlar": "Flawless Beginnings",
    "İsveç Masajı": "Swedish Massage",
    "Aromaterapi Masajı": "Aromatherapy Massage",
    "Anti-Stres Masajı": "Anti-Stress Massage",
    "Lenf Drenaj Masajı": "Lymphatic Drainage Massage",
    "Sırt ve Boyun Terapi": "Back & Neck Therapy",
    "Klasik Vücut Masajı": "Classic Body Massage",
    
    // Prices
    "€60": "€60", "€70": "€70", "€75": "€75", "€80": "€80", "€85": "€85", "€95": "€95", "€105": "€105", "€110": "€110", "€115": "€115", "€120": "€120", "€125": "€125", "€130": "€130", "€135": "€135", "€140": "€140", "€145": "€145", "€150": "€150", "€160": "€160",
    
    "Spor ve Terapi": "Sports & Therapy",
    "Derinlemesine İyileşme": "Deep Healing",
    "Derin Doku Masajı": "Deep Tissue Massage",
    "Spor Terapi Masajı": "Sports Therapy Massage",
    "Tetik Nokta Terapisi": "Trigger Point Therapy",
    "Sıcak Taş Terapisi": "Hot Stone Therapy",
    "Medikal Masaj": "Medical Massage",
    "Myofascial Release": "Myofascial Release",
    
    "Asya Masajları": "Asian Massages",
    "Egzotik ve Geleneksel Ritm": "Exotic & Traditional Rhythm",
    "Geleneksel Bali Masajı": "Traditional Balinese Massage",
    "Kraliyet Thai Masajı": "Royal Thai Massage",
    "Shiatsu Terapi": "Shiatsu Therapy",
    "Ayak Refleksolojisi": "Foot Reflexology",
    "Abhyanga (Ayurvedik)": "Abhyanga (Ayurvedic)",
    "Thai Herbal Compress": "Thai Herbal Compress",
    
    "Bölgesel Masajlar": "Targeted Massages",
    "Odaklanmış Rahatlama": "Focused Relaxation",
    "Sırt ve Boyun Masajı": "Back and Neck Massage",
    "Hint Baş Masajı": "Indian Head Massage",
    "Omuz ve Kollar": "Shoulders & Arms",
    "Lokal Bacak Masajı": "Local Leg Massage",
    "Yüz ve Dekolte": "Face & Décolleté",
};

// Function to generate missing translations generically
function getTranslation(trText) {
    if (translations[trText]) return translations[trText];
    if (trText.startsWith('Santis Signature terapisi')) {
        let match = trText.match(/profesyonel (.*?) ritüeli/);
        let name = match ? match[1] : '';
        let enName = getTranslation(name) || name;
        return `A professional ${enName} ritual enhanced with the Santis Signature therapy, purifying your body and refreshing your soul.`;
    }
    return trText; // Fallback
}

function processNode(elem) {
    let $el = $(elem);
    let originalHtml = $el.html();
    let text = $el.text().trim();
    if (!text) return;
    if ($el.attr('data-lang')) return; // Already processed
    if ($el.children().length > 0 && !$el.is('a') && !$el.is('span') && !$el.is('p')) return; // Target leaves
    
    let enText = getTranslation(text);
    $el.attr('data-lang', 'tr');
    
    let clone = $el.clone();
    clone.attr('data-lang', 'en');
    clone.css('display', 'none');
    
    if (clone.children().length > 0) {
        // If it contains things like an <i>, we shouldn't wipe it out entirely. 
        // For these simple tags, we just replace text nodes.
        clone.contents().filter(function() {
            return this.nodeType === 3; // Text node
        }).each(function() {
            this.data = getTranslation(this.data.trim()) || this.data;
        });
    } else {
        clone.text(enText);
    }
    
    $el.after(clone);
}

// Select specific elements that hold translatable text
$('.santis-kicker, .santis-title, .santis-stack-card h3, .santis-stack-meta, .santis-stagger-item').each(function() {
    // Only target those without data-lang currently, to be safe.
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
            
            // Handle inline styles logic properly: keep existing, add display:none
            let existingStyle = clone.attr('style') || '';
            clone.attr('style', existingStyle + (existingStyle && !existingStyle.endsWith(';') ? ';' : '') + ' display:none;');
            
            // Special handling if it contains children (like buttons with icons)
            if (clone.children().length > 0) {
               // Usually for the buttons, the text is a direct child
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

// Put the modified fragment back into the outer HTML
html = html.replace(mainMatch[0], $.html());

fs.writeFileSync(filePath, html);
console.log('Successfully injected TR-EN Sync to ' + filePath);
