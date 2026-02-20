# 🕵️‍♂️ SANTIS - Derinlemesine Hata Analiz Raporu & Kök Nedenler



Bu rapor, `PROMPT_DROP_ZONE.txt` dosyasında tespit edilen sistemik hataların teknik kök nedenlerini ve uygulanan mimari çözümleri detaylandırır.



## 1. Scope (Kapsam) İhlali ve Referans Kaybı

**Hata:** `Uncaught ReferenceError: localFallbackData is not defined`

**Ciddiyet:** 🔴 Kritik (Uygulama çökmesi)



### Teknik Analiz

JavaScript motorlarının **Block Scope** (Blok Kapsamı) yönetimi ile ilgili temel bir kodlama hatası tespit edildi.



*   **Olay:** `localFallbackData` değişkeni `try { ... }` bloğu içerisinde `const` ile tanımlanmıştı.

*   **Sorun:** `const` ve `let` ile tanımlanan değişkenler, sadece tanımlandıkları süslü parantez `{ }` içinde yaşarlar.

*   **Çökme Noktası:** Kod `catch(e) { ... }` bloğuna düştüğünde (örneğin JSON yüklenemediğinde), hata yönetim bloğu `localFallbackData` değişkenini döndürmeye çalıştı. Ancak değişken `try` bloğu içinde hapsolduğu ve o blok sonlandığı için bellekten silinmişti. Bu durum, hatayı yakalaması gereken mekanizmanın (try-catch) kendisinin hata üretmesine (Exception during Exception Handling) sebep oldu.



**✅ Çözüm:** Değişken tanımlaması, tüm blokların (try ve catch) erişebileceği üst kapsama (Scope Hoisting mantığına uygun şekilde) taşındı.



---



## 2. Derinlik Algısı Sorunu (Relative Path Blindness)

**Hata:** `GET .../tr/hamam/data/site_content.json 404 (Not Found)`

**Ciddiyet:** 🟠 Yüksek (İçerik yüklenememesi)



### Teknik Analiz

Yazılım mimarisi, uygulamanın çalışacağı dizin derinliği konusunda "kör" (blind) bir stratejiye sahipti.



*   **Olay:** Uygulama `fetch("data/site_content.json")` komutunu çalıştırdı.

*   **Sorun:** Bu komut "Relative" (Göreli) bir yoldur. Tarayıcı bu komutu çalıştıran sayfanın mevcut konumuna bakar.

    *   Eğer `index.html` (Ana klasör) çalışıyorsa: `site.com/data/site_content.json` ✅ (Doğru)

    *   Eğer `tr/hamam/index.html` (Alt klasör) çalışıyorsa: `site.com/tr/hamam/data/site_content.json` ❌ (Yanlış - Dosya orada değil)

*   **Kök Neden:** Kodda "Ben şu an hangi klasördeyim?" sorusunu soran ve ona göre yolu modifiye eden bir **"Context Awareness" (Bağlam Farkındalığı)** mekanizması yoktu.



**✅ Çözüm:** **"Explicit Relative" (Açık Göreli Yol)** stratejisi geliştirildi.

1.  `getSantisRootPath()` adlı akıllı bir yardımcı fonksiyon yazıldı.

2.  Bu fonksiyon, `app.js` dosyasının HTML içindeki kendi çağrılma yolunu (örn: `../../assets/js/app.js`) analiz eder.

3.  `../../` öneki (prefix) dinamik olarak hesaplanır.

4.  Tüm görsel ve veri isteklerinin başına bu önek eklenir (örn: `../../data/site_content.json`).

5.  Sonuç: Dosya nerede olursa olsun (ister kökte, ister 5 klasör altta), yollar her zaman doğru hedefe kilitlenir.



---



## 3. Favicon Enjeksiyon Hatası

**Hata:** `index.html:1 GET .../tr/hamam/favicon.ico 404`

**Ciddiyet:** 🟡 Orta (Konsol kirliliği)



### Teknik Analiz

`app.js`'in otomatik `favicon` ekleme özelliği, yukarıdaki "Yol Hatası" ile aynı sebepten başarısız oluyordu. `app.js` körü körüne `favicon.ico` eklemeye çalışıyordu, bu da alt klasörlerde `hamam/favicon.ico` aranmasına sebep oluyordu.



**✅ Çözüm:** `getSantisRootPath()` fonksiyonu buraya da entegre edildi. Artık `favicon` yolu da sayfanın konumuna göre dinamik hesaplanıyor.



---



## 🏁 Sonuç ve Özet

Yaşanan sorunlar, kodun **statik bir ortam varsayımıyla** (sadece ana dizin) yazılmasından kaynaklanıyordu. Yapılan müdahalelerle yazılıma **Dinamik Ortam Adaptasyonu** yeteneği kazandırıldı. Artık Santis web uygulaması:

1.  **Scope Güvenli:** Değişken yaşam döngüleri doğru yönetiliyor.

2.  **Konum Bağımsız:** Herhangi bir alt klasörde hatasız çalışabiliyor.

3.  **Hata Toleranslı:** JSON yüklenemezse bile scope hatası vermeden 'Fallback' (Yedek) veriye geçebiliyor.

