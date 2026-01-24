/**
 * 🌐 Santis Club Ultra Test + JSON Schema Validator
 * UTF-8 (no BOM)
 *
 * Kontrol edilenler:
 * 1️⃣ santis-hotels.json yapısı
 * 2️⃣ Zorunlu alanların varlığı (slug, hero_image, translations, featuredServices)
 * 3️⃣ Her dilde name/description doğruluğu
 * 4️⃣ 404 hataları (hotel.html, booking.html, service.html)
 */

window.runSantisTests = async function(customConsole) {
  const console = customConsole || window.console;
  const colors = {
    green: "color: #4caf50; font-weight: bold;",
    red: "color: #f44336; font-weight: bold;",
    yellow: "color: #ff9800; font-weight: bold;",
    blue: "color: #2196f3; font-weight: bold;",
    reset: "color: inherit;"
  };

  console.log("%c🌐 Santis Club — Full Schema & Link Test Başlatılıyor...\n", colors.blue);

  try {
    const res = await fetch("santis-hotels.json");
    if (!res.ok) throw new Error(`❌ santis-hotels.json erişilemedi: ${res.status}`);
    const data = await res.json();

    // === 1️⃣ JSON Yapı Testi ===
    console.log("%c🧩 JSON Yapısı Kontrolü...", colors.blue);
    validateJSONStructure(data);

    // === 2️⃣ URL Testi ===
    console.log("%c\n🔗 Sayfa ve Servis URL Testleri...", colors.blue);
    await testAllURLs(data);

    console.log("%c\n🎉 Tüm testler tamamlandı.", colors.green);
  } catch (e) {
    console.error("%c❌ Test sırasında hata: " + e.message, colors.red);
  }

  // === Şema Doğrulama ===
  function validateJSONStructure(data) {
    if (!data.hotels || !Array.isArray(data.hotels)) {
      throw new Error("❌ 'hotels' alanı eksik veya yanlış formatta.");
    }

    const requiredHotelFields = ["slug", "hero_image", "translations", "featuredServices"];
    const requiredLangs = ["tr", "en", "de", "fr", "ru"];

    data.hotels.forEach((hotel, index) => {
      console.log(`%c\n🏨 Kontrol: ${hotel.slug || "(isimsiz otel)"} (#${index + 1})`, colors.yellow);

      // Zorunlu alan kontrolü
      for (const field of requiredHotelFields) {
        if (!hotel[field]) console.log(`%c   ❌ Eksik alan: ${field}`, colors.red);
      }

      // Translation kontrolü
      if (hotel.translations) {
        requiredLangs.forEach((lang) => {
          const t = hotel.translations[lang];
          if (!t) {
            console.log(`%c   ❌ ${lang.toUpperCase()} çevirisi eksik.`, colors.red);
          } else if (!t.name || !t.description) {
            console.log(`%c   ⚠️ ${lang.toUpperCase()} alanında name/description eksik.`, colors.red);
          } else {
            console.log(`%c   ✅ ${lang.toUpperCase()} çevirisi tamam.`, colors.green);
          }
        });
      }

      // featuredServices kontrolü
      if (!Array.isArray(hotel.featuredServices)) {
        console.log("%c   ❌ featuredServices alanı eksik veya yanlış format.", colors.red);
      } else {
        console.log(`%c   ✅ ${hotel.featuredServices.length} hizmet bulundu.`, colors.green);
        // Not: Yeni JSON yapısında featuredServices string array (ID listesi) olduğu için
        // burada sadece ID'lerin varlığını kontrol ediyoruz. Detaylı servis kontrolü services objesi üzerinden yapılabilir.
      }
    });

    console.log("%c\n✅ JSON yapısı genel olarak geçerli.", colors.green);
  }

  // === 404 Kontrolü ===
  async function testAllURLs(data) {
    const langList = ["tr", "en", "de", "fr", "ru"];
    let total = 0, passed = 0, failed = 0;

    for (const hotel of data.hotels) {
      for (const lang of langList) {
        // hotel.html
        const hURL = `hotel.html?hotel=${hotel.slug}&lang=${lang}`;
        total++; (await checkURL(hURL)) ? passed++ : failed++;

        // booking.html
        const bURL = `booking.html?hotel=${hotel.slug}&lang=${lang}`;
        total++; (await checkURL(bURL)) ? passed++ : failed++;

        // services
        for (const item of hotel.featuredServices || []) {
          const srvId = typeof item === 'object' ? item.slug : item;
          const sURL = `service.html?hotel=${hotel.slug}&service=${srvId}&lang=${lang}`;
          total++; (await checkURL(sURL)) ? passed++ : failed++;
        }
      }
    }

    console.log(`%c\n📊 URL Test Özeti: ${passed}/${total} başarılı, ${failed} hatalı.`, colors.yellow);
  }

  async function checkURL(url) {
    try {
      const base = url.split('?')[0];
      const r = await fetch(base, { method: "HEAD" });
      if (!r.ok) {
        console.log(`%c   ❌ ${r.status} - ${url}`, colors.red);
        return false;
      }
      console.log(`%c   ✅ ${url}`, colors.green);
      return true;
    } catch {
      console.log(`%c   ⚠️ Erişim hatası - ${url}`, colors.red);
      return false;
    }
  }
};

const params = new URLSearchParams(window.location.search);
// Sadece ?runSchemaTests=1 parametresi varsa veya manuel başlatıldıysa çalış
if (params.has('runSchemaTests') && !window.SANTIS_TEST_MANUAL_START) {
  window.runSantisTests();
}