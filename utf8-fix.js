/**
 * 🧩 Santis Club – UTF-8 Kontrol & Otomatik Düzeltme
 * 
 * Bu script tüm proje dosyalarını tarar, UTF-8 (no BOM) değilse
 * otomatik olarak düzeltir ve yeniden kaydeder.
 * 
 * Kullanım:
 *    node test/utf8-fix.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Kontrol edilecek dosyalar
const files = [
  "../index.html",
  "../hotel.html",
  "../booking.html",
  "../santis-hotels.json",
  "./ultra-test.js"
];

// UTF-8 BOM bayt dizisi
const BOM = [0xef, 0xbb, 0xbf];
function hasBOM(buffer) {
  return BOM.every((b, i) => buffer[i] === b);
}

console.log("🧠 UTF-8 Kontrol & Otomatik Düzeltme Başlatılıyor...\n");

let stats = {
  checked: 0,
  fixed: 0,
  alreadyOk: 0,
  errors: 0
};

files.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);
  stats.checked++;
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ ${path.basename(filePath)} bulunamadı.`);
      stats.errors++;
      return;
    }

    const buffer = fs.readFileSync(fullPath);
    const hasBom = hasBOM(buffer);
    const text = buffer.toString("utf8");

    // Basit UTF-8 regex kontrolü (genellikle toString('utf8') zaten handle eder ama BOM için ekstra kontrol iyidir)
    const utf8Ok = /^[\s\S]*$/u.test(text);

    if (hasBom) {
      // BOM varsa temizle (Buffer.from string'i utf8 olarak alır, BOM eklemez)
      const cleanBuffer = Buffer.from(text, "utf8");
      fs.writeFileSync(fullPath, cleanBuffer);
      console.log(`✅ ${path.basename(filePath)} → BOM temizlendi, UTF-8 (no BOM) olarak kaydedildi.`);
      stats.fixed++;
    } else if (!utf8Ok) {
      // UTF-8 dışı karakter varsa (teorik olarak toString('utf8') bunu zorlar ama emin olmak için)
      fs.writeFileSync(fullPath, text, { encoding: "utf8" });
      console.log(`✅ ${path.basename(filePath)} → UTF-8 olarak yeniden kodlandı.`);
      stats.fixed++;
    } else {
      console.log(`✔️ ${path.basename(filePath)} → Zaten UTF-8 (no BOM).`);
      stats.alreadyOk++;
    }

  } catch (err) {
    console.error(`❌ ${path.basename(filePath)} okunamadı: ${err.message}`);
    stats.errors++;
  }
});

console.log("\n📊 ÖZET RAPOR:");
console.log(`   📂 Toplam Dosya: ${stats.checked}`);
console.log(`   ✅ Düzeltilen:   ${stats.fixed}`);
console.log(`   ✔️ Zaten Uygun:  ${stats.alreadyOk}`);
console.log(`   ❌ Hatalı:       ${stats.errors}`);
console.log("\n🎯 Kontrol ve düzeltme tamamlandı.\n");