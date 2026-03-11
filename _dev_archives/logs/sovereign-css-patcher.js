const fs = require('fs');
const path = require('path');

// ⚙️ Ayarlar
const CSS_DIR = path.join(__dirname, 'assets', 'css');
let filesModified = 0;
let warnings = [];

// Konsol Renkleri (The War Room Estetiği)
const colors = {
    red: '\x1b[31m', orange: '\x1b[33m', yellow: '\x1b[93m',
    green: '\x1b[32m', reset: '\x1b[0m', cyan: '\x1b[36m'
};

const log = (color, msg) => console.log(`${color}${msg}${colors.reset}`);

// 📂 Klasör Tarayıcı
function walkSync(dir, filelist = []) {
    if (!fs.existsSync(dir)) return filelist;
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            filelist = walkSync(filePath, filelist);
        } else if (filePath.endsWith('.css') || filePath.endsWith('.scss')) {
            filelist.push(filePath);
        }
    });
    return filelist;
}

// 🩺 Cerrahi Operasyon
function patchCSS(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;
    const fileName = path.basename(filePath);

    // 🔴 CRITICAL 1: Font-Display Swap Zırhı
    if (content.includes('@font-face') && !content.includes('font-display: swap')) {
        content = content.replace(/(@font-face\s*{[^}]+)(})/g, '$1    font-display: swap;\n$2');
        log(colors.green, `[AURA ONARILDI] ${fileName} -> font-display eklendi.`);
    }

    // 🔴 CRITICAL 2: Z-Index Katliamını Bitir (>1000 olanları ez)
    const zIndexRegex = /z-index:\s*([1-9][0-9]{3,}|999+)\s*(!important)?;/g;
    if (zIndexRegex.test(content)) {
        content = content.replace(zIndexRegex, 'z-index: var(--z-modal); /* AUTO-CAPPED BY OMNI-CORE */');
        log(colors.green, `[Z-INDEX TEMİZLENDİ] ${fileName} -> Absürt z-index değerleri mühürlendi.`);
    }

    // 🟠 MEDIUM: Ucuz Animasyon Gözlemcisi (Width, Height, All, Margin)
    const laggyAnimRegex = /transition:.*(width|height|margin|all).*;/g;
    let match;
    while ((match = laggyAnimRegex.exec(content)) !== null) {
        warnings.push(`${colors.orange}[CPU YORAN ANİMASYON] ${fileName} -> Bulunan: ${match[0].trim()} (Transform kullanın)`);
    }

    // 🟡 LOW: Magic Numbers (Hardcoded Px) Gözlemcisi
    const pxRegex = /(padding|margin|font-size):\s*\d{2,}px/g;
    const pxMatches = content.match(pxRegex);
    if (pxMatches && pxMatches.length > 5) { // 5'ten fazla varsa uyar
        warnings.push(`${colors.yellow}[FLUID DÜŞMANI] ${fileName} -> ${pxMatches.length} adet hardcoded 'px' değeri bulundu. Rem/Clamp'e geçilmeli.`);
    }

    // Değişiklik varsa dosyaya yaz
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        filesModified++;
    }
}

// 🚀 Operasyonu Başlat
log(colors.cyan, '\n🚀 SOVEREIGN CSS PATCHER BAŞLIATILIYOR...\n');
const cssFiles = walkSync(CSS_DIR);

cssFiles.forEach(file => patchCSS(file));

log(colors.cyan, '\n--- 📊 OMNI-CORE OPERASYON RAPORU ---');
log(colors.green, `✅ Onarılan Dosya Sayısı: ${filesModified}`);
if (warnings.length > 0) {
    log(colors.orange, `\n⚠️ DİKKAT GEREKTİREN MANUEL KONTROLLER (İLK 5):`);
    warnings.slice(0, 5).forEach(w => console.log(w));
    if (warnings.length > 5) log(colors.yellow, `...ve ${warnings.length - 5} uyarı daha.`);
}
log(colors.cyan, '-------------------------------------\n');
