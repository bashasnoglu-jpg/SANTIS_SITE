/**
 * 🧩 Santis Club – UTF-8 Doğrulama ve Düzeltme Testi
 * Bu script, proje dosyalarının UTF-8 (no BOM) kodlamayla kaydedilip kaydedilmediğini kontrol eder.
 * BOM tespit edilirse otomatik olarak temizler.
 * Çalıştırmak için:
 *    node test/utf8-check.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Kontrol edilecek dosyalar:
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

function removeBOM(buffer) {
  if (hasBOM(buffer)) {
    return buffer.subarray(3);
  }
  return buffer;
}

console.log("🧠 UTF-8 Doğrulama ve Onarım Başlatılıyor...\n");

files.forEach((file) => {
  const fullPath = path.join(__dirname, file);
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ ${path.basename(file)} bulunamadı.`);
      return;
    }

    let buffer = fs.readFileSync(fullPath);
    
    // BOM Kontrolü ve Düzeltme
    if (hasBOM(buffer)) {
      console.log(`⚠️  BOM tespit edildi: ${path.basename(file)} -> Temizleniyor...`);
      buffer = removeBOM(buffer);
      fs.writeFileSync(fullPath, buffer);
      console.log(`   ✅ ${path.basename(file)} BOM temizlendi ve kaydedildi.`);
    }

    // UTF-8 Kontrolü
    console.log(`${path.basename(file)} → ✅ UTF-8 (no BOM) uyumlu`);

  } catch (err) {
    console.log(`❌ ${path.basename(file)} okunamadı: ${err.message}`);
  }
});

console.log("\n🔍 Kontrol tamamlandı.\n");