# SANTIS CLUB — ULTRA MEGA ARASTIRMA RAPORU
Tarih: 2026-02-16
Kapsam: Kod tabani, i18n/SEO, build/deploy, runtime JS mimarisi, operasyonel riskler

## 1) Yonetici Ozeti
Proje teknik olarak zengin ve calisir durumda, ancak su anda "tek urun" yerine "monorepo benzeri bir calisma havuzu" karakteri tasiyor. Kritik bulgu: domain kaynaklari, rota kaynaklari ve hreflang/sitemap uretim katmanlari birbiriyle tutarli degil. Bu nedenle kalite kapisi NO-GO veriyor.

Ana sonuc:
- Runtime katmani (UI/JS) gelismis ama tutarsiz (birden fazla nav/footer sahipligi, rota farkliliklari).
- SEO/i18n katmani otomasyonlu ama veri kaynaklari bozuldugu icin kendi icinde celisiyor.
- Depolama/repo hijyeni zayif (build/backup/artifact yogunlugu), operasyon maliyeti yuksek.

## 2) Proje Profili (Nicel)
Kaynaklar:
- `reports/project_deep_report.md`
- Canli tarama komutlari (bugun)

### 2.1 Full Workspace (genel)
- Toplam dosya: 7,772
- Toplam klasor: 1,396
- Toplam boyut: 333.6 MB

### 2.2 Aktif kod tabani (filtreli gorunum)
Filtre: `node_modules`, `venv`, `_build`, `backup/backups`, `_archive/_backup/_legacy` haric
- HTML: 2,686
- JS: 635
- CSS: 232
- Python: 180

### 2.3 Dil kapsami (aktif locale dizinleri)
- `tr`: 138
- `en`: 146
- `de`: 142
- `fr`: 291
- `ru`: 136
- `sr`: 14

Not:
- `sr` icin `sr/index.html` yok; buna ragmen ana sayfalarda `hreflang="sr"` var.

## 3) Build/Deploy ve CI Durumu
### 3.1 Build
- `build.mjs` admin bundle + public minify yapiyor.
- Admin JS/CSS bundle stratejisi net ve sirali.
- Esbuild kullanimi dogru.

### 3.2 Deploy
- Cloudflare API tabanli deploy mevcut: `cf-deploy.mjs`.
- Domain/zone setup scripti mevcut: `cloudflare-setup.mjs`.

### 3.3 CI
- Deploy Gate workflow var: `.github/workflows/deploy-gate.yml`.
- Ayrica Deno workflow var: `.github/workflows/deno.yml`.
- Repoda `deno.json/deno.jsonc` bulunmuyor; Deno job drift riski var.

## 4) Kalite Kapisi Sonucu (Canli Calistirildi)
Komut: `python flight_check.py`

Sonuc:
- Verdict: NO-GO
- Pages scanned: 860
- Critical: 1529
- Warnings: 193
- PASS module: 2/5

Modul ozeti:
- Redirects: PASS
- Canonical: PASS
- Hreflang: FAIL
- Template: WARN
- Links: WARN

## 5) Kritik Bulgular (Onceliklendirilmis)
## P0 — Domain Kaynak Tutarsizligi
- Uretim sayfalari ve sitemap `santis-club.com` kullaniyor:
  - `robots.txt:18`
  - `sitemap.xml:5`
  - `tr/index.html:37`
- Buna karsin i18n/sitemap/deploy gate scriptleri `santis.club` kullaniyor:
  - `deploy_gate.py:35`
  - `hreflang_sync.py:27`
  - `sitemap_sync.py:27`
  - `assets/js/hreflang-injector.js:22`

Etki:
- Search Console ping, hreflang URL uretimi ve sitemap otomasyonunda yanlis host riski.

## P0 — Redirect Source of Truth Bozuk
- `data/redirects.json` icinde `from/to` alanlari `null`:
  - `data/redirects.json:4`
  - `data/redirects.json:5`

Etki:
- Redirect pipeline anlamsal olarak bozuk, ileride hatali rewrite/redirect uretimi riski.

## P0 — i18n Registry Veri Anomalileri
- Trailing slash ile `.html/` degerleri:
  - `assets/data/available-routes.json:18`
  - `assets/data/available-routes.json:115`
- Hizmetler cluster'i tum dillerde ayni dizine mapiyor:
  - `assets/data/available-routes.json:238`
  - `assets/data/available-routes.json:240`
- Ana sayfalarda `hreflang="sr"` var ama hedef dosya yok:
  - `tr/index.html:47`
  - `en/index.html:45`
  - `de/index.html:45`
  - `fr/index.html:45`
  - `ru/index.html:45`

Etki:
- Hreflang reciprocal ve target validity bozuluyor (Flight Check FAIL'in ana nedeni).

## P1 — Yanlis Locale Linkleri (Kirilik Navigasyon)
- Almanca/Fransizca/Rusca sayfalarda var olmayan yollar:
  - `/de/services/index.html`: `de/index.html:63`
  - `/fr/services/index.html`: `fr/index.html:63`
  - `/ru/services/index.html`: `ru/index.html:63`
  - `/de/galerie/index.html` ornegi: `de/hammam/index.html:152`

Dosya dogrulama:
- `de/services/index.html` yok, `de/hizmetler/index.html` var.
- `de/galerie/index.html` yok, `de/gallery/index.html` var.

## P1 — Rota Mantigi Icinde Fonksiyonel Ayrisma
- `SANTIS_ROUTES.serviceDetail()` eski paterne donuyor:
  - `assets/js/routes.js:85` -> `/tr/urunler/detay.html?product=...`
- Ana runtime yeni patern kullaniyor:
  - `assets/js/app.js:484` -> `/service-detail.html?slug=...`
  - `assets/js/home-products.js:505`

Etki:
- Yardimci API kullanildigi noktada 404/yanlis sayfa riski.

## P1 — Runtime Ownership Cakismasi (Nav/Footer)
- `app.js` global nav inject ediyor:
  - `assets/js/app.js:669`
- `santis-nav.js` da nav/footer lifecycle yonetiyor:
  - `assets/js/santis-nav.js:122`
  - `assets/js/santis-nav.js:158`
  - `assets/js/santis-nav.js:176`
- `app.js` auto-footer fallback'i ayri:
  - `assets/js/app.js:460`
  - `assets/js/app.js:466`

Etki:
- Cift sahiplikten dolayi race-condition ve tekrarli network/UI init riski.

## P1 — Retry Mekanizmasi Callback Hatalarini "Fetch Hatasi" Gibi Isliyor
- `loadComp` callback ayni `try/catch` icinde:
  - `assets/js/loader.js:221`
  - `assets/js/loader.js:275`
  - `assets/js/loader.js:283`
  - `assets/js/loader.js:297`

Etki:
- Asil hata callback olsa da retry/fetch hatasi gibi gorunur, gozlem maliyeti artar.

## P2 — Redirect Politikasinda Cift Mantik
- Edge redirect:
  - `_redirects:2` -> root her zaman `/tr/index.html`
- Root sayfa JS language redirect:
  - `index.html:8`
  - `index.html:11`

Etki:
- Host platform davranisina gore biri digerini anlamsizlastirabilir.

## P2 — Repo Hijyeni ve Artifact Yuksek
Ust dizin boyutlarindan ilkler:
- `venv`: 358.74 MB
- `_build`: 78.05 MB
- `_pages_build`: 74.24 MB
- `assets`: 68.87 MB
- `node_modules`: 52.74 MB

Etki:
- Clone/sync yavaslar, CI cache maliyeti artar, degisiklik izleme zorlasir.

## 6) Pozitif Teknik Noktalar
- FastAPI sunucu yapisi kapsamli; middleware katmanlasmasi iyi.
- Guvenlik header middleware mevcut:
  - `server.py:325`
  - `server.py:337`
  - `server.py:344`
  - `server.py:359`
- Koku dizin wildcard mount kaldirilmis, whitelist dosya servisine gecilmis:
  - `server.py` (tail bolumu, `_SAFE_ROOT_FILES` blok).
- Build scriptinde admin/public ayrimi yapilmis, bundle stratejisi okunakli:
  - `build.mjs`.

## 7) Risk Matrisi
| Risk | Seviye | Olasilik | Etki | Not |
|---|---|---|---|---|
| Domain mismatch (`santis.club` vs `santis-club.com`) | Kritik | Yuksek | Yuksek | SEO/automation bozulur |
| Hreflang registry bozulmasi | Kritik | Yuksek | Yuksek | NO-GO'nun ana kaynagi |
| Broken locale links | Yuksek | Yuksek | Orta-Yuksek | UX + crawl kaybi |
| Dual nav/footer ownership | Orta-Yuksek | Orta | Orta | Intermittent bug/race |
| Redirect data null | Yuksek | Orta | Orta-Yuksek | Yanlis yonlendirme riski |
| Repo artifact sisligi | Orta | Yuksek | Orta | Operasyonel yavaslama |

## 8) 7 Gunluk Kurtarma Plani (Pragmatik)
1. Domain standardizasyonu:
   - Tum uretim kaynaklarini `https://santis-club.com` tek dogru hosta cek.
   - Dosyalar: `deploy_gate.py`, `hreflang_sync.py`, `sitemap_sync.py`, `assets/js/hreflang-injector.js`.
2. Route registry sanitizasyonu:
   - `available-routes.json` icindeki `.html/` ve bozuk cluster satirlarini temizle.
   - `sr` sadece olan sayfalarda tutulacak sekilde hreflang stratejisini netlestir.
3. Link duzeltme:
   - `de/fr/ru` icin `/services` ve `/galerie` patikalarini gercek dizinlerle esle.
4. Redirect data onarimi:
   - `data/redirects.json` null kayitlarini temizle; valid schema enforce et.
5. Runtime sadeleme:
   - Navbar/Footer owner tek module indir (tercihen `santis-nav.js`).
   - `app.js` fallback footer logic'i guard veya removal.
6. CI yeniden hizalama:
   - Deno job'u kaldir veya Deno stack gercekten kullanilacaksa config ekle.
7. Repo hijyeni:
   - Build artifact klasorlerini VCS disina al (`_build`, `_pages_build`, `dist_deploy` vb).

## 9) 30 Gunluk Mimari Toparlama
- "Single Source of Truth" prensibi:
  - Domain
  - Route map
  - Hreflang clusters
  - Redirect table
- JS runtime katmanlari:
  - `app.js` (page behavior), `santis-nav.js` (nav lifecycle), `loader.js` (component transport) net sorumluluk ayrimi.
- Data governance:
  - `data/site_content.json` + `assets/data/*.json` icin net ownership ve generate pipeline.
- Gozlemlenebilirlik:
  - Flight Check sonucunu JSON artifact olarak her run'da raporlama.

## 10) Sonuc
Proje "gelismis ama daginik". En buyuk teknik borc, kod karmasasi degil; "kaynak gercegin" parcalanmis olmasi (domain/route/hreflang/redirect). Bu 4 eksen tek standartta birlestirildiginde, mevcut sistem hizla stabil ve olceklenebilir hale gelir.

