const fs = require('fs');
const path = require('path');

// Temizlenecek Kök Dizinler (Sadece tr ve en klasörlerini tarıyoruz, admin ve templates phantoms es geçiliyor)
const TARGET_DIRS = ['./tr', './en'];

function sovereignSweep(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            sovereignSweep(fullPath);
        } else if (fullPath.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // 🔪 1. DARBE: Çift Eğik Çizgileri ve Göreceli Yolları Mutlak Yola Çevir
            // Örnek: ..//assets/ -> /assets/ VEYA ../../../tr/ -> /tr/
            content = content.replace(/(?:\.\.\/)+(\/)?assets\//g, '/assets/');
            content = content.replace(/\.\.\/\//g, '/'); 
            content = content.replace(/(?:\.\.\/)+tr\//g, '/tr/');
            content = content.replace(/(?:\.\.\/)+en\//g, '/en/');

            // 🔪 2. DARBE: Melez Rotaları Düzelt (/tr/massages/ -> /tr/masajlar/)
            content = content.replace(/\/tr\/massages\//g, '/tr/masajlar/');
            content = content.replace(/\/tr\/services\//g, '/tr/hizmetler/');
            content = content.replace(/\/en\/masajlar\//g, '/en/massages/');
            content = content.replace(/\/en\/hizmetler\//g, '/en/services/');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`🩸 [CLEANSED] Kanamalar durduruldu: ${fullPath}`);
            }
        }
    });
}

console.log('🦅 [SOVEREIGN SWEEPER] V18 Apex Temizlik Motoru Başlatıldı...');
TARGET_DIRS.forEach(dir => sovereignSweep(dir));
console.log('✨ [MATRİKS KUSURSUZLAŞTIRILDI] Tespit edilen 404 parazitleri yok edildi.');
