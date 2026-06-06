const fs = require('fs');
const path = require('path');

console.log("🛡️ [SOVEREIGN GUARD] Anti-Gravity Automator Silahı Ateşlendi...\n");

const IGNORE = ['node_modules', '.git', 'dist', 'build', '.next', '.pnpm-store', 'drizzle'];

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (!IGNORE.includes(f)) walk(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

let cssFixed = 0;
let jsFixed = 0;

walk('./', function(filePath) {
  const ext = path.extname(filePath);
  if (!['.css', '.js', '.ts', '.jsx', '.tsx', '.html'].includes(ext)) return;

  let originalContent = fs.readFileSync(filePath, 'utf8');
  let content = originalContent;

  // 1. Zero-Friction CSS (transition: all -> transform, opacity)
  if (ext === '.css') {
    const cssRegex = /transition:\s*all\s+([^;]+);/g;
    if (cssRegex.test(content)) {
      content = content.replace(cssRegex, 'transition: transform $1, opacity $1;\n  will-change: transform, opacity;');
      cssFixed++;
    }
  }

  // 2. JS/TS/HTML: Dinamik Para Birimi Interpolasyonu
  if (['.js', '.ts', '.jsx', '.tsx', '.html'].includes(ext)) {
    // `${degisken} ₺` yapısını `${formatSovereignPrice(degisken)}` formuna çevir
    const tlRegex = /\$\{([^}]+)\}\s*₺/g;
    if (tlRegex.test(content)) {
      content = content.replace(tlRegex, '${formatSovereignPrice($1)}');
    }
    
    // Geriye kalan statik "₺" sembollerini evrensel "€" ile değiştir
    if (content.includes('₺')) {
      content = content.replace(/₺/g, '€');
    }
    if (content !== originalContent) {
      jsFixed++;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Arındırıldı: ${filePath}`);
  }
});

console.log(`\n🎉 Operasyon Tamamlandı.`);
console.log(`- Optimize Edilen CSS Dosyası (120FPS): ${cssFixed}`);
console.log(`- İzole Edilen JS/TS/HTML Dosyası: ${jsFixed}\n`);
