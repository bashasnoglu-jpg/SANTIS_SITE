# SANTIS CLUB - E-COMMERCE ARCHITECTURE (V2.0)
> **Durum:** Stabil
> **Son Güncelleme:** 2026-01-31
> **Sorumlu:** Antigravity Agent

Bu belge, `tr/urunler/` modülünün (Ürünler Sayfası) verimliliğini ve stabilitesini korumak için teknik kuralları içerir. Tüm geliştirmeler bu kurallara uymalıdır.

## 1. Veri Yönetimi (Single Source of Truth)
- **Tek Gerçek Kaynak:** Tüm ürün verileri (isim, fiyat, resim, açıklama) YALNIZCA `assets/js/product-data.js` dosyasında tutulur.
- **Yasak:** HTML içine manuel ürün kartı eklemek YASAKTIR. Kartlar her zaman JS ile render edilmelidir.
- **Katalog Değişkeni:** Global `productCatalog` dizisi kullanılır.

## 2. Dosya Yolu Stratejisi (The Pathing Rule)
`tr/urunler/` gibi alt klasörlerde çalışan sayfalar için aşağıdaki kural **kesindir**:
- **Base Tag:** `<base href="../../">` (Projeyi kökten değil, bulunduğu derinlikten yukarı bağlar).
- **Component Loading:** `loadComp` fonksiyonu için yollar `../../components/navbar.html` şeklinde "Relative" (Göreceli) verilmelidir.
- **Sebep:** Live Server vb. basit sunucularda `/` kök dizin hatasını önler.

## 3. JavaScript Güvenliği
- **State Koruması:** `window.state` değişkeni `var` veya `window.state || {}` kalıbı ile tanımlanmalıdır. Asla `const` kullanılmamalıdır (Çift yükleme çökmesini önler).
- **Ön Yükleyici (Loader):** `ContentView` veya `Navbar` yüklenmeden sayfa etkileşime açılmamalıdır (Skeleton Screen mantığı).

## 4. Dosya Yapısı
```
SANTIS_SITE/
├── assets/
│   ├── js/
│   │   ├── product-data.js  <-- [ANA VERİ]
│   │   └── app.js           <-- [MANTIK]
│   └── img/cards/           <-- [GÖRSELLER]
├── tr/
│   └── urunler/
│       ├── index.html       <-- [LİSTELEME]
│       └── detay.html       <-- [DETAY SAYFASI]
```

## 5. Kontrol Listesi (Geliştirme Öncesi)
- [ ] `site_content.json` dosyasının yerinde olduğu teyit edildi mi?
- [ ] Yeni eklenen resimlerin `product-data.js` içine kaydı yapıldı mı?
- [ ] `<base href>` etiketi kontrol edildi mi?
