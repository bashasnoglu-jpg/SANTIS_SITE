# Ritual Worlds Data Model v1

## 1. Purpose
Santis OS "Ritual Worlds" (Ritüel Dünyaları) veri modeli, mevcut işlemsel hizmet kataloğunu (`services.json`) duygusal ve deneyimsel bir katmanla sarmalamak için tasarlanmıştır. Bu model, misafire sadece bir "hizmet" değil, bir "içsel yolculuk" sunmayı hedefler.

## 2. Non-Breaking Principle
Mevcut `services.json` yapısı, Bento Grid ve Web Worker motorları tarafından doğrudan tüketilmektedir. Bu yapıyı bozmamak adına:
- Yeni veri modeli **ayrı bir dosya** (`assets/data/ritual-worlds.json`) olarak tutulacaktır.
- `services.json` içindeki servisler, `sourceServiceIds` veya `categoryId` üzerinden bu yeni modele bağlanacaktır.
- Mevcut sistem ritüel verisini görmese bile çalışmaya devam edecektir (Graceful Degradation).

## 3. Proposed Schema
Önerilen `ritual-worlds.json` yapısı:

```json
{
  "version": "1.0.0",
  "ritualWorlds": [
    {
      "id": "body-recovery",
      "slug": "body-recovery-sequences",
      "title": {
        "tr": "Body Recovery Sequences",
        "en": "Body Recovery Sequences"
      },
      "emotionalTarget": {
        "tr": "Yeniden Doğuş & Onarım",
        "en": "Rebirth & Recovery"
      },
      "atmosphereNote": {
        "tr": "Düşük ışık, sedir ağacı kokusu, derin bas frekanslar.",
        "en": "Low light, cedarwood scent, deep bass frequencies."
      },
      "journeyFlow": [
        { "step": "Arrival", "label": { "tr": "Eşik", "en": "Threshold" } },
        { "step": "Sequence", "label": { "tr": "Sekans", "en": "Sequence" } },
        { "step": "Integration", "label": { "tr": "Bütünleşme", "en": "Integration" } }
      ],
      "ritualTempo": {
        "entry": "slow",
        "intensity": "medium-high",
        "return": "soft"
      },
      "quietMeta": {
        "silenceLevel": "absolute",
        "interactionType": "minimal-verbal"
      },
      "acceptanceCeremony": {
        "tr": "Sessizlik mühürlenir, beden teslim edilir.",
        "en": "Silence is sealed, the body is surrendered."
      },
      "contraindications": {
        "tr": "Yüksek tansiyon, kalp rahatsızlıkları.",
        "en": "High blood pressure, heart conditions."
      },
      "sourceCategoryIds": ["massages", "physio"],
      "displayPriority": 10
    }
  ]
}
```

## 4. Ritual World Object Fields

| Field | Description | Type |
| :--- | :--- | :--- |
| `id` | Ritüel dünyasının benzersiz anahtarı. | `String` |
| `slug` | URL ve navigasyon için kullanılan sadeleştirilmiş isim. | `String` |
| `emotionalTarget` | Misafirin ulaşması beklenen duygusal durum. | `Object (i18n)` |
| `atmosphereNote` | Ortamın duyusal tasviri (Işık, Koku, Ses). | `Object (i18n)` |
| `journeyFlow` | Deneyimin aşamaları (Flow state adımları). | `Array` |
| `ritualTempo` | Deneyimin ritmi ve yoğunluk eğrisi (entry/intensity/return). | `Object` |
| `quietMeta` | Sessizlik ve etkileşim seviyesi protokolü. | `Object` |
| `acceptanceCeremony` | Rezervasyon/Giriş anındaki ritüel dili. | `Object (i18n)` |
| `contraindications` | Güvenlik notları ve ritüele engel durumlar. | `Object (i18n)` |
| `sourceCategoryIds` | Bu dünyaya bağlı kategori ID'leri. | `Array` |
| `sourceServiceIds` | Bu dünyaya bağlı spesifik hizmet ID'leri (Opsiyonel). | `Array` |
| `displayPriority` | UI üzerindeki sıralama önceliği. | `Integer` |

## 5. Mapping Strategy
Mevcut kategori yapısı aşağıdaki şekilde "Ritüel Dünyaları"na map edilecektir:
- `massages` → `Body Recovery Sequences`
- `hammam` → `Heat Purification Rituals`
- `skincare` → `Radiance Renewal Protocols`
- `rituals` → `Global Ritual Mastery`

## 6. Backward Compatibility
- **Bento Grid:** Mevcut render motoru `services.json` okumaya devam eder. Yeni UI katmanı, grid üzerine "Emotional Overlay" olarak eklenir.
- **Worker:** Veri filtreleme hala `categoryId` üzerinden yapılır.
- **Nav:** `santis-nav.js` yeni `ritualWorld` slug'larını kullanmaya başlar ancak eski yollar yedek olarak tutulur.

## 7. Migration Plan
- **Phase 2.1:** `ritual-worlds.json` dosyasının oluşturulması ve statik olarak okunması.
- **Phase 2.2:** `santis-data-bridge.js` üzerinden servislerin ritüel dünyalarıyla eşleştirilmesi (Client-side join).
- **Phase 2.3:** UI üzerinde "Atmosphere Note" ve "Emotional Target" alanlarının Slow Reveal ile gösterilmesi.

## 8. Do Not Touch
- `assets/data/services.json` (Fiyat ve teknik tanım katmanı).
- `santis-filter-worker.js` (Filtreleme mantığı).
- `santis-bootloader.js` (Sistem çekirdeği).

## 9. Next Safe Action
`assets/data/ritual-worlds.json` dosyasının taslak (mock) verilerle oluşturulması ve `santis-data-bridge.js` üzerinden bu veriye erişim yeteneğinin test edilmesi (window.SantisRitualWorlds üzerinden).
