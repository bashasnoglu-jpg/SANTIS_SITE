# Ritual Worlds Loader Plan v1

## 1. Overview
`Ritual Worlds Loader`, Santis OS'in işlemsel (transactional) yapısı ile duygusal (emotional) katmanı arasındaki veri köprüsünü kuran asenkron modüldür. Bu modül, `ritual-worlds.json` dosyasını güvenli bir şekilde yükleyerek, UI bileşenlerine Ritüel Dünyası metadata'sını sunar.

## 2. Design Principles (Quiet Luxury Logic)
- **Lazy Loading / On-Demand:** Duygusal veriler, sistem bootloader'ı ana kataloğu mühürledikten sonra asenkron olarak yüklenir.
- **Resilience:** JSON dosyası yüklenemezse (404/Timeout), sistem klasik servis listesi moduna "Graceful Fallback" yapar.
- **Event-Driven:** Veri hazır olduğunda `santis:rituals:ready` sinyali fırlatılarak diğer modüllerin (Bridge, UI, Bento) bu veriyi tüketmesi sağlanır.
- **Immutability:** Yüklenen veri `window.SantisRituals.state` altında sadece-okunur (read-only) niyetle tutulur.

## 3. Loading Sequence (Phase 2.2 Orchestration)
1.  `santis-bootloader.js` kernel'i başlatır.
2.  `santis-data-bridge.js` ana `services.json` kataloğunu yükler.
3.  `ritual-worlds-loader.js` (Phase 2.2) devreye girer:
    - `assets/data/ritual-worlds.json` asenkron çekilir.
    - Şema doğrulaması (schemaVersion, status) yapılır.
    - Global Singleton `window.SantisRituals` üzerinden erişime açılır.
4.  UI Orchestrator, Bento Grid render edilirken `getRitualByServiceCategory()` metodunu kullanarak duygusal metinleri UI'a basar.

## 4. Integration Points

### 4.1. Data Bridge Connection
`santis-data-bridge.js` içindeki `hydratePDP` metodu, servis ID'sine göre ilgili Ritüel Dünyası metadata'sını (Atmosphere Note, Journey Flow) bu loader üzerinden çekecektir.

### 4.2. Bento Grid Overlay
Bento Grid hücreleri, kategori eşleşmesine göre `displayTitle` ve `emotionalTarget` verilerini kullanarak "Quick Reveal" animasyonlarını tetikleyecektir.

## 5. Risk Mitigation
- **Drift Protection:** Navigasyon etiketleri ile JSON `displayTitle` alanları uyuşmazsa konsola `Goverance_Warning` basılır.
- **Cache Poisoning:** Fetch isteği `?v={timestamp}` parametresi ile yapılarak tarayıcı önbelleği (cache) bypass edilir.

## 6. Implementation Stages
- **Phase 2.2.a:** Loader modülünün sisteme statik script olarak eklenmesi.
- **Phase 2.2.b:** `santis:rituals:ready` event'inin `data-bridge` tarafından dinlenmesi.
- **Phase 2.2.c:** Smoke Test (Konsol üzerinden `window.SantisRitualWorlds.getWorld('body-recovery')` çağrısı).

## 7. Future Considerations
- **Live Evolution:** Admin paneli üzerinden Ritüel Dünyalarının dinamik olarak güncellenmesi (Refresh metodu desteği).
- **Localization:** Rusça, Almanca ve Arapça çeviri katmanlarının asenkron olarak bu modele enjekte edilmesi.
