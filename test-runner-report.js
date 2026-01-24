/**
 * 🌐 Santis Club Ultra Test Runner (JSON Çıktılı)
 * UTF-8 no BOM
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM uyumlu __dirname alternatifi
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async function santisFullReport() {
  console.log("🚀 Santis Club Test Runner (JSON Output) başlatılıyor...");

  const requiredLangs = ["tr", "en", "de", "fr", "ru"];
  const results = [];
  let ok = 0, fail = 0, warn = 0;

  try {
    const jsonPath = path.join(__dirname, 'santis-hotels.json');
    if (!fs.existsSync(jsonPath)) {
        throw new Error(`Kritik Hata: 'santis-hotels.json' dosyası bulunamadı. Dosya yolu: ${jsonPath}`);
    }
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(jsonContent);
    const hotels = data.hotels;

    for (const hotel of hotels) {
      const hName = hotel.translations.tr.name;
      for (const lang of requiredLangs) {
        const hotelURL = `hotel.html?hotel=${hotel.slug}&lang=${lang}`;
        await testURL(hotelURL, "Hotel", hName, lang);

        const bookingURL = `booking.html?hotel=${hotel.slug}&lang=${lang}`;
        await testURL(bookingURL, "Booking", hName, lang);

        for (const srv of hotel.featuredServices || []) {
          const sURL = `service.html?hotel=${hotel.slug}&service=${srv.slug}&lang=${lang}`;
          await testURL(sURL, "Service", hName, lang);
        }
      }
    }

    const report = {
      date: new Date().toISOString(),
      stats: { ok, fail, warn, total: ok + fail + warn },
      results
    };

    fs.writeFileSync(path.join(__dirname, "test-results.json"), JSON.stringify(report, null, 2), "utf8");
    console.log(`✅ Test tamamlandı. ${report.stats.total} işlem.`);
    console.log(`📂 Rapor kaydedildi: test-results.json`);

  } catch (err) {
    console.error("❌ Hata:", err.message);
  }

  async function testURL(url, type, hotel, lang) {
    const filePath = path.join(__dirname, url.split('?')[0]);
    try {
      if (fs.existsSync(filePath)) {
        ok++;
        results.push({ status: "ok", url, hotel, lang, type, code: 200 });
        // console.log(`✅ [${type}] ${url}`); // Konsol kirliliğini azaltmak için kapalı
      } else {
        fail++;
        results.push({ status: "fail", url, hotel, lang, type, code: 404 });
        console.log(`❌ [${type}] 404 ${url}`);
      }
    } catch (e) {
      warn++;
      results.push({ status: "warn", url, hotel, lang, type, code: "ERR" });
      console.log(`⚠️ [${type}] Erişim hatası ${url}`);
    }
  }
})();
