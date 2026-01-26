/**
 * 🌐 Santis Club Ultra Test Runner (404 + JSON Schema Kontrollü)
 * UTF-8 | Çoklu Dil & Otel Akışı Testi
 * 
 * 🔹 JSON veri yapısını (schema) doğrular (eksik alan, hatalı tip vb.).
 * 🔹 Oteller, hizmetler ve diller için tüm sayfa URL’lerini test eder.
 * 🔹 404/500 hatalarında konsolda kırmızı uyarı verir.
 * 🔹 Hatalı sayfa varsa test sonunda özet rapor oluşturur.
 */

(async function santisTest() {
  const colors = {
    green: "color: #4caf50; font-weight: bold;",
    red: "color: #f44336; font-weight: bold;",
    blue: "color: #2196f3; font-weight: bold;",
    yellow: "color: #ff9800; font-weight: bold;",
    reset: "color: inherit;"
  };

  console.log("%c🌐 Santis Club Ultra Test (JSON Schema + 404 Kontrollü) Başlatılıyor...\n", colors.blue);

  let total = 0;
  let passed = 0;
  let failed = 0;
  const errors = [];

  // 🔍 JSON Schema Doğrulama
  function validateJSON(data) {
    console.log("%c🔍 JSON Veri Doğrulaması Başlatılıyor...", colors.blue);
    let isValid = true;
    const requiredLangs = ["tr", "en", "de", "fr", "ru"];

    // 1. Hotels Kontrolü
    if (!data.hotels || !Array.isArray(data.hotels)) {
      console.error("%c❌ HATA: 'hotels' dizisi eksik veya hatalı!", colors.red);
      return false;
    }

    data.hotels.forEach((h, i) => {
      if (!h.slug) { console.error(`%c❌ Hotel[${i}]: 'slug' eksik!`, colors.red); isValid = false; }
      if (!h.hero_image) { console.warn(`%c⚠️ Hotel[${h.slug || i}]: 'hero_image' eksik!`, colors.yellow); }
      
      if (!h.translations) {
        console.error(`%c❌ Hotel[${h.slug}]: 'translations' eksik!`, colors.red);
        isValid = false;
      } else {
        requiredLangs.forEach(lang => {
          if (!h.translations[lang] || !h.translations[lang].name) {
            console.error(`%c❌ Hotel[${h.slug}]: '${lang}' çevirisi veya ismi eksik!`, colors.red);
            isValid = false;
          }
        });
      }

      if (!h.featuredServices || !Array.isArray(h.featuredServices)) {
        console.warn(`%c⚠️ Hotel[${h.slug}]: 'featuredServices' listesi eksik!`, colors.yellow);
      }
    });

    // 2. Services Kontrolü
    if (!data.services || typeof data.services !== 'object') {
      console.error("%c❌ HATA: 'services' objesi eksik veya hatalı!", colors.red);
      return false;
    }

    Object.keys(data.services).forEach(key => {
      const s = data.services[key];
      if (!s.categoryId) { console.warn(`%c⚠️ Service[${key}]: 'categoryId' eksik!`, colors.yellow); }
      if (!s.durationMin) { console.warn(`%c⚠️ Service[${key}]: 'durationMin' eksik!`, colors.yellow); }
      
      if (!s.name) {
        console.error(`%c❌ Service[${key}]: 'name' objesi eksik!`, colors.red);
        isValid = false;
      } else {
        requiredLangs.forEach(lang => {
          if (!s.name[lang]) {
            console.warn(`%c⚠️ Service[${key}]: '${lang}' isim çevirisi eksik!`, colors.yellow);
          }
        });
      }
    });

    if (isValid) console.log("%c✅ JSON Veri Yapısı Geçerli.\n", colors.green);
    else console.log("%c❌ JSON Veri Yapısında Hatalar Var!\n", colors.red);
    
    return isValid;
  }

  async function checkURL(url) {
    try {
      // Sadece dosya yolunu kontrol et (parametreler sunucu tarafında işlenmediği için statik dosya kontrolü yeterli)
      const base = url.split('?')[0];
      const res = await fetch(base, { method: "HEAD" });
      
      if (!res.ok) {
        console.log(`%c   ❌ ${res.status} - ${url}`, colors.red);
        return false;
      }
      console.log(`%c   ✅ ${url}`, colors.green);
      return true;
    } catch {
      console.log(`%c   ⚠️ Erişim hatası - ${url}`, colors.red);
      return false;
    }
  }

  try {
    const res = await fetch("santis-hotels.json");
    if (!res.ok) throw new Error(`santis-hotels.json bulunamadı: ${res.status}`);
    const data = await res.json();

    // JSON Doğrulama
    if (!validateJSON(data)) {
      console.error("%c⛔ Test durduruldu: JSON verisi hatalı.", colors.red);
      return;
    }

    const hotels = data.hotels;
    const services = data.services;

    console.log(`✅ ${hotels.length} otel bulundu.\n`);

    for (const hotel of hotels) {
      console.group(`%c🏨 ${hotel.translations.tr.name}`, colors.blue);
      const langList = ["tr", "en", "de", "fr", "ru"];

      for (const lang of langList) {
        // Hotel sayfası
        const hotelURL = `hotel.html?hotel=${hotel.slug}&lang=${lang}`;
        total++;
        const hotelOk = await checkURL(hotelURL);
        hotelOk ? passed++ : failed++;

        // Services
        for (const serviceId of hotel.featuredServices) {
          const service = services[serviceId];
          if (service) {
            const serviceURL = `service.html?hotel=${hotel.slug}&service=${serviceId}&lang=${lang}`;
            total++;
            const serviceOk = await checkURL(serviceURL);
            if (serviceOk) passed++; else { failed++; errors.push(serviceURL); }
          } else {
             console.warn(`⚠️ Servis ID bulunamadı: ${serviceId}`);
          }
        }

        // Booking
        const bookingURL = `booking.html?hotel=${hotel.slug}&lang=${lang}`;
        total++;
        const bookingOk = await checkURL(bookingURL);
        if (bookingOk) passed++; else { failed++; errors.push(bookingURL); }
      }
      console.groupEnd();
    }

    // Rapor
    console.log("\n📊 Test Özeti");
    console.log(`%c✅ Başarılı: ${passed}`, colors.green);
    console.log(`%c❌ Hatalı: ${failed}`, colors.red);
    console.log(`🔢 Toplam Test: ${total}`);

    if (errors.length > 0) {
      console.log("\n🚨 Hatalı URL'ler:");
      errors.forEach((url) => console.log(`%c   ${url}`, colors.red));
    } else {
      console.log("%c\n🎉 Tüm bağlantılar başarılı!", colors.green);
    }

  } catch (err) {
    console.error("❌ Test sırasında hata:", err.message);
  }
})();
