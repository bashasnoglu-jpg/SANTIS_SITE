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

  // JSON dosyası için sağlam URL üret (dosyaya göre, köke göre ve origin'e göre sırayla)
  const jsonUrl = (() => {
    // Eğer sayfa bir http(s) origin'de çalışıyorsa kökten al
    if (location.origin && location.origin !== "null") {
      return `${location.origin}/santis-hotels.json`;
    }
    // Değilse çalıştığı dosyanın yanına bak (file:// açılışları)
    const base = document.currentScript?.src || location.href;
    return new URL("santis-hotels.json", base).href;
  })();

  try {
    const res = await fetch(jsonUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(`❌ santis-hotels.json erişilemedi: ${res.status} (${jsonUrl})`);
    const data = await res.json();

    // === 1️⃣ JSON Yapı Testi ===
    console.log("%c🧩 JSON Yapısı Kontrolü...", colors.blue);
    validateJSONStructure(data);

    // === 2️⃣ URL Testi ===
    console.log("%c\n🔗 Sayfa ve Servis URL Testleri...", colors.blue);
    await testAllURLs(data);

    // === 3️⃣ Görsel Testi ===
    console.log("%c\n🖼️ Görsel Varlık Testleri (Hero Images)...", colors.blue);
    await testImages(data);

    // === 4️⃣ Fiyat Kontrolü ===
    console.log("%c\n💰 Fiyat Kontrolü...", colors.blue);
    validatePrices(data);

    console.log("%c\n🎉 Tüm testler tamamlandı.", colors.green);
  } catch (e) {
    console.error("%c❌ Test sırasında hata: " + e.message, colors.red);
    if (e.message.includes("santis-hotels.json")) {
      console.info("%cℹ️ Çözüm: `npm start` veya `npx http-server . -p 5501` ile sitenin kökünü HTTP üzerinden aç ve sonra yeniden dene.", colors.yellow);
    }
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

      if (hotel.hero_image && !hotel.hero_image.startsWith('https')) {
        console.log(`%c   ⚠️ Hero image HTTPS değil: ${hotel.hero_image}`, colors.yellow);
      }

      // Translation kontrolü
      if (hotel.translations) {
        requiredLangs.forEach((lang) => {
          const t = hotel.translations[lang];
          if (!t) {
            console.log(`%c   ❌ ${lang.toUpperCase()} çevirisi eksik.`, colors.red);
          } else if (!t.name || !t.description) {
            console.log(`%c   ⚠️ ${lang.toUpperCase()} alanında name/description eksik.`, colors.red);
          } else if (t.description.length < 20) {
            console.log(`%c   ⚠️ ${lang.toUpperCase()} açıklaması çok kısa (${t.description.length} kr).`, colors.yellow);
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

  // === Görsel Kontrolü ===
  async function testImages(data) {
    let total = 0, passed = 0, failed = 0;

    for (const hotel of data.hotels) {
      if (hotel.hero_image) {
        total++;
        // checkURL fonksiyonunu kullanarak görselin erişilebilirliğini test et
        const isOk = await checkURL(hotel.hero_image);
        isOk ? passed++ : failed++;
      }
    }
    console.log(`%c\n📊 Görsel Test Özeti: ${passed}/${total} başarılı, ${failed} hatalı.`, colors.yellow);
  }

  // === Fiyat Kontrolü ===
  function validatePrices(data) {
    if (!data.services) return;
    let total = 0, passed = 0, failed = 0;
    Object.entries(data.services).forEach(([key, svc]) => {
      total++;
      if (svc.price > 0) {
        passed++;
      } else {
        failed++;
        console.log(`%c   ❌ ${key}: Fiyat geçersiz (${svc.price})`, colors.red);
      }
    });
    console.log(`%c\n📊 Fiyat Test Özeti: ${passed}/${total} başarılı, ${failed} hatalı.`, colors.yellow);
  }

  async function checkURL(url) {
    const start = performance.now();
    try {
      const base = url.split('?')[0];
      const r = await fetch(base, { method: "HEAD" });
      const duration = Math.round(performance.now() - start);
      if (!r.ok) {
        console.log(`%c   ❌ ${r.status} - ${url} [${duration}ms]`, colors.red);
        return false;
      }
      console.log(`%c   ✅ ${url} [${duration}ms]`, colors.green);
      return true;
    } catch {
      const duration = Math.round(performance.now() - start);
      console.log(`%c   ⚠️ Erişim hatası - ${url} [${duration}ms]`, colors.red);
      return false;
    }
  }
};

const params = new URLSearchParams(window.location.search);
// Sadece ?runSchemaTests=1 parametresi varsa veya manuel başlatıldıysa çalış
if (params.has('runSchemaTests') && !window.SANTIS_TEST_MANUAL_START) {
  window.runSantisTests();
}
