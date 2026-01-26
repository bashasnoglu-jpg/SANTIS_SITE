/**

 * 🌐 Santis Club Ultra Test Runner (JSON çıktılı)

 * UTF-8 no BOM

 */

import fs from "fs";

import path from "path";

import { fileURLToPath } from "url";



const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);



(async function santisTest() {

  const results = [];

  let ok = 0, fail = 0, warn = 0;

  console.log("🚀 Santis Club testleri başlatılıyor...");



  try {

    // Yerel dosya sisteminden JSON okuma

    const jsonPath = path.join(__dirname, "santis-hotels.json");

    if (!fs.existsSync(jsonPath)) throw new Error("santis-hotels.json bulunamadı");

    

    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

    const langList = ["tr", "en", "de", "fr", "ru"];



    for (const h of data.hotels) {

      const hotelName = h.translations.tr.name;

      for (const lang of langList) {

        const hotelUrl = `hotel.html?hotel=${h.slug}&lang=${lang}`;

        check(hotelUrl, hotelName);



        for (const s of h.featuredServices || []) {

          check(`service.html?hotel=${h.slug}&service=${s.slug}&lang=${lang}`, hotelName);

        }



        check(`booking.html?hotel=${h.slug}&lang=${lang}`, hotelName);

      }

    }



    const report = {

      date: new Date().toISOString(),

      stats: { ok, fail, warn, total: ok + fail + warn },

      results

    };



    fs.writeFileSync(path.join(__dirname, "test-results.json"), JSON.stringify(report, null, 2), "utf8");

    console.log("✅ test-results.json kaydedildi.");



  } catch (err) {

    console.error("❌ Hata:", err.message);

  }



  function check(url, hotelName) {

    try {

      // URL'den dosya yolunu bul (query string temizle)

      const filePath = path.join(__dirname, url.split('?')[0]);

      

      if (fs.existsSync(filePath)) {

        ok++;

        results.push({ status: "ok", url, hotel: hotelName, code: 200 });

      } else {

        fail++;

        results.push({ status: "fail", url, hotel: hotelName, code: 404 });

      }

    } catch {

      warn++;

      results.push({ status: "warn", url, hotel: hotelName, code: "ERR" });

    }

  }

})();
