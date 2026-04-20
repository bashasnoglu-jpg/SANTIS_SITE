# SANTIS CLUB - SYSTEM AUDIT REPORT (DETAYLI PROJE RAPORU)

**Rapor Tarihi:** 29.01.2026
**Denetleyen:** Santis AI System Architect
**Durum:** 🚧 Geliştirme Devam Ediyor (Eksikler Tespit Edildi)

Bu rapor, proje dosyalarınızın fiziksel taraması sonucunda hazırlanmıştır. Kod yazılmamış, sadece mevcut durum analiz edilmiştir.

---

## 1. 🚨 KRİTİK YOL HATALARI (Path Integrity)

Mevcut yapı **"Web Server" (Canlı Sunucu)** mantığına göre kurgulanmıştır.

*   **Navbar & Linkler:** `/` ile başlayan mutlak yollar (Absolute Paths) kullanılıyor (Örn: `/index.html`).
    *   *Durum:* Bu yapı VS Code "Live Server" veya gerçek hosting ile **SORUNSUZ** çalışır.
    *   *Uyarı:* Dosyaya çift tıklayarak (`file://` protokolü ile) açarsanız çalışmaz. Proje mutlaka bir sunucu üzerinden (localhost:5500 gibi) çalıştırılmalıdır.
*   **Component Loader:** `loader.js` dosyası `/components/navbar.html` yolunu çağırıyor. Bu da sunucu gerektirir. Şu anki yapı modern ve doğrudur.

**Tespit Edilen Kırık Linkler (Potential 404s):**
*   `navbar.html` içinde **Rezervasyon** butonu WhatsApp'a gidiyor (Doğru).
*   `navbar.html` içinde **Dil Seçimi** (TR/EN/RU/DE) şu an sadece JS fonksiyonuna bağlı, fiziksel EN sayfaları (`/en/..`) henüz proje klasöründe görünmüyor veya eksik.
*   `blog-detail.html` var ancak bir **Blog Listeleme (Blog Ana Sayfası)** dosyası kök dizinde yok.

---

## 2. 📂 DİZİN YAPISI VE MANTIKSAL UYUMSUZLUKLAR

Projeden eski yapılardan kalan "çöp" dosyalar tespit edildi. Bunlar kafa karışıklığı yaratabilir.

*   **Çift Sayfa Sorunu (Duplication):**
    *   `tr/hamam/index.html` (DOĞRU - Yeni Yapı)
    *   `tr/hamam.html` (ESKİ - Yönlendirme yapıyor). **Öneri:** Artık silinebilir.
    *   `tr/masajlar/index.html` (DOĞRU - Yeni Yapı)
    *   `tr/massage.html` (ESKİ - Detay sayfası olarak kalmış). **Öneri:** `service-detail.html` yapısına taşınıp silinmeli.
    *   `tr/cilt-bakimi/index.html` (DOĞRU)
    *   `service.html` (ESKİ/SAHİPSİZ): Hangi kategoriye ait olduğu belirsiz, eski bir şablon.

---

## 3. 🖼️ VARLIK YÖNETİMİ (Asset & Image Audit)

Projenin en büyük eksiği **GÖRSEL İÇERİK** çeşitliliğidir.

*   **Placeholder Dominasyonu:**
    *   `massage-data.js` (19 Hizmet) -> Hepsi `/assets/img/cards/hamam.webp` kullanıyor.
    *   `hammam-data.js` (6 Hizmet) -> Hepsi `/assets/img/cards/hamam.webp` kullanıyor.
    *   `skincare-data.js` (19 Hizmet) -> Hepsi `/assets/img/cards/hamam.webp` kullanıyor.
    *   **Sonuç:** Site dolu görünüyor ancak tüm resimler AYNI. Kullanıcı deneyimi (UX) açısından zayıf ("Cheap" algısı yaratabilir).

*   **Fiziksel Dosya Kontrolü:**
    *   `/assets/img/cards/` klasöründe sadece `hamam.webp` var.
    *   Diğer kategori görselleri (cilt bakımı, masaj çeşitleri, otel fotoğrafları) fiziksel olarak YOK.

---

## 4. 🎨 UI/UX EKSİKLERİ (Quiet Luxury Standartları)

*   **Renk Tutarsızlığı:**
    *   Bazı eski sayfalarda (`service.html`, `booking.html`) halen `style="color:#666"` gibi satır içi stiller var. Bunlar global CSS değişkenlerine (`var(--text-muted)`) bağlanmalı.
    *   *Not:* `tr/massage.html` ve `algae-ritual.html` tarafımdan yeni düzeltildi, ancak proje geneli taranmalı.
*   **Butonlar:**
    *   Eski buton sınıfları (`btn-submit`, `btn-primary`) ile yeni sistem (`santis-btn`) karışık kullanılıyor. Tek sisteme geçilmeli.

---

## 🛠️ ÇÖZÜM VE YOL HARİTASI (Action Plan)

1.  **Temizlik (Housekeeping):**
    *   `tr/hamam.html` ve `service.html` gibi atıl dosyaları arşive kaldırın veya silin.
2.  **Görsel Üretimi (Critical):**
    *   "Midjourney" veya benzeri bir araçla `_PROMPT_WORKBENCH.json` içindeki promptları kullanarak Cilt Bakımı ve Masaj görsellerini üretip `/assets/img/cards/` klasörüne **farklı isimlerle** kaydedin.
    *   Sonra JS veri dosyalarını (`massage-data.js` vb.) bu yeni dosya isimleriyle güncelleyin.
3.  **Dil Genişletmesi:**
    *   Eğer EN/RU dilleri aktif olacaksa, `tr/` klasör yapısının birebir kopyası `en/` ve `ru/` olarak oluşturulmalı.
4.  **Blog Eksikliği:**
    *   `blog.html` (Liste sayfası) oluşturulmalı.

Rapor Sonu.
