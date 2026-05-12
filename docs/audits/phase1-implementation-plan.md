# Santis OS - Phase 1: Ritual Worlds Implementation Plan

Bu plan, IA/UX Audit raporunda belirlenen "Ritüel Dünyaları" dönüşümünün ilk fazı olan veri ve dil katmanı güncellemelerini kapsamaktadır.

---

## 1. Data Layer: `assets/data/menu.json`
Mevcut hiyerarşi, kullanıcıyı bir "ürün seçmeye" zorlayan kategorik dilden, "deneyim keşfine" davet eden ritüel diline evrilecektir.

**Güncelleme Matrisi (Default Intent):**
- `Masajlar` → `Body Recovery Sequences`
- `Hamam` → `Heat Purification Rituals`
- `Cilt Bakımı` → `Radiance Renewal Protocols`
- `Dünya Ritüeli` → `Global Ritual Mastery`
- `Rezervasyon` → `Akışı Mühürle` (CTA)
- `Galeri` → `Atmosfer Notları`

---

## 2. Logic Layer: `assets/js/santis-nav.js`
Navigation Engine, yeni "Ritual Worlds" mimarisini destekleyecek şekilde güncellenecektir.

**Teknik Değişiklikler:**
- `buildSovereignNav` fonksiyonu, `menu.json` içerisindeki yeni etiketleri (labels) kullanarak DOM'u asenkron olarak inşa edecektir.
- `nav-link` sınıflarına `ritual-trigger` gibi yeni "Quiet Luxury" animasyon tetikleyicileri eklenecektir.
- Mega Menu (`mega-services`) içeriği, kategori listesi yerine "Ritüel Portalları" şeklinde asimetrik bir grid yapısına kavuşturulacaktır.

---

## 3. Visual Scene: `index.html` (Hero & Flow)
Ana sayfa akışı, misafiri kademeli bir sükunete (Slow Reveal) hazırlayacak şekilde yeniden yapılandırılacaktır.

**Hero Section Değişimi:**
- **Eski Başlık:** "Antalya'nın En İyi Spa ve Wellness Merkezi" (İddialı/Gürültülü)
- **Yeni Başlık:** "Antalya'nın Sükûnet Kapısı: Ruhun ve Bedenin Arınma Ritüeli" (Kapsayıcı/Sakin)
- **Hero CTA:** "Hemen Keşfet" → "Sessizliğe Adım At"

**Flow Değişimi:**
1. **Arrival:** Sadece atmosferik video ve derin sükunet başlığı.
2. **Ritual Worlds (Grid):** "Signature Experiences" yerine, dünyalar arası geçiş sunan geniş kartlı bir grid.
3. **Atmosphere Note:** Kısa, poetik bir metin bloğu (Quiet Meta).

---

## 4. Component: Hizmet Kategori Blokları
Mevcut "Hizmet Kartları" (Bento Grid), "Deneyim Portallarına" dönüşecektir.

**Tasarım Prensipleri:**
- **Visual Silence:** Kartlardaki yoğun metinler kaldırılarak, sadece "Ritüel Adı" ve "Duygusal Hedef" (Örn: *Detoks & Arınma*) bırakılacaktır.
- **Price Management:** Liste görünümlerinde fiyatlar kaldırılacak; fiyat sadece "Quiet Meta" katmanında (Detay sayfasında) süzülerek görünecektir.
- **Image Treatment:** Fotoğraflar üzerinde düşük doygunluklu (Low Saturation) warm-gray filtreler uygulanacaktır.

---

## 5. Linguistics: CTA (Call to Action) Dili
Tüm etkileşim noktaları, misafiri bir "niyet beyanına" davet edecek şekilde güncellenecektir.

- **Eski:** "Hemen Randevu Al" → **Yeni:** "Ritüeli Başlat"
- **Eski:** "Fiyatları Gör" → **Yeni:** "Değer Manifestosunu İncele"
- **Eski:** "WhatsApp'tan Yaz" → **Yeni:** "Rehberinizle İletişime Geçin"
- **Eski:** "Sepete Ekle" → **Yeni:** "Deneyimi Rezerve Et"

---

## 6. Ceremony: Booking Geçiş Dili
Rezervasyon ekranı bir form değil, bir "Kabul Töreni" (Acceptance Ceremony) olarak konumlandırılacaktır.

**Geçiş Deneyimi:**
- Misafir "Akışı Mühürle" butonuna tıkladığında, ekran aniden değişmek yerine yavaşça kararıp (Fade to Black), sükuneti bozmayan minimal bir takvim paneli açılacaktır.
- **Booking Başlığı:** "Rezervasyon Formu" → "Santis Arınma Ritüeli Kabulü"
- **Onay Butonu:** "Rezervasyonu Onayla" → "Akışı Mühürle"

---

## 7. Next Steps (Uygulama Sırası)

1. **Adım 1:** `assets/data/menu.json` dosyasının güncellenmesi (Düşük risk).
2. **Adım 2:** `tr/index.html` üzerindeki metinlerin "Quiet Luxury" tonuna çevrilmesi.
3. **Adım 3:** `santis-nav.js` içindeki fallback manifestin yeni yapıya uyumlu hale getirilmesi.
4. **Adım 4:** Görsel bileşenlerin (Bento Grid) CSS bazlı stil güncellemeleri.

---
**Plan Onay Durumu:** Beklemede (Kullanıcı onayı gereklidir)
*Lead IA Architect: Santis OS*
