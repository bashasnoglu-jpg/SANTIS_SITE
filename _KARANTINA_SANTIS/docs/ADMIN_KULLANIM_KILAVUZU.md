# 👑 SANTIS CONTROL CENTER - ULTRA MEGA KULLANIM KILAVUZU

Bu belge, Santis Club web sitesinin yönetim paneli (Admin Panel) için hazırlanmış kapsamlı rehberdir.

> **⚠️ ÖNEMLİ UYARI (SİSTEM MANTIĞI)**
> Bu web sitesi **"Serverless" (Sunucusuz)** ve **"Static"** yapıda çalışır. Yani bir veritabanı yoktur.
> Tüm veriler (fiyatlar, isimler) `.js` dosyalarında saklanır.
>
> **Bu yüzden Admin Panelinde "Kaydet" dediğinizde site anında değişmez.**
> Yaptığınız değişiklikleri **bilgisayarınıza indirip**, sitenin ilgili klasörüne **elinizle atmanız** gerekir.
> *Bu, sistemin hacklenemez, çok hızlı ve masrafsız olmasını sağlayan özelliktir.*

---

## 1. HIZLI BAŞLANGIÇ

### Paneli Açma
1.  Masaüstünüzdeki **SANTIS_SITE** klasörüne girin.
2.  `admin` klasörüne girin.
3.  `panel.html` dosyasına çift tıklayın (Tarayıcıda açılacaktır).
    *   *Alternatif:* VS Code kullanıyorsanız, `launch.json` ayarlarından "👑 Santis: Admin Panel (Live)" seçeneği ile açabilirsiniz.

---

## 2. ÜRÜN YÖNETİMİ (Kozmetik & Mağaza)

Buradan "Ürünler" sayfasındaki kremleri, yağları ve hediyelik eşyaları yönetirsiniz.

### Yeni Ürün Ekleme
1.  **"📦 Ürün Yönetimi"** sekmesine gelin.
2.  **"+ Yeni Ürün Ekle"** butonuna basın.
3.  **Formu Doldurun:**
    *   **Ürün Adı:** Örn: `Hydra3Ha Serum`
    *   **Kategori:** Listeden doğru kategoriyi seçin (Örn: `Yüz / Gençlik`). Bu seçim ürünün sitede hangi sekmede çıkacağını belirler.
    *   **Fiyat:** `90 €` veya `Bilgi Al` yazabilirsiniz.
    *   **Görsel:** `product-cream.png` gibi dosya adını yazın.
        *   *Not: Bu resmi `assets/img/cards/` klasörüne ayrıca koymanız gerekir.*
4.  **"Kaydet"** butonuna basın.

### Ürün Silme / Düzenle
*   Listede her ürünün yanında **✏️ (Kalem)** ve **🗑️ (Çöp Kutusu)** ikonları vardır.
*   Çöp kutusuna basınca onay verirseniz ürün listeden kalkar.

---

## 3. HİZMET YÖNETİMİ (Hamam, Masaj, Cilt)

Sitenin "Hamam", "Masajlar" ve "Cilt Bakımı" sayfalarındaki kartları buradan yönetirsiniz.

1.  **"💆 Hizmetler"** sekmesine gelin.
2.  Üstteki filtrelerden (Tümü, Hamam, Masaj, Cilt) hangisini düzenleyeceğinizi seçin.
3.  **Düzenleme:** Fiyat değiştirmek için ✏️ ikonuna basın, yeni fiyatı yazıp kaydedin.
4.  **"🔥 GÜNÜN FIRSATI"**: Bir hizmeti düzenlerken bu kutucuğu işaretlerseniz, kartın üzerinde turuncu "FIRSAT" etiketi çıkar.

---

## 4. KRİTİK ADIM: SİTEYE YAYINLAMA (EXPORT)

Admin panelinde yaptığınız her şey tarayıcının **geçici hafızasında** (RAM) durur. Sayfayı kapatırsanız gider!
Kalıcı yapmak için şu adımları **HER DEĞİŞİKLİKTEN SONRA** yapmalısınız:

### Adım 1: Dosyayı İndir
Hangi bölümde değişiklik yaptıysanız, o bölümün sağ üstündeki **"💾 ... Verisini İndir"** butonuna basın.
*   Ürünler için -> `product-data.js` iner.
*   Hizmetler için -> `services-data.js` iner.
*   Ayarlar için -> `settings-data.js` iner.

### Adım 2: Dosyayı Yerine Koy (Overwrite)
1.  İndirilen dosyayı (Genelde `İndirilenler` klasöründedir) kopyalayın.
2.  Projenizin **`assets/js/`** klasörüne gidin.
3.  Dosyayı buraya yapıştırın.
4.  Bilgisayar "Bu dosya zaten var, değiştireyim mi?" diye sorar. **"Evet / Hedefteki dosyayı değiştir"** deyin.

### Adım 3: Kontrol
Sitenizi (Localhost veya index.html) açıp yenileyin (F5). Değişikliklerin geldiğini göreceksiniz.

---

## 5. SORUN GİDERME (SSS)

**S: "Kaydet" dedim ama sitede ürün yok?**
C: Adım 4'ü (Dosyayı İndirip assets/js'ye atma işlemini) yapmadınız. Admin paneli dosyayı otomatik atamaz.

**S: Resim kırık (X) görünüyor?**
C: Admin paneline sadece resmin ismini (örn: `krem.jpg`) yazdınız ama resim dosyasının kendisini `assets/img/cards/` klasörüne koymadınız. Resmi oraya kopyalayın.

**S: Fiyatları toplu gizlemek istiyorum?**
C: **"⚙️ Ayarlar"** sekmesine gelin. "Fiyatları Göster" kutucuğundaki işareti kaldırın. Sonra `settings-data.js` dosyasını indirip sisteme yükleyin. Tüm sitedeki fiyatlar gizlenir.

**S: Siteyi bakıma almak istiyorum?**
C: **"⚙️ Ayarlar"** -> "Bakım Modu"nu açın. Ayar dosyasını yükleyin. Siteye girenler sadece logo görür, içeriği göremez.
