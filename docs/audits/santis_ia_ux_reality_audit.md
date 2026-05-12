# Santis OS IA/UX Reality Audit

## 1. Executive Summary
**Mevcut Durum Analizi:**
Santis Club dijital platformu, teknik olarak "Sovereign OS" (GSAP, Web Workers, Custom Rendering) gibi ileri düzey teknolojilerle donatılmış olsa da, bilgi mimarisi (IA) hala klasik bir **"Envanter Yönetimi"** mantığıyla çalışmaktadır. Site, misafiri bir ritüele davet etmekten ziyade, 118'den fazla hizmetin listelendiği yoğun bir dijital katalog hissi vermektedir.

**Ana Problem:**
"Services" odaklı yapı, kullanıcının sinir sistemini regüle etmek yerine, seçenek çokluğuyla bilişsel yükü artırmaktadır. Lüks segmentteki "Quiet Luxury" algısı, teknik karmaşıklığın altında kalma riski taşımaktadır.

---

## 2. Current Information Architecture Map

- **Giriş Kapısı (Gateway):** `/index.html` - Minimal dil seçim ekranı. Marka deneyimi yerine işlem odaklı bir başlangıç.
- **Navigasyon:** `/tr/index.html`
  - `Ana Sayfa`, `Masajlar`, `Hamam`, `Cilt Bakımı`, `Dünya Ritüeli`, `Galeri`, `İletişim`.
  - Sabit "Rezervasyon" butonu (Altın kontrastlı, yüksek dikkat çekici).
- **Kategori Yapısı:** `assets/data/services.json`
  - `massage`, `ritual-hammam`, `skincare` gibi teknik kategorizasyon.
  - 118+ hizmet, dikey ve hiyerarşik bir listede sunuluyor.
- **CTA Noktaları:** Agresif WhatsApp ve "Hemen Rezervasyon" butonları.
- **Dil Tonu:** "Osmanlı Arınma Sanatı", "Farklı tekniklerin harmanlandığı bütünsel terapi" gibi geleneksel satış dili.

---

## 3. IA Breakpoints (Kırılma Noktaları)

- **Karar Felci:** 118 hizmetin aynı anda sunulması, misafiri deneyimden uzaklaştırıp "en uygun fiyatlı/mantıklı" olanı aramaya itiyor.
- **Fiyatın Erken Görünürlüğü:** Lüks deneyimde fiyat, atmosfer oluştuktan sonra gelmelidir. Mevcut yapıda fiyatlar kategori listelerinde çok erken beliriyor.
- **Teknik Gürültü:** Phase 42-61 arası yüklenen çok sayıda script, "Sessizlik" doktrinine aykırı bir dijital yük oluşturuyor.
- **Kategori Katılığı:** "Hamam" veya "Masaj" gibi başlıklar, misafirin duygusal hedefini (Arınma, Enerji, Sükunet) ıskalıyor.

---

## 4. Emotional State Architecture Proposal

Yeni mimari, misafiri bir "kullanıcı" değil, ritüele hazırlanan bir "misafir" olarak ele alır:

| Aşama | Amaç | Duygu | UI Bileşeni | CTA Dili |
| :--- | :--- | :--- | :--- | :--- |
| **Arrival** | Gürültüden kopuş | Güven, Sessizlik | `HeroAtmosphere` (Slow Reveal) | "Sessizliğe Adım At" |
| **Ritual Worlds** | Dünyaları keşif | Merak, Estetik | `RitualWorldTabs` (Horizontal) | "Keşfet" |
| **Emotional Target** | İhtiyacı belirleme | Anlaşıldığını hissetme | `EmotionalTargetBadge` | "Bu Benim Ritmi" |
| **Atmosphere Note** | Ortamı hissetme | Huzur, Beklenti | `AtmosphereNotePanel` | - |
| **Journey Flow** | Akışı anlama | Kontrol, Rahatlık | `JourneyFlowTimeline` | - |
| **Ritual Tempo** | Zaman algısını yıkma | Zamansızlık | `RitualTempoMeter` | - |
| **Quiet Meta** | Bilgilenme | Şeffaflık | `QuietMetaBlock` | - |
| **Trust Layer** | Teslimiyet | Güven | `TrustLayer` | - |
| **Acceptance Ceremony** | Niyet beyanı | Kararlılık | `AcceptanceCeremonyCTA` | "Akışı Mühürle" |
| **Booking Interface** | Geçiş | Tamamlanmışlık | `BookingGateway` | - |

---

## 5. Ritual Worlds Mapping

| Mevcut Kategori | Yeni Ritüel Dünyası | Duygusal Hedef | Atmosfer Notu | Journey Flow |
| :--- | :--- | :--- | :--- | :--- |
| Turkish Bath | **Heat Purification Ritual** | Arınma, Çözülme | Sıcak mermer, Buhar | Isınma → Kese → Köpük → Sükunet |
| Classic Massage | **Body Recovery Sequences** | Resetleme, Gevşeme | Keten dokusu, Düşük ışık | Karşılama → Terapi → Uyandırma |
| Face Care | **Radiance Renewal Protocols** | Işıltı, Yenilenme | Oksijen, Berraklık | Analiz → Protokol → Koruma |
| Asian Massage | **Eastern Balance Rituals** | Enerji Restorasyonu | Bambu, Zen | Akupresür → Esnetme → Denge |
| Extra & Effective | **Deep Recovery Chambers** | Derin Onarım | Sessizlik, Odak | Teşhis → Müdahale → Onarım |
| Child Care | **Little Stillness Rituals** | Dinginlik | Güven, Oyunsu huzur | Tanışma → Dokunuş → Dinginlik |

---

## 6. Copywriting Transformation (Örnekler)

1. "Services" → "Ritual Worlds"
2. "Book Now" → "Akışı Mühürle"
3. "90 dk masaj" → "90 dakikalık sinir sistemi yenileme yolculuğu"
4. "Fiyat Listesi" → "Değer Manifestosu"
5. "Hamam Programı" → "Sıcaklık ve Arınma Ritüeli"
6. "Cilt Bakımı" → "Işıltı ve Hücresel Canlanma Protokolü"
7. "Hakkımızda" → "Felsefemiz ve Mirasımız"
8. "Galeri" → "Atmosfer Notları"
9. "Rezervasyon Yap" → "Sessizliğini Rezerve Et"
10. "Müşteri Yorumları" → "Deneyim Mirasları"
11. "Masaj Salonu" → "Sükûnet Odası"
12. "Klasik Masaj" → "Beden Yenileme Sekansı"
13. "Kese Köpük" → "Geleneksel Arınma Dansı"
14. "VIP Suit" → "Sovereign Sanctuary"
15. "Kampanya" → "Mevsimsel Davet"
16. "İletişim" → "Kişisel Rehberiniz"
17. "Ekibimiz" → "Ritüel Uzmanları"
18. "Paketler" → "Bütünsel Yolculuklar"
19. "Ürünler" → "Ev Ritüelleri"
20. "Giriş" → "Eşik"

---

## 7. Component Architecture Plan

- **HeroAtmosphere:** (`HeroAtmosphere.js`) - GSAP tabanlı, %0'dan %100'e yavaşça süzülen atmosferik giriş.
- **RitualWorldTabs:** (`RitualWorldTabs.js`) - Kategori yerine "Dünyaları" yatay bir akışta sunan bileşen.
- **EmotionalTargetBadge:** (`MoodBadge.js`) - Misafirin moduna göre (Stress, Fatigue, Glow) filtreleme yapan badge sistemi.
- **JourneyFlowTimeline:** (`RitualTimeline.js`) - Deneyimin adımlarını zaman çizelgesi yerine "his çizelgesi" olarak sunan bileşen.
- **RitualTempoMeter:** (`TempoIndicator.js`) - Ritüelin yoğunluğunu (Slow, Deep, Active) belirten görsel metere.
- **AcceptanceCeremonyCTA:** (`RitualSeal.js`) - Klasik buton yerine, dokunulduğunda "mühürleme" animasyonu yapan özel CTA.

---

## 8. Nervous System Safe UI Checklist

- [x] **Slow Reveal:** İçerik aniden patlamamalı, süzülerek gelmeli.
- [x] **Negative Space:** Bilişsel yükü azaltmak için geniş boşluklar.
- [x] **No Urgency:** "Son 3 koltuk" gibi baskıcı ifadeler yasak.
- [x] **User-Controlled Media:** Otomatik oynayan ses/video (atmosfer hariç) yasak.
- [x] **Quiet Contrast:** Gözü yormayan, düşük doygunluklu renk paleti.

---

## 9. Technical Debt & Performance Notes

- **Data Chunking:** `services.json` (196KB) dosyasının tamamı her sayfada yükleniyor. Kategori bazlı asenkron yükleme (Dynamic Import) şart.
- **Script Consolidation:** Birbiriyle çakışan veya benzer işi yapan 20'den fazla script (`Phase` tabanlı) tek bir `SantisOS-Core` altında toplanmalı.
- **CLS Management:** Font yükleme stratejisi (`Cinzel`) optimize edilmeli; içerik kaymaları lüks algısını bozuyor.

---

## 10. Implementation Roadmap

- **Phase 0 — Reality Lock:** Mevcut verinin dondurulması ve yeni mimari sözleşmesinin imzalanması.
- **Phase 1 — IA Refactor Plan:** Sayfaların ve kategorilerin "Ritual Worlds" mantığına göre fiziksel/mantıksal haritalanması.
- **Phase 2 — Content System:** Tüm metinlerin (copywriting) yeni dile çevrilmesi.
- **Phase 3 — Component Design:** Yeni "Emotional UI" bileşenlerinin prototiplenmesi.
- **Phase 4 — Static Prototype:** Mevcut stack içinde düşük riskli bir sayfanın (Örn: `/tr/rituals/index.html`) dönüşümü.

---

## 11. Files To Inspect

- `assets/data/services.json` (Kritik: Veri yapısı değişmeli)
- `assets/data/menu.json` (Kritik: Navigasyon dili değişmeli)
- `assets/js/santis-data-bridge.js` (Kritik: Veri dağıtım mantığı değişmeli)
- `tr/index.html` (Görsel hiyerarşi kontrolü)
- `assets/js/app.js` (Core logic temizliği)

---

## 12. Do Not Touch List

- `santis-stripe.js` (Ödeme sistemleri)
- `backend/` (Sunucu tarafı işlemler)
- `auth/` (Kullanıcı kimlik doğrulama)
- `docs/governance/` (Yönetişim kuralları)

---

## 13. Final Recommendation

**En Net Öneri:**
Değişime koddan değil, **veriden** başlanmalıdır. `assets/data/menu.json` ve `assets/data/services.json` dosyalarındaki isimlendirme ve hiyerarşi "Ritüel Dünyaları" felsefesine göre güncellendiğinde, sistemin geri kalanı (DataBridge sayesinde) bu yeni dili otomatik olarak devralacaktır. Bu, Phase 0 için en güvenli ve en yüksek etkili eylemdir.

---
**Next Safe Action:**
`assets/data/menu.json` dosyasındaki "Default" intent navigasyon etiketlerini yeni "Quiet Luxury" terimleriyle güncellemek.

**Risk Sınıfı:** LOW (Data-only change)
