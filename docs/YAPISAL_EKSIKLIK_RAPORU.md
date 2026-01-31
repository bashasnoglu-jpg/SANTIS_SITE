# SANTIS CLUB - STRUCTURAL GAP ANALYSIS (YAPISAL EKSİKLİK RAPORU)

**Tarih:** 31.01.2026
**Analiz Tipi:** Klasör Bazlı (Missing Directory Scan)
**Durum:** ⚠️ Yapısal Eksikler Tespit Edildi

## 1. EKSİK KÖK VE VARLIK KLASÖRLERİ (Missing Core Directories)

Aşağıdaki klasörler, modern bir "Premium SPA" projesinde ve Santis standartlarında bulunması gereken ancak mevcut yapıda **BULUNAMAYAN** klasörlerdir:

### 📂 `assets/` Altında Eksikler:
*   **[MISSING] `assets/fonts/`**:
    *   *Önem:* "Playfair Display", "Cinzel" ve "Inter" gibi fontlar şu an muhtemelen CDN'den veya sistemden çekiliyor. "Quiet Luxury" için fontlar yerel (`.woff2`) olarak sunulmalı ve bu klasörde toplanmalıdır.
*   **[MISSING] `assets/icons/`**:
    *   *Önem:* SVG ikonlar dağınık veya inline kullanılıyor olabilir. Tüm ikon kütüphanesi burada toplanmalıdır.
*   **[MISSING] `assets/vendor/`**:
    *   *Önem:* 3. parti kütüphaneler için organize bir alan yok (şimdilik `node_modules` var ama statik sunum için `libs` klasörü önerilir).

### 📂 Kök Dizinde Eksikler:
*   **[MISSING] `public/` veya `static/`**:
    *   *Önem:* Robots.txt, sitemap.xml, manifest.json gibi statik dosyalar kök dizine saçılmış durumda. Bunların tek bir kaynak klasörde derli toplu olması önerilir.
*   **[MISSING] `docs/`**:
    *   *Önem:* `DETAYLI_PROJE_RAPORU.md` gibi dokümantasyon dosyaları proje kökünde kirlilik yaratıyor.

---

## 2. DİL YAPISI SENKRONİZASYON HATASI (TR vs EN)

Yapısal olarak en büyük boşluk **Çoklu Dil (i18n)** klasör yapısındadır.

*   **TR Yapısı (Mevcut ve Doğru):**
    *   `tr/`
        *   `tr/hamam/index.html`
        *   `tr/masajlar/index.html`
        *   `tr/cilt-bakimi/index.html`
*   **EN Yapısı (Eksik/Hatalı):**
    *   `en/` klasörü var ancak içi boş veya `tr` yapısını yansıtmıyor.
    *   **Eksik:** `en/hammam/index.html`
    *   **Eksik:** `en/massages/index.html`
    *   **Eksik:** `en/skincare/index.html`

> **Kritik:** İngilizce içerik şu an fiziksel olarak yok, kullanıcı dil değiştirdiğinde boş sayfaya veya 404'e düşebilir.

---

## 3. DOSYA KONUMLANDIRMA HATALARI (Misplaced Files)

*   `booking.html`, `gallery.html`, `product.html` hala **Kök Dizinde (`/`)** duruyor.
*   **Öneri:** Modern yapıda bunların da dil klasörleri içine (`tr/rezervasyon.html`, `en/booking.html`) taşınması gerekir. Kök dizindeki `index.html` sadece dil yönlendirmesi (Routing) yapmalıdır.

## 4. ÖZET VE AKSİYON PLANI

1.  [ ] `assets/fonts` ve `assets/icons` klasörlerini oluştur.
2.  [ ] `en/` klasör yapısını `tr/` ile birebir eşle (Mirroring).
3.  [ ] Kök dizindeki `md` ve rapor dosyalarını `docs/` klasörüne taşı.

*Bu rapor, dosya sisteminin fiziksel taraması sonucu "Yokluk Analizi" (Gap Analysis) yöntemiyle oluşturulmuştur.*
