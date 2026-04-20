# Santis Club - WebP Dönüşüm Planı

**Amaç:** Site performansını artırmak ve Google Lighthouse skorunu 100'e yaklaştırmak için tüm statik görselleri yeni nesil WebP formatına dönüştürmek.

## 1. Mevcut Durum Analizi
Şu anda projede ağırlıklı olarak `.png` ve `.jpg` formatları kullanılmaktadır.
- **Konum:** `assets/img/` ve alt klasörleri (`cards/`, `hero/` vb.)
- **Tespit Edilen Dosyalar:**
  - `assets/img/cards/hammam.png`
  - `assets/img/cards/massage.png`
  - `assets/img/cards/facial.png` (Referanslarda var)
  - `assets/img/cards/product-*.png` (Referanslarda var)

## 2. Dönüşüm Stratejisi

### A. Araçlar
Aşağıdaki yöntemlerden birini kullanarak görselleri dönüştürün:
1.  **Online Araçlar:** Squoosh.app (Google tarafından geliştirilmiştir, manuel işlem için en iyisi).
2.  **VS Code Eklentileri:** "WebP Converter" gibi eklentiler.
3.  **Toplu İşlem (CLI):** Eğer çok sayıda dosya varsa `cwebp` komut satırı aracı.

### B. Kalite Ayarları
- **Kayıplı (Lossy):** Fotoğraflar için %80-85 kalite (Gözle görülür fark olmadan %70 tasarruf).
- **Kayıpsız (Lossless):** Grafikler ve logolar için.

## 3. Kod Güncelleme Adımları (Refactoring)

Görseller fiziksel olarak dönüştürüldükten sonra kodda referansların değiştirilmesi gerekir.

### Adım 1: JSON Veri Dosyaları
`data/site_content.json` ve `assets/js/products-data.js` içindeki `.png` / `.jpg` uzantılarını `.webp` ile değiştirin.

*Örnek (site_content.json):*
```json
"img": "assets/img/cards/hammam.png"
// Şuna dönüşecek:
"img": "assets/img/cards/hammam.webp"
```

### Adım 2: HTML Dosyaları
`index.html`, `hotel.html` vb. dosyalardaki `<img>` etiketlerini güncelleyin.

### Adım 3: CSS Dosyaları
`style.css` veya diğer CSS dosyalarındaki `background-image` tanımlarını güncelleyin.

## 4. Uygulama Kontrol Listesi

- [ ] `assets/img/cards/hammam.png` -> `hammam.webp`
- [ ] `assets/img/cards/massage.png` -> `massage.webp`
- [ ] `site_content.json` güncellendi.
- [ ] `products-data.js` güncellendi.
- [ ] `index.html` ve diğer HTML sayfaları tarandı.
- [ ] Tarayıcıda test edildi (Görseller yükleniyor mu?).

---
*Bu plan Santis AI tarafından oluşturulmuştur.*