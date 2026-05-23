# Phase J-W1 — Boardroom Audit Log Admin Read UX

Bu plan, Boardroom yöneticilerine yönelik Audit Log okuma arayüzünü (UX/UI) Vanilla JS ve CSS ile geliştirmeyi amaçlar.

## Open Questions
- **Page vs Tab**: Audit log arayüzünü mevcut `boardroom.html` içine yeni bir sekme (tab) olarak mı ekleyelim, yoksa `audit-logs.html` adında yeni bir sayfa mı oluşturalım? Ayrı bir sayfa ve ayrı bir `audit-logs-engine.js` scripti, kod karmaşasını önlemek adına tavsiye edilir. Planda ayrı bir sayfa varsayılmıştır.
- **Payload Drawer vs Modal**: Detaylara tıklandığında sağdan açılan bir Drawer (Slide-out panel) mi tercih edersiniz, yoksa ortada beliren bir Modal mı? Drawer, akışı bozmadığı için Audit log incelemelerinde genelde daha iyidir.

## Proposed Changes

### 1. Navigation & Layout
- `public/admin/boardroom.html` içerisine bir navigasyon (Sidebar veya Header linkleri) eklenerek "Dashboard" ve "Audit Logs" sayfaları arası geçiş sağlanacak.

### 2. [NEW] `public/admin/audit-logs.html`
- Temel "Quiet Luxury / Cyberpunk" stili (`boardroom.html`'deki CSS değişkenleri ve yapı) korunacak.
- **Filter Bar**: 
  - `event` (Dropdown: auth.login, tenant.updated vs)
  - `actorType` (Dropdown: user, system, service, webhook)
  - `source` (Dropdown: api, admin, system, worker, webhook)
  - `startDate`, `endDate` (Date picker)
  - "Filtrele" ve "Temizle" butonları.
- **Data Table / Timeline**:
  - Kolonlar: Timestamp, Event, Actor, Source, IP, Actions (Inspect)
- **Pagination Controls**:
  - Toplam kayıt sayısı (Örn: "Total: 1250 logs")
  - Previous / Next butonları ve sayfa numarası.
- **Payload Detail Drawer**:
  - Sağ taraftan kayarak açılan gizli bir div. İçerisinde `<pre><code>` formatında seçilen kaydın tam JSON payload'u, User Agent bilgileri vs. listelenecek.

### 3. [NEW] `public/admin/js/audit-logs-engine.js`
- Sayfa yüklendiğinde `/api/v1/boardroom/audit-log` endpoint'ine `limit=50&offset=0` ile istek atacak.
- Dönen `AuditLogResponseEnvelopeSchema` ({ data, meta }) objesini parse edip tabloya (DOM) render edecek.
- Empty State (filtre sonucu bulunamadı), Loading State (veriler yüklenirken skeleton veya spinner), Error State (401/403/500 durumlarında) senaryolarını yönetecek.
- Drawer açma/kapatma event listener'larını yönetecek.

## Verification Plan
- Admin paneline tarayıcı üzerinden giriş yapılıp Audit Logs sekmesinin render olduğu görülecek.
- Farklı filtre kombinasyonlarıyla backend'in doğru çalıştığı ve tablonun güncellendiği doğrulanacak.
- Sayfalama (Prev/Next) işlemlerinin `offset` parametresini doğru hesapladığı ve `meta.total` verisine göre sınırları yönettiği test edilecek.
- Herhangi bir log kaydında "Inspect" tuşuna basıldığında Drawer'ın sorunsuz JSON gösterdiği onaylanacak.
