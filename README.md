# Santis Club Spa & Wellness

**Sürüm:** 2.1  
**Son Güncelleme:** 30.01.2026  
**Domain:** santisclub.com

## Proje Tanımı
Santis Club, "Quiet Luxury" (Sessiz Lüks) tasarım dilini benimseyen, Antalya merkezli seçkin bir spa ve wellness markasının web sitesidir. Proje, HTML5, CSS3 ve Vanilla JavaScript kullanılarak geliştirilmiştir ve performans odaklıdır.

## Özellikler
- **Dinamik İçerik Yönetimi:** Tüm metinler ve otel verileri `data/site_content.json` ve `data/santis-hotels.json` üzerinden yönetilir.
- **Rezervasyon Sihirbazı:** Kullanıcıların hizmet seçip WhatsApp üzerinden rezervasyon yapmasını sağlayan modüler yapı (`booking-wizard.js`).
- **Çoklu Dil Altyapısı:** Türkçe ve İngilizce desteği (şu an TR odaklı).
- **Mobil Öncelikli Tasarım:** Tüm cihazlarda kusursuz görünen responsive yapı.

## Kurulum ve Çalıştırma
Bu proje statik bir web sitesidir, ancak veri yükleme işlemleri (JSON fetch) nedeniyle bir yerel sunucu gerektirir.

### Test Aracı ile Başlatma
Proje kök dizinindeki PowerShell betiğini kullanarak yerel sunucuyu başlatabilirsiniz:
```powershell
.\test-project.ps1 -Server
```

### VS Code Live Server
Alternatif olarak Visual Studio Code eklentisi "Live Server" ile `index.html` dosyasını açabilirsiniz.

## Dosya Yapısı
- **assets/**: Stil dosyaları (`css/`), JavaScript modülleri (`js/`) ve görseller.
- **data/**: Site içeriğini barındıran JSON veri dosyaları.
- **components/**: Navbar ve Footer gibi dinamik yüklenen HTML parçaları.
- **_PROMPT_WORKBENCH.json**: Geliştirme süreci, görevler ve AI promptları için çalışma dosyası.

## Geliştirme Notları
- **CSS Mimarisi:** `style.css` ana dosya olup, `card-effects.css` ve `animations.css` gibi modüler dosyalarla desteklenir.
- **JS Yapısı:** `app.js` ana giriş noktasıdır. `core_data_loader.js` veri yönetimini sağlar.

## Renk Paleti
- **Primary:** #2C2C2C
- **Accent (Gold):** #B8860B
- **Background:** #F5F5F0

---
*Bu dosya proje içeriğine dayalı olarak otomatik oluşturulmuştur.*