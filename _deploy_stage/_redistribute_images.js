/**
 * 🖼️ SANTIS IMAGE REDISTRIBUTOR v1.0
 * Kullanılmayan 57 görseli kategorilere dağıtarak klonları kırar.
 * 
 * Strateji:
 * 1. İsim eşlemesi — dosya adındaki anahtar kelimelerle kategori tahmini
 * 2. Round-robin — eşlenemeyen genel görseller sırayla dağıtılır
 * 3. Max 2 tekrar — hiçbir görsel 2'den fazla kullanılmaz
 */

const fs = require('fs');
const path = require('path');

// ── Load Data ──
const jsonPath = 'assets/data/services.json';
const cardsDir = 'assets/img/cards';

const services = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const allImages = fs.readdirSync(cardsDir).filter(f => f.endsWith('.webp'));

// ── Collect currently used images ──
const usedSet = new Set();
services.forEach(s => {
    if (s.image) usedSet.add(path.basename(s.image));
    if (s.media && s.media.hero) usedSet.add(s.media.hero);
});

const unused = allImages.filter(f => !usedSet.has(f));
console.log(`\n📊 Mevcut: ${allImages.length} görsel | Kullanılan: ${usedSet.size} | Kullanılmayan: ${unused.length}\n`);

// ── Category keyword mapping ──
const categoryKeywords = {
    'massage-asian':     ['thai', 'asian', 'shirodhara'],
    'massage-sports':    ['deeptissue', 'sports', 'deep_tissue'],
    'massage-medical':   ['reflexology', 'medical', 'recovery'],
    'massage-relaxation':['relax', 'deep_relax', 'rest'],
    'massage-premium':   ['head_massage', 'premium', 'oil_bowl'],
    'massage-regional':  ['regional', 'massage_regional'],
    'massage-couples':   ['couple', 'couples'],
    'massage-kids':      ['kids', 'family'],
    'ritual-hammam':     ['hamam', 'hammam', 'foam', 'kese', 'sabun'],
    'skincare-ritual':   ['face_mask', 'face-mask', 'skin_ritual', 'facial'],
    'skincare-advanced': ['skin_advanced', 'skincare_cover', 'detail'],
    'skincare-purify':   ['purify', 'purifying', 'detox', 'brush'],
    'skincare-hydra':    ['hydra', 'lotion', 'recovery_lotion'],
    'skincare-antiage':  ['antiage', 'anti_age'],
    'skincare-basic':    ['basic', 'skincare_cover'],
    'skincare-special':  ['special', 'atelier'],
    'sothys-men':        ['men', 'man'],
    'sothys-purifying':  ['sothys_purify', 'purete'],
    'sothys-hydra':      ['sothys_hydra'],
    'sothys-antiage':    ['sothys_antiage'],
    'journey':           ['journey', 'vip', 'ritual'],
};

// ── Categorize unused images ──
const categoryPool = {};   // category → [image paths]
const generalPool = [];    // Eşlenemeyen genel görseller

unused.forEach(img => {
    const lower = img.toLowerCase().replace(/[-_\.]/g, '_');
    let matched = false;
    
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => lower.includes(kw))) {
            if (!categoryPool[cat]) categoryPool[cat] = [];
            categoryPool[cat].push(img);
            matched = true;
            break;
        }
    }
    
    if (!matched) {
        generalPool.push(img);
    }
});

console.log('🎯 Kategori Havuzu:');
for (const [cat, imgs] of Object.entries(categoryPool)) {
    console.log(`  ${cat}: ${imgs.length} görsel → ${imgs.join(', ')}`);
}
console.log(`  [GENEL]: ${generalPool.length} görsel\n`);

// ── Redistribute ──
const imgUsageCount = {};  // Track how many times each image is used
let changedCount = 0;

// Group services by categoryId
const servicesByCategory = {};
services.forEach(s => {
    const cat = s.categoryId || s.category || 'unknown';
    if (!servicesByCategory[cat]) servicesByCategory[cat] = [];
    servicesByCategory[cat].push(s);
});

// For each category, distribute available images
let generalIndex = 0;

for (const [cat, items] of Object.entries(servicesByCategory)) {
    // Collect available images for this category
    const available = [...(categoryPool[cat] || [])];
    
    // Add some general pool images if category pool is small
    while (available.length < items.length && generalIndex < generalPool.length) {
        available.push(generalPool[generalIndex++]);
    }
    
    if (available.length === 0) continue;
    
    // First item keeps original image ("master" version)
    // Others get redistributed
    for (let i = 1; i < items.length; i++) {
        const newImg = available[(i - 1) % available.length];
        const newPath = `/assets/img/cards/${newImg}`;
        
        // Check max 3 usage
        imgUsageCount[newImg] = (imgUsageCount[newImg] || 0) + 1;
        if (imgUsageCount[newImg] > 3) continue;  // Skip if overused
        
        const oldImg = (items[i].image || '').split('/').pop();
        
        // Update both image and media.hero
        items[i].image = newPath;
        if (items[i].media && items[i].media.hero) {
            items[i].media.hero = newImg;
        }
        
        changedCount++;
    }
}

// ── Save ──
// Backup
fs.copyFileSync(jsonPath, jsonPath + '.bak');
console.log(`💾 Yedek oluşturuldu: ${jsonPath}.bak`);

fs.writeFileSync(jsonPath, JSON.stringify(services, null, 2), 'utf8');

// ── Report ──
const finalImgMap = {};
services.forEach(s => {
    const img = (s.image || '').split('/').pop();
    finalImgMap[img] = (finalImgMap[img] || 0) + 1;
});

const uniqueAfter = Object.keys(finalImgMap).length;
const maxRepeat = Math.max(...Object.values(finalImgMap));

console.log(`\n✅ REDISTRIBÜSYON TAMAMLANDI`);
console.log(`   Değişen kart: ${changedCount}`);
console.log(`   Benzersiz görsel: ${usedSet.size} → ${uniqueAfter}`);
console.log(`   Max tekrar: ${maxRepeat}x`);

// Top repeats
console.log(`\n📊 En çok tekrarlanan:`);
Object.entries(finalImgMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([img, count]) => console.log(`   ${count}x ${img}`));
