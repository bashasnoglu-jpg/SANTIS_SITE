# SANTIS OS — Dead / Zombie Code Inventory — Evidence Pass 2

## Reality Lock
| Field | Value |
|---|---|
| Branch | main |
| Head | 55914218 |
| Working tree | clean |
| Real .env tracked | no |
| Phase tag baseline | phase-e-deployment-baseline-seal |

## Corrections Applied (Pass 2 Governance)
- `master-debug.log` dosyasının `dev-control-layer.js` tarafından aktif olarak beslendiği (Line 148, 152) kanıtlanmış ve "Do Not Touch" listesine alınmıştır.
- `forecast.json` dosyası, legacy API client referansı nedeniyle "Zero Risk" (Batch A) listesinden çıkartılarak "Medium Risk" (Batch B) listesine taşınmıştır.
- "DEAD" etiketi, Santis OS yönetişim kuralları gereği bu pass'te tamamen kaldırılmış; yerini kanıt derecesine göre `⚠️ ZOMBIE` veya `🔍 REVIEW REQUIRED` etiketlerine bırakmıştır.

## Classification Table

| Category | Alive | Zombie | Review Required | Stub |
|---|---:|---:|---:|---:|
| JS assets | 28 | 16 | 10 | 2 |
| HTML pages | 18 | 8 | 5 | 0 |
| Telemetry / WS | 2 | 4 | 3 | 0 |
| Root artifacts | 5 | 10 | 5 | 0 |
| Scripts | 6 | 42 | 10 | 0 |

## High Confidence Archive Candidates (Batch A)
Sadece aktif bir yazıcısı (writer) veya kritik bir referansı olmadığı kanıtlanan dosya/artifact kümesi:
- `index_backup.html` (Gölge HTML)
- `telemetry-dump.json` (Aktif writer yok)
- `TEST_KOMUTLARI.txt` (Kalıntı doküman)
- `*.log` (Aktif writer saptanmayan kök dizin logları)

## Zombie Candidates (Batch B)
Legacy olduğu düşünülen ancak arşivlenmeden önce çapraz kontrol gerektiren sistemler:
- `assets/js/core/SovereignDebtEngine.js` (ve tüm Sovereign Debt stack)
- `templates/` altındaki tüm içerikler (Vite exclusion kapsamında)
- `forecast.json` (Legacy API referansı mevcut)
- Kök dizin `.py/.ps1/.bat` araçları (Geliştirici auditlerinde referanslanabilir)

## Review Required (Batch C)
Fonksiyonel amacı veya roadmap bağımlılığı belirsiz yüzeyler:
- `santis-temporal-v7.js` (Sürüm bağımlılığı belirsiz)
- `templates/market_expansion.html` (Ürün roadmap bağımlılığı)
- `santis-telemetry-intent.js` (V3 Worker ile çakışma/yedekleme durumu)

## Do Not Touch
- `master-debug.log`: `dev-control-layer.js` tarafından aktif olarak yazılıyor.
- `assets/js/boot/santis-bootloader.js`: Birincil giriş noktası.
- `assets/js/core/santis-core.js`: V4 Kernel.
- `tr/**`: Legacy Active (SEO/Routings).
- Tüm aktif `Vite/Vercel/Docker` yapılandırma dosyaları.

## Final Recommendation
- Bu envanter, arşiv operasyonu için bir onay belgesi değildir.
- Bu envanter, sonraki güvenli arşiv batch’leri için kanıt tabanıdır.
- İlk adım olarak sadece bu dokümanı içeren bir `docs-only` PR açılmalıdır.
- Herhangi bir arşiv dalı (branch) veya dosya taşıma işlemi şu aşamada yasaktır.

---
**Bu rapor silme talimatı değildir. Bu rapor yalnızca kanıt temelli envanter ve güvenli arşiv planıdır. Her dosya taşıma işlemi ayrı branch, küçük batch ve gate doğrulaması gerektirir.** ✅
