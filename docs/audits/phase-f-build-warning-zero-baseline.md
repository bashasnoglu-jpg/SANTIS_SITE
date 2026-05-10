# SANTIS OS - Phase F Build Warning Zero Baseline

> Branch: `phase-f-build-warning-zero-baseline`  
> Scope: Build-time warning elimination & bundle optimization  
> Status: BASELINE AUDIT COMPLETE

---

## F1 — HTML Parse & Module Warnings

### HTML Parse Errors
- **404.html (L98):** `parse5 error code end-tag-without-matching-open-element`. OG meta etiketleri arasında kapatılmamış veya yanlış hiyerarşide bir element tespit edildi.

### Module Attribute Missing
Vite build sürecinde aşağıdaki dosyalar `type="module"` niteliği eksik olduğu için bundle edilemiyor:
- **bronz-masaji.html:** 10+ script (core, engine, app.js)
- **cilt-bakimi.html:** GSAP, Lenis ve Bridge scriptleri
- **hakkimizda.html:** Three.js, GSAP ve app.js
- **ritueller.html / masaj.html:** Vitals ve UI engine scriptleri
- **service-detail.html:** I18n routes ve engine scriptleri

## F2 — CSS @import Ordering Warnings
- **gallery.css & style.css:** 26 adet `@import` kuralı hatası. `@import` kuralları, CSS dosyalarının en başında (charset/layer haricinde) yer almalıdır. Mevcut yapıda kural ihlalleri bundle optimizasyonunu engelliyor.

## F3 — Bundle Size Warnings
- **MPA Bundle:** `tests_reports_html_index.js` (412.45 kB) limitleri zorluyor.
- **Admin Panel:** `vendor-3d-calendar.js` (780.27 kB) kritik seviyede (600 kB limitini aştı). `manualChunks` optimizasyonu gerekiyor.

## F4 — Generated Reports Leaking into Dist
Aşağıdaki dinamik raporlar ve test çıktıları `dist/` klasörüne (production bundle) sızıyor:
- `dist/reports/link_audit_report_*.html` (30+ dosya)
- `dist/tests/reports/html/index.html`
- `dist/santis-audit/` altındaki admin araçları.

## F5 — Root MPA Exclusion Policy Hardening
Production bundle'da bulunmaması gereken "demo/lab" dosyaları tespit edildi:
- `v18-demo.html`
- `3d-lab.html`
- `ws-simulator.html`
- `santis-pitch-deck.html`

---

## Kapanış Hükmü
Bu rapor, Phase F operasyonunun düzeltme listesidir. 
**Kural 5 Gereği:** Hiçbir dosya direkt silinmeyecek; F4 ve F5 kapsamındaki dosyalar önce karantinaya alınacak, F1 ve F2 için ise kod seviyesinde müdahale edilecektir.

Validate main: **GREEN**
Phase F Baseline: **LOCKED**
