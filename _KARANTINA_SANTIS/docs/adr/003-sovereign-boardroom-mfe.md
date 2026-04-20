# ADR-003: Sovereign Boardroom MFE (Distributed Cognitive Admin OS) Mimari Karar Kaydı

**Tarih:** 2026-03-30  
**Durum:** Kabul Edildi (Accepted) & Yetkilendirme Verildi (Military-Grade)

## Bağlam ve Sorun
Mevcut Santis yönetici paneli (Admin Boardroom), 24 farklı parçadan oluşan devasa ve bakımı zor bir legacy (monolitik) yapıya dönüşmüştü. Boka Körfezi operasyon sahasının zorlu ağ koşulları göz önüne alındığında, sistemin çökmesini engellemek ve "Power User" deneyimini Sıfır Sürtünme (Zero Friction) seviyesine taşımak için mimaride köklü bir "Askeri-Sınıf" (Military-Grade) yükseltmeye ihtiyaç duyulmuştur.

## Karar (Architecture Realization)
Eski "Spagetti" Monolit çöpe atılarak, Webpack 5 Module Federation temelli "Sovereign Boardroom" App Shell mimarisine geçilecektir. Sistem, 4 ayaklı bir "Kusursuz Savunma & Dayanıklılık" zırhı giyecektir:

### 1. Zero Trust & CSP (Savunma Derinliği)
- **Whitelisting & Inline Ban:** `Content-Security-Policy: script-src 'self' 'nonce-<dynamic>'` kullanılarak, inline betikler infaz edilecek ve her Remote Module (Uzak Modül) izole bir kapsam (Scope) içinde denetlenecektir.
- **Remote Signature Verification:** Uzak dosyalar (RemoteEntry.js) hash doğrulamasına tabi tutulacak, Supply Chain saldırılarına karşı modül bozulursa (tampered) sistem o modülü otomatik kilitleyecektir (Kill Switch).
- **Token Scope Isolation:** "God Mode" gibi paneller kısa ömürlü (ephemeral) Token'lar kullanacak, hiçbir Token global seviyeye salınmayacaktır (Sandbox Pollution yasaktır).

### 2. Event Bus Testing & Canary Release (Taktiksel Geri Çekilme)
- **Schema Validation & Replay:** Olay Veri Yolundan (Event Bus) akan veriler Versiyonlu JSON şemalarıyla (örn. `"version": "v2"`) zorlanacaktır. Üretim hataları Deterministic Event Replay ile debug edilecektir.
- **Shadow Mode:** Operasyonel paneller 'Big Bang' usulü kullanılmayacak; Feature Flags (Özellik Bayrakları) ile küçük yönetici gruplarında test edildikten sonra açılacaktır. Kanaryalar tünelden sağ çıkmadan ana kafile yürümez!

### 3. Intent-Driven UX & Telemetry (Head-Up Display)
- **Command Palette (CTRL+K):** Menü labirentlerini yok etmek için MacBook Spotlight tarzı bir Komuta Paleti oluşturulacaktır. Bu sistem sadece "arama" yapmaz, Niyet Motoruna (Intent Engine) bağlıdır (örn: `Ahmet hesabı iptal et` ➔ `USER_CANCEL`).
- **DevTools Overlay:** Arayüzün sağ köşesinde yöneticinin FPS, WebSocket gecikmesi, Ağ Jitteri ve RAM kullanımını canlı göreceği bir HUD (Head-Up Display) şablonu çalışacaktır.

### 4. Boka Biyosferi: Service Worker Çevrimdışı Desteği (Resilience)
- **Module Versioning:** `cacheKey = ${moduleName}@${version}` mantığıyla SW cache kabusu (Version Mismatch) engellenecektir.
- **Offline Writes:** Ağ koptuğunda sistem çökmez; Otonom "Read-Only" moduna geçer ve "Write" (Yazma) işlemleri ağ geri gelene kadar bir Kuyrukta (Queue) senkronizasyon bekler.
- **Webpack Magic:** Remote Module'ler tarayıcı tarafında idle (boş) anlarda `<link rel="prefetch">` ile önden yüklenerek arayüz gecikmesi sıfırlanacaktır.

## Sonuçlar (Consequences)
Bu mimari bizi sadece "İyi Bir Panelden", kendi kendine düşünen ve savunan **Distributed Cognitive Admin OS** seviyesine çıkarma garantisi sunmaktadır. Çapraz modül bozulmaları engellenmiş, saldırı yüzeyi daraltılmış, performans ise uca (Edge) optimize edilmiştir. 🚀
