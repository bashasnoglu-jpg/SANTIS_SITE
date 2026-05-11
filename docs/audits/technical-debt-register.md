# Technical Debt Register — SANTIS OS

| ID | Kategori | Dosya / Alan | Kritiklik | Kanıt | Önerilen Aksiyon | Durum |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A001** | Ölü Kod Adayı | `src/telemetry/legacyWebsocket.js` | Kritik | Dosya mevcut working tree ve git geçmişinde bulunamadı; iddia doğrulanmalı. | Gerçek WebSocket/telemetry zombi adayı import graph ile yeniden tespit edilecek. | ⚠️ Doğrulama Gerekli |
| **B001** | Kopya UI Adayı | `src/components/NavbarOld.tsx` | Yüksek | Yol ve aktif kullanım henüz doğrulanmadı. | Dosya varlığı ve import graph kontrolü sonrası karar ver. | ⚠️ Doğrulama Gerekli |
| **C001** | Durum Sapması Adayı | `src/state/localStorageCache.ts` | Orta | Yol ve CoreState dışı kullanım henüz doğrulanmadı. | Dosya varlığı ve runtime kullanım analizi sonrası karar ver. | ⚠️ Doğrulama Gerekli |
| **D001** | Tasarım Sapması Adayı | `src/styles/colors.js` | Yüksek | Yol ve hardcoded HEX kullanımı henüz doğrulanmadı. | Stitch/design-token taraması sonrası karar ver. | ⚠️ Doğrulama Gerekli |
| **E001** | Araç Borcu Adayı | `package-lock.json` & `pnpm-lock.yaml` | Yüksek | Çift lock dosyası varlığı güncel branch üzerinde doğrulanmalı. | `Test-Path package-lock.json; Test-Path pnpm-lock.yaml` ile doğrula. | ⚠️ Doğrulama Gerekli |
| **F001** | Git Borcu | Dal isimlendirmesi | Orta | Standart dışı branch isimleri. | ABNF prefix sistemini uygula. | ⏳ Beklemede |
| **G001** | Yönetişim Borcu | Repo Ayarları | Orta | PR şablonu ve CODEOWNERS eksikliği. | Standart şablon ve kuralları tanımla. | ⏳ Beklemede |
