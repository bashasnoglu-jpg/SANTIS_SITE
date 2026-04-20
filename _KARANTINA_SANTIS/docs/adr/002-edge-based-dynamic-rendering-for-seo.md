# ADR 002: Sovereign OS SEO İzolasyonu (Edge-Based Dynamic Rendering)

**Tarih:** 30 Mart 2026  
**Durum:** Onaylandı (APPROVED - V2 Production Conditions)  
**Bağlam:** SANTIS_SITE (Sovereign OS V18.1)

## Etkilenen Sistem Parçası (Context)
Sovereign OS altyapısındaki "Kuantum Yönlendirici" (SPA), arayüzü JavaScript tabanlı View Transitions ile anlık olarak oluşturmaktadır. Bu "Sıfır-Yükleme" stratejisi lüks müşteri deneyimi için kusursuz olsa da, GoogleBot, Bingbot ve diğer arama motoru örümcekleri (crawlers) için ciddi bir görünürlük duvarı (Opaque Wall) oluşturmaktadır. Tarayıcı botları siteye geldiğinde yalnızca içi boş bir `<main id="santis-main"></main>` kabuğuyla karşılaşmakta, JavaScript motorunun içeriği oluşturmasını beklemekte başarısız olmakta ve sitenin zengin editoryal içeriklerini (Hizmetler, Lüks Ritüeller, Blog) dizine ekleyememektedir (Indexation Failure).

Sistemi Next.js gibi ağır bir Server-Side Rendering (SSR) çatısına geçirmek, sistemin sahip olduğu P2P WebSocket ve donanım hızlandırmalı otonom yapısını yerle bir edecektir.

## Karar (Decision)
Arama motoru botaniklerini (crawler) insan kullanıcılardan izole etmek ve sistem hiyerarşisini Edge katmanına doğru genişletmek için **Sovereign Edge SEO Mimarisi (Adaptive Pre-Render)** inşa edilmesine karar verilmiştir. Bu geçişle birlikte "Mini-ERP" düzeyindeki sistem, "Cognitive OS" (Kognitif Platform) düzeyine ulaşacaktır.

Karşılanacak 4 Temel Edge Prensibi şunlardır:

### 1. Predictive Bot Detection & Origin Proxy
- Edge Worker (`santis_edge_worker.js`) botları yalnızca `User-Agent` ile değil, modern headless tarayıcı spoofing'ine karşı **Behavioral Heuristics** (`sec-ch-ua-platform === null` ve `sec-fetch-mode` yokluğu) ile donatılacak.
- **Bot Trafiği:** Saptandığında trafik, %100 uyuşan (Cloaking reddi) statik Prerender servisine Proxy'lenecek.
- **İnsan Kullanıcı:** Standart SPA (Cognitive Router) ve WS ile hidratize (hydration) edilen ana akışa aktarılacak.

### 2. State Tiering (WS-Aware Hydration)
- İnsan ziyaretçilere sunulan `index.html` yanıtına, Edge seviyesinde `<script>window.__SOVEREIGN_STATE__</script>` bloğu enjekte edilecek. Ancak stale (bayat) state verilerine karşı durum **katmanlı** hale getirilecek:
  ```json
  {
      "edge": { "ts": 1710000000, "cache": true },
      "session": null,
      "wsSeed": "channel-uuid"
  }
  ```
- Kuantum Yönlendirici (SPA), sunucuya WS ile bağlandığında bu `edge.ts` bilgisini delta (fark) olarak sunucuya raporlayacak (`EDGE_SYNC`). Çoklu sekme state conflict riski bertaraf edilecek.

### 3. Intent Matrix Engine (Dinamik Politika)
- SEO, URL rotasının amacına göre statikleştirilebilir bir Obje (Dictionary) olarak yönetilecek:
  - `ROUTE_INTENTS = { '/tr/services': { seo: true, prerender: true }, '/admin': { seo: false, block: true } }`
  - Bu yapı, gelecekte kognitif öğrenme (Predictive Pre-Render) yetenekleri eklendiğinde AI'ın en çok gezilen rotaları tahminleyerek dinamik prerender yapabilmesine izin verecektir.

### 4. Neural Cache Invalidation & Edge Cache Sınırları
- Origin Node (Backend) içerik veritabanını güncellediği anda `POST /edge/purge` tetiklenecektir.
- Kaba kuvvet (Full Wipe) yerine, `Cache-Tag` temelli bölgesel invalide işlemi yapılacak. HTML / İnsan istekleri `stale-while-revalidate` sınırlarında tutulurken WS Live akışı kesinlikle by-pass edilecektir.

## Sonuçlar (Consequences)
**Olumlu (Positive):**
* **SEO & Görünürlük:** Modern SPA'ların en büyük handikapı olan körlük aşılacak, %100 schema/indexation oranına ulaşılacak.
* **Sunucu İzolasyonu:** Origin (Master Node), botların bitmek bilmeyen tarama (crawl) yükünden kurtulacak.
* **State Devamlılığı:** Reconnect (sayfa yenileme) esnasında Edge'in bastığı `__SOVEREIGN_STATE__` sayesinde UI hiçbir zaman state (durum) kaybı veya flash (sıfırlanma) yaşamayacak.

**Olumsuz / Riskler (Negative/Risks) & Üretim Çözümleri:**
* **Cloaking Riski (SEO Ban Tehlikesi):** Prerender çıktısı HTML ile SPA sonrası DOM içeriği %1 oranında bile farklı olursa, Google tarafından "User'a başka bota başka sayfa gösteriyor" gerekçesiyle cezalandırma riski. **(Çözüm: Deterministic Rendering. Hydration anında birebir aynı data snapshot (edge) ile SPA tetiklenecek, UI farkı sıfır olacak.)**
* **Hydration Mismatch:** VDOM veya SPA motoru ilk bağlandığında farklı snapshot bulursa patlar. **(Çözüm: Edge State Tiering sayesinde zaman kayması çözülmüştür.)**
* **Cache Invalidation Çıkmazı:** İçerik güncellenince Edge'de (Cloudflare) eski kopyanın kalması riski. **(Çözüm: Origin'den `POST /edge/purge` tetiklenerek anlık wiping sağlanacaktır.)**
* **Vendor Lock-in:** Mimarinin doğrudan Cloudflare `HTMLRewriter` ve KV depolarına bağımlı hale gelmesi. **(Çözüm: Worker kodlaması mümkün olduğunca Service Worker standart API'leri ve Streams ile platform bağımsız olacak, Fastly/Vercel Edge desteği fallback olarak düşünülmüştür.)**
