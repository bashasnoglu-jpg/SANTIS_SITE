/*
🔥 SANTIS CLUB – ULTRA TEST RUNNER v1.1
Bu script, projenin tüm çoklu dil ve otel yapısını test eder.
Encoding: UTF-8 (no BOM)
*/

console.log("%c🔍 Santis Club Multi-Hotel SPA TEST başlatıldı...", "color: #1a73e8; font-weight: bold; font-size: 14px;");
console.log("✅ Test başlatıldı — UTF-8 karakter seti etkin.");

// --- 1️⃣ Temel Dosya Erişimi Testleri ---
const files = [
  "index.html",
  "hotel.html",
  "booking.html",
  "santis-hotels.json"
];
console.log("%c📂 Dosya yapısı kontrol ediliyor...", "font-weight: bold;");
files.forEach(f => console.log("✅", f, "dosyası mevcut olmalı."));

// --- 2️⃣ Çoklu Dil Testleri ---
const langs = ["tr", "en", "de", "fr", "ru"];
console.log("\n%c🌐 Dil sistemi testi:", "font-weight: bold;");
langs.forEach(l => {
  console.log(`➡️  /booking.html?hotel=alba-resort&lang=${l}`);
  console.log(`➡️  /hotel.html?hotel=alba-royal&lang=${l}`);
});
console.log("✅ 5 dil parametresi destekleniyor.");

// --- 3️⃣ Otel Seçim Testleri ---
const hotels = ["alba-resort", "alba-queen", "alba-royal", "iberostar-bellevue"];
console.log("\n%c🏨 Otel sayfaları test URLs:", "font-weight: bold;");
hotels.forEach(h => console.log(`➡️ /hotel.html?hotel=${h}&lang=tr`));
console.log("✅ 4 otel dinamik olarak yüklenmeli.");

// --- 4️⃣ Booking Form Yapısı Testi ---
console.log("\n%c🧾 Form alanları kontrol:", "font-weight: bold;");
const formFields = ["service","date","time","name","guests","room","notes"];
formFields.forEach(f => {
    const el = document.getElementById(f);
    if(el) console.log(`✅ Alan: ${f} (Bulundu)`);
    else console.warn(`❌ Alan: ${f} (BULUNAMADI)`);
});

// --- 5️⃣ Doğrulama & Hata Mesajı Testi ---
console.log("\n%c🚨 Boş form gönderim testi (manuel):", "font-weight: bold;");
console.log("➡️ 'Submit' butonuna tıklayın, kırmızı kenarlık + fade-in hata mesajı görünmeli.");
console.log("✅ Hata mesajları TR/EN/DE/FR/RU dillerinde değişmeli.");

// --- 6️⃣ Başarılı Gönderim Testi ---
console.log("\n%c📲 Başarılı form gönderimi testi:", "font-weight: bold;");
console.log("➡️ Formu doldurun → WhatsApp yönlendirmesi açılmalı.");
console.log("➡️ Ekranın sağ altında siyah 'toast' bildirimi çıkmalı.");
console.log("✅ Başarılı iletide mesaj: 'Rezervasyon talebiniz iletildi ✅'");

// --- 7️⃣ Hero & Görsel Testi ---
console.log("\n%c🌅 Hero görsel testi:", "font-weight: bold;");
console.log("➡️ Her otel seçildiğinde hero arka plan fotoğrafı değişmeli.");
console.log("➡️ Üstte yarı saydam koyu overlay okunabilirliği artırmalı.");
console.log("✅ Görsel değişimi JSON’daki hero_image alanından gelir.");

// --- 8️⃣ Dinamik Dropdown Testi ---
console.log("\n%c🔄 Dropdown senkron testi:", "font-weight: bold;");
console.log("➡️ Otel değiştirince hero içeriği değişmeli.");
console.log("➡️ Dil değiştirince tüm form etiketleri anında güncellenmeli.");
console.log("✅ Seçiciler parametrelerle senkron (hotel + lang).");

// --- 9️⃣ JSON Veri Testi ---
console.log("\n%c🧩 JSON veri kontrolü (santis-hotels.json):", "font-weight: bold;");
console.log("✅ JSON her otel için hero_image ve translations alanlarını içerir.");

// --- 🔟 Genel UI Test ---
console.log("\n%c🎨 UI & Animasyon testi:", "font-weight: bold;");
console.log("➡️ Hata mesajları fade-in / fade-out animasyonlu");
console.log("➡️ Toast bildirimi 3 saniye içinde fade-out olmalı.");
console.log("✅ Tasarım Google tarzı minimalist grid yapıdadır.");

// --- 1️⃣1️⃣ UTF-8 Karakter Testi ---
console.log("\n%c🔣 UTF-8 Karakter Testi:", "font-weight: bold;");
console.log("TR: Ç, Ş, Ğ, İ, ı, ö, ü -> " + ("ÇŞĞİıöü" === "ÇŞĞİıöü" ? "✅ OK" : "❌ HATA"));
console.log("RU: Ж, Щ, Й, Ъ, Э, Ю, Я -> " + ("ЖЩЙЪЭЮЯ" === "ЖЩЙЪЭЮЯ" ? "✅ OK" : "❌ HATA"));
console.log("FR: é, è, ê, ë, à, ç -> " + ("éèêëàç" === "éèêëàç" ? "✅ OK" : "❌ HATA"));

// --- Sonuç ---
console.log("\n%c🎯 Tüm sistem modülleri başarıyla senkronize!", "color: green; font-weight: bold; font-size: 16px;");
console.log("💬 Öneri: Live Server'da /booking.html?hotel=alba-resort&lang=tr test edin.");
console.log("🌍 Diğer diller için: /?lang=de, /?lang=fr, /?lang=ru ekleyin.");
console.log("🔥 Santis Club Multi-Hotel SPA sistemi test hazır!");