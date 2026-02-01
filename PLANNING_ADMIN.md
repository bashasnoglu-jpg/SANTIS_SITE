# IMPLEMEMTATION PLAN: SANTIS LOCAL CONTROL CENTER (v1.0)
> **Hedef:** Kod bilgisi olmayan personel için sürükle-bırak mantığıyla çalışan bir içerik yönetim sistemi.
> **Teknoloji:** %100 İstemci Taraflı (Client-Side) HTML/JS. Sunucu/Veritabanı gerektirmez.

## 1. Mimari Tasarım
Bu sistem, `yonetim.html` adında özel bir dosya üzerinden çalışır. Site yayınlandığında bu dosyayı sadece yetkililer (veya yerel bilgisayarınız) bilir.

### Özellikler & Genişletilebilirlik
Kullanıcının "İlerde başka özellikler ekleyebilir miyiz?" sorusuna cevaben; bu panel modüler tasarlanacaktır:
- [x] **Modül 1 (Şimdi):** Ürün Yönetimi (Sothys & Home)
- [ ] **Modül 2 (Gelecek):** Blog Yazısı Ekleme
- [ ] **Modül 3 (Gelecek):** Galeri Fotoğrafları Yönetimi
- [ ] **Modül 4 (Gelecek):** Fiyat Listesi Güncelleme

Sistem "Tab" (Sekme) yapısında olacağı için yeni modüller kolayca eklenebilir.

## 2. Çalışma Mantığı (Workflow)
1.  **Yükle:** Panel açılır, mevcut `product-data.js` dosyasını okur ve ekrana liste olarak döker.
2.  **Düzenle:** Kullanıcı form üzerinden yeni ürün ekler, fiyat değiştirir veya siler.
3.  **Kaydet:** "Kaydet" butonu, güncellenmiş veriyi **`product-data.js`** dosyası olarak bilgisayara indirir.
4.  **Yayınla:** Personel inen dosyayı `assets/js` klasörüne atar. Bitti!

## 3. Arayüz Tasarımı (UI)
"Santis Quiet Luxury" kimliğine uygun, siyah/gold temalı profesyonel bir dashboard.
- **Sol Sidebar:** Menü (Ürünler, Ayarlar)
- **Ana Ekran:** Ürün Listesi (Resim, İsim, Fiyat)
- **Modal:** Ürün Ekleme/Düzenleme Formu
- **Canlı Önizleme:** Ürün kartı nasıl görünecek anında gösterim.

## planlanan Dosyalar
- `admin/panel.html` (Ana Yönetim Merkezi)
- `admin/app-admin.js` (Yönetim Mantığı)
- `admin/style-admin.css` (Panel Tasarımı)

## 4. Onay Beklentisi
Bu planı onaylarsanız hemen `admin/` klasörünü oluşturup arayüzü kodlamaya başlayacağım.
