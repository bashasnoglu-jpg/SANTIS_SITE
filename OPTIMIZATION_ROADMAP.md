# SANTIS CLUB - OPTIMIZATION ROADMAP (Hedef: 100/100)

**Tarih:** 27 Ocak 2026
**Hedef:** Google Lighthouse 100/100 (Performance, Accessibility, SEO, Best Practices)

Bu yol haritası, projenin "Mükemmel" skoruna ulaşması için gereken teknik adımları içerir.

## 1. GÖRSEL OPTİMİZASYONU (En Büyük Kazanç)
*   [ ] **Format Dönüşümü:** Tüm `.png` ve `.jpg` dosyaları yeni nesil `.webp` veya `.avif` formatına dönüştürülmeli.
    *   *Tespit:* `body_scrub.png` (654KB) -> WebP ile ortalama 60KB'a düşebilir.
*   [ ] **Açık Boyutlandırma (Explicit Dimensions):** Tüm `<img>` etiketlerine `width` ve `height` değerleri eklenmeli. (CLS skorunu düzeltir).
*   [ ] **Lazy Loading:** "Hero" (ekranın ilk görünen kısmı) dışındaki tüm görsellere `loading="lazy"` eklenmeli.

## 2. JAVASCRIPT & CSS KAOSUNU YÖNETMEK
*   [ ] **Minifikasyon:** `style.css` (62KB) ve `app.js` (40KB) sıkıştırılmalı (Minified).
*   [ ] **Unused CSS:** Kullanılmayan "ZigZag" stil dosyaları (`editorial.css` vb.) sadece ilgili sayfalarda yüklenmeli veya temizlenmeli.
*   [ ] **Script Loading:**
    *   `loader.js` dışındaki tüm scriptler `defer` veya `async` ile yüklenmeli.
    *   3. parti scriptler (varsa) `dns-prefetch` ile tanımlanmalı.

## 3. SEO & ERİŞİLEBİLİRLİK (Accessibility)
*   [ ] **Meta Açıklamaları:** Her sayfa (`service.html`, `hammam/index.html` vb.) için benzersiz `<meta name="description">` yazılmalı.
*   [ ] **Kontrast Oranları:** "Quiet Luxury" renk paletindeki (koyu gri üzerine gri yazı) bazı kombinasyonlar WCAG standartlarına uymayabilir. Kontrast artırılmalı.
*   [ ] **Aria Etiketleri:** İkon butonlara (Ara, Sepet) `aria-label="Arama yap"` gibi etiketler eklenmeli.

## 4. ÖNELİK (Prefetching)
*   [ ] **Fontlar:** Kullanılan fontlar (Cinzel, Manrope) `<link rel="preload">` ile önceden çekilmeli.
*   [ ] **Kritik Bağlantılar:** Kullanıcının gidebileceği muhtemel sayfalar (Booking) için `link rel="prefetch"` kullanılmalı.

## 5. SUNUCU TARAFI (Netlify/Vercel)
*   [ ] **Cache Policy:** Statik dosyalar (img, css, js) için "1 Yıl Cache" başlıkları (`Cache-Control`) ayarlanmalı.
*   [ ] **Gzip/Brotli:** Sunucu tarafında sıkıştırma aktif edilmeli.

---

## ÖNCELİKLİ UYGULAMA PLANI (HEMEN YAPILABİLECEKLER)

1.  **Görsel Dönüşümü:** `assets/img` klasöründeki büyük PNG'leri WebP'ye çevirmek.
2.  **HTML Etiketleri:** `img` taglerine width/height yazmak.
3.  **Meta Etiketleri:** Ana sayfalara açıklama girmek.

Bu adımlarla skorunuzu 90+'a sabitleyebiliriz. Başlamamı ister misiniz?
