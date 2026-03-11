# 👑 SANTIS ADMIN PANEL (NEURAL BRIDGE V2.0) - ULTRA MEGA RAPOR
> **Tarih:** 20.02.2026
> **Sistem:** Santis Core v5.5 (Headless Data Bridge & Zero-Backend Architecture)

Santis Club Admin Paneli, sadece klasik içerik girişinin ötesine geçmiş, adeta sistemdeki yapısal bütünlüğü, SEO sağlığını, görsel tutarlılığı ve hatta algısal "Lüks" (Tone) oranını denetleyen uçtan uca bir **Yapay Zeka ve Otomasyon Üssü** haline gelmiştir.

---

## 🏛️ 1. MİMARİ VE ÇALIŞMA PRENSİBİ (Zero-Backend Felsefesi)
Admin paneli geleneksel bir MySQL/PostgreSQL veritabanı yerine, hibrit bir **JSON First** mimari kullanır:
* **Storage (Tarayıcı Belleği):** Geçici veri anlık olarak `LocalStorage` üzerinde tutulur, bu da panele ışık hızında bir tepkime süresi kazandırır.
* **Master Dosyalar:** Kalıcı olan değişiklikler, "Python Bridge" (Python Köprüsü) kullanılarak doğrudan sistemin `JSON` ve `JS` (örn: `services.json`, `product-data.js`) dosyalarına yazılır.
* **Güvenlik:** Kimlik doğrulama, IP bazlı "Rate Limiting" ve Brute-Force korumaları `server.py` üzerinden sağlanmaktadır. Sistemde oturum kapatıldığında yetkiler otomatik düşmektedir.

---

## 🚀 2. MEVCUT MODÜLLER VE İŞLEVLER (CORE FEATURES)

### 📦 Katalog ve Hizmet Yönetimi
*   **Ürün ve Menü Yönetimi:** Hamam, Cilt Bakımı, Masaj gibi menüler ile Sothys ürünlerinin listelendiği ana modül.
*   **Anlık Fiyat & Süre Güncelleme:** Servislerin fiyatları, etiketleri (Örn: "Günün Fırsatı") anında panele yansır.
*   **Çoklu Dil Desteği:** `tr`, `en`, `ru` vb. dillerdeki içerikler tek merkezden JSON'a işlenir.
*   **Zahmetsiz Görsel Yükleme:** Python Bridge kullanılarak sürüklenen görseller otomatik olarak `/assets/img/` dizinine kopyalanır ve optimizasyona girer.

### 🌐 Sosyal Medya & İletişim (Medya Üssü)
*   **Dinamik Rezervasyon:** WhatsApp numaraları ve sosyal medya linkleri değiştirildiğinde sitedeki tüm "Rezervasyon Yap" / "Bize Ulaşın" butonları otomatik güncellenir.
*   **Concierge:** "Sıradaki Müsait Asistanımız Sizi Bekliyor" tarzı karşılama metinleri doğrudan panele işlenmiştir.

### ✨ Santis Curator (AI İçerik Asistanı)
* Sistem, yeni bir hizmet girerken başlık ve özelliklere bakarak **"Sessiz Lüks" (Quiet Luxury)** tonunda ürün tanımlarını yapay zeka ile kendisi üretir veya düzenler. Ayrıca Auto-Tagging (otomatik etiketleme) özelliği aktiftir.

---

## 🤖 3. DEV SAĞLIK, DENETİM VE KORUMA SİSTEMLERİ (GOD TIER ÖZELLİKLER)

### 👁️ Oracle Dashboard (Canlı Zeka Ağı)
*   Sitede o an aktif olan kullanıcıları, konumlarını (Şehir/Ülke) gösterir.
*   **Global Mood (Ruh Hali) Haritası:** Kullanıcı sitenin hangi tonlarında gezindiğini ("Dawn", "Zen", "Sunset", "Midnight") canlı listeler.

### 🕷️ Deep Audit V2 (Derin Web Örümceği)
Sisteme entegre Crawler botu, arka planda tüm siteyi gezer:
*   Kırık Linkler (404) ve Eksik Assetleri (Resim, JS, CSS) bulur.
*   Sunucu ve SEO hatalarını tespit edip **Dashboard'da canlı raporlar**.
*   **Santis Fixer (Oto-Onarım):** Bulunan eksik resimlerin yerine otomatik "Placeholder" resim atar. Hayalet/Bozuk linkleri bulup gerekirse dosyaları siler, Sitemap.xml'i günceller.

### 🧠 Tone Health HUD (Santis Semantic Engine)
Dünyada çok az sistemde olan "Marka Sesi Kontrolcüsü":
*   Tüm sayfalardaki metinleri tarar ve içeriği **"Lüks Skoru" (Örn: 92/100)** üzerinden değerlendirir.
*   Markaya zarar veren veya kalitesiz hissettiren yasaklı kelimeleri (Örn: %50 İndirim, Ucuzluk) yakalar ve yerine lüks alternatiflerini önerir.

### 🏎️ Performance Deep Dive (Hız Testi)
* Playwright kullanarak Core Web Vitals ölçümü yapar. (FCP, LCP, CLS, TTFB, Dosya Boyutları). Canlı olarak skoru çıkarır.

### 📸 Visual Sentinel (Görsel Bekçi)
* Sitenin önemli rotalarının (Örn: `/services.html`) otomatik tam ekran görüntülerini alır. Önceki "Altın Standart" referans görüntüsüyle karşılaştırıp %1'lik bir piksel kayması, font bozulması veya CSS kırılması varsa "GÖRSEL REGRESYON" uyarısı verir.

### ⚔️ Red Team & Security Shield
*   **Live Attack Simulator:** Sitenin kendisine yönelik zafiyet simulasyonu başlatır (XSS, Path Traversal vb.). Sistemin güvenlik kalkanlarını test edip skoru panele çeker.
*   Güvenlik başlıklarının zorunlu kılınması, hassas dosyaların gizlenmesi (.env, backups) ve SSL zorunluluğu gibi maddeler panelden tek tıkla güvence altına alınır.

---

## 🎯 4. SONUÇ VE İLERİYE DÖNÜK BAKIŞ

Santis Admin Paneli, sadece bir veritabanı yönetim arayüzü değil; tamamen kendi kendini onarabilen, hataları kullanıcıdan önce görebilen ve içerik kalitesini denetleyen bağımsız bir yapay zeka işletim sistemine (City OS) dönüşmüştür.

🛡️ **Güvenlik Derecesi:** A (Üst Düzey Middleware Korumaları Aktif)  
⚡ **Geliştirme Hızı:** Limitsiz (Zero-Backend olduğu için DevOps darboğazı yok)  
🤖 **AI Entegrasyonu:** Mükemmel (İçerik, SEO ve Sağlık Tarayıcısı)  

*Rapor sonu.*
