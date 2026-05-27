# SANTIS OS - Admin Route Inventory

## 1. Public Pages
- `/index.html` (Ana giriş)
- `/spa-booking.html` (Rezervasyon Arayüzü)
- `/spa-menu.html` (Menü)
- `/katalog.html` (Katalog)
- `/rezervasyon.html` (Alternatif/Eski rezervasyon)
- `/hakkimizda.html`
- `/iletisim.html`
- `/magaza.html`
- `/checkout.html`, `/checkout-success.html`
- `/3d-lab.html`
- `/archive/` ve `_deploy_stage/` altındaki geçmiş/yedek dosyalar

## 2. Admin Pages
- `/admin-dashboard.html` (Ana Dashboard)
- `/hq-dashboard.html` (HQ Yönetimi)
- `/sovereign-terminal.html` (Sovereign Terminal Arayüzü)
- `/sovereign-ui-lab.html` (UI/UX Lab)
- `/santis-world.html` (Santis World Paneli)
- `/admin/index.html` (React tabanlı Vercel admin paneli - `admin-panel/`'den kopyalanıyor)

## 3. API Endpoints
- `POST /api/v1/availability` (Müsaitlik Kontrolü)
- `POST /api/v1/checkout-session` (Ödeme Başlatma)
- `POST /api/v1/whisper` (Aurelia Whisper - AI Asistan)
- `GET  /api/v1/health` (Sağlık Kontrolü - Sovereign Memory ve api/index.py üzerinden)
- `GET  /api/v1/nodes` (Hafıza Düğümleri)
- `GET  /api/v1/nodes/{date}` (Spesifik Hafıza Düğümü)
- `POST /api/v1/scheduling/booking/hold` (Rezervasyon Hold)
- `POST /api/v1/telemetry/beacon` (Telemetri / Analytics)

## 4. Internal JS Modules & Links Usage
- `assets/js/core/santis-core.js`, `santis-auth.js` gibi modüllerde token ve yönlendirmeler bulunuyor.
- JS tarafındaki yönlendirmelerde (`window.location.href`) genellikle statik stringler kullanılmış.
- Çoğu sayfa kendi içindeki menülerde statik `<a href="/...">` yönlendirmelerine sahip. 

## 5. Broken Links / Missing Files
- **KRİTİK UYARI:** `app/main.py` dosyasında (local sunucu entrypoint'i) `scheduling.py` router'ı **import edilmemiş/bağlanmamış**. Ancak Vercel production ortamını çalıştıran `api/index.py` içerisinde `scheduling` route'u mevcut. (Local ortamda `/api/v1/scheduling/booking/hold` çalışmayacaktır).
- Benzer şekilde `telemetry` route'u `app/main.py`'de `/api/v1/telemetry` prefix'iyle var, fakat `api/index.py`'de eksik! 

## 6. Hardcoded URLs
- Front-end kodlarında base URL için çeşitli config objeleri (veya hardcoded Vercel preview domain'leri) olabiliyor, bu da environment/staging bağımsızlığını kısıtlıyor.

## 7. Recommended Route Registry Design
Minimal Patch için:
1. `assets/js/admin-route-registry.js` adında merkezi bir JSON obje yapısı oluşturulacak.
2. Bu obje `PUBLIC_ROUTES`, `ADMIN_ROUTES` ve `API_ENDPOINTS` olarak yapılandırılacak. Bütün linkler local path (`/path.html`) formatında tutulacak.
3. `admin-dashboard.html` içerisine "Admin Route Console" adında bir UI bileşeni eklenecek, bu bileşen registry üzerinden dinamik yüklenerek linkleri listeleyecek. Bu sayede hiçbir Vercel veya local URL hardcode kalmamış olacak.
