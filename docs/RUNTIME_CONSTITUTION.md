# SOVEREIGN RUNTIME CONSTITUTION

## 1. Topoloji (Topology)
Santis OS, deterministik ve olay odaklı (event-driven) bir mimari üzerinde çalışır. Monolitik yapı (server.js) tamamen kullanımdan kaldırılmıştır (DEPRECATED).

Mevcut Aktif Çalışma Zamanı (Runtime) Dağılımı:

- **Canonical Backend (HTTP API):** `apps/ingestion-api`
  - **Port:** `3030`
  - **Sorumluluk:** Core-state, telemetry, auth (mock), ve projeksiyon hizmetleri.
  
- **Sovereign Gateway (WebSocket):** `apps/ingestion-api` (Gateway Modülü)
  - **Port:** `8080`
  - **Sorumluluk:** Olay dinleme (event store), gerçek zamanlı State Hydration, telemetry yayınları.

- **Frontend (Admin Panel):** `admin-panel` (Vite)
  - **Port:** `5173`
  - **Sorumluluk:** Kullanıcı arayüzü, telemetry olaylarını yayınlama, WebSocket üzerinden gerçek zamanlı izleme. Backend olarak `3030` proxy hedefini kullanır.

- **Orbital Forge (Opsiyonel Servis):** `server/santis-orbital-forge.mjs`
  - **Port:** `5050`
  - **Sorumluluk:** Medya işlemleri ve upload mekanizması.

## 2. Süreç Yönetimi (Process Supervision)
Tüm servisler `START_FULL_STACK.bat` üzerinden tetiklenen `dev-control-layer.js` ile yönetilmelidir.
- Bu dosya (supervisor), süreçlerin çökme durumlarında (Zombie processes) ilgili portları (3030, 8080, 5050, 5173) otomatik olarak temizler.
- Eski nesil `node server.js` komutu kesinlikle çalıştırılmamalıdır. (İçerisinde bir "Kill Switch" barındırır ve çalışmayı anında reddeder).

## 3. Olay Akışı (Event Flow)
1. **İstemci (Client):** Vite üzerinden bir eylem gerçekleştirir (Örn. Route Change, Boardroom Action).
2. **HTTP API (3030):** Statik veya durumsal sorgular `3030` portundan ingestion-api'ye düşer.
3. **WebSocket (8080):** Olaylar (Events) `8080` portu üzerinden yayınlanır. Akış (Stream) sürekliliği buradan sağlanır.
4. **Event Store:** Olaylar kronolojik olarak kaydedilir ve sistemdeki Projeksiyonlar (Projections) bu olayları işleyerek güncel durumu oluşturur.

## 4. Karar Kanalı (Decision Channel) v1
Boardroom önerir. Operator mühürler. Backend doğrular. WebSocket ilan eder. UI sadece gösterir.
