# Technical Debt Register — SANTIS OS

| ID | Kategori | Dosya / Alan | Kritiklik | Kanıt | Önerilen Aksiyon | Durum |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A001** | Ölü Kod Adayı | `src/telemetry/legacyWebsocket.js` | Kritik | Belirtilen dosya adı mevcut working tree ve git geçmişinde bulunamadı. Bu yalnızca ilk iddianın doğrulanamadığını kanıtlar; eşdeğer WebSocket/telemetry zombi modül olmadığını kanıtlamaz. | Gerçek WebSocket/telemetry zombi adayı import graph ve runtime kullanım analiziyle yeniden tespit edilecek. | ⚠️ Ghost Debt / Doğrulama Gerekli |
| **B001** | Kopya UI Adayı | `src/components/NavbarOld.tsx` | Yüksek | Belirtilen dosya adı bulunamadı. Bu yalnızca eski yolun geçersiz olduğunu kanıtlar; eşdeğer duplicate navbar bileşeni olmadığını kanıtlamaz. | Bileşen varlığı, import graph ve route/render kullanımı kontrol edilecek. | ⚠️ Ghost Debt / Doğrulama Gerekli |
| **C001** | Durum Sapması Adayı | `src/state/localStorageCache.ts` | Orta | Belirtilen dosya adı bulunamadı. CoreState dışı başka storage/cache kullanımları ayrıca taranmalı. | `localStorage`, `sessionStorage`, cache adapter ve CoreState dışı state yazımları taranacak. | ⚠️ Ghost Debt / Doğrulama Gerekli |
| **D001** | Tasarım Sapması Adayı | `src/styles/colors.js` | Yüksek | Belirtilen dosya adı bulunamadı. Hardcoded HEX/design-token sapması için global Stitch/design-token taraması gerekir. | Stitch guard ve raw HEX taramasıyla gerçek sapmalar tespit edilecek. | ⚠️ Ghost Debt / Doğrulama Gerekli |
| **E001** | Araç Borcu | `package-lock.json` & `pnpm-lock.yaml` | Yüksek | `Test-Path package-lock.json, pnpm-lock.yaml` sonucu: `False`, `True`. | Pnpm tek kaynak olarak korunacak; npm lockfile yeniden oluşursa gate ihlali sayılacak. | ✅ Çözüldü (package-lock yok) |
| **F001** | Git Borcu | Dal isimlendirmesi | Orta | Standart dışı branch isimleri. | ABNF prefix sistemini uygula. | ⏳ Beklemede |
| **G001** | Yönetişim Borcu | Repo Ayarları | Orta | PR şablonu ve CODEOWNERS eksikliği. | Standart şablon ve kuralları tanımla. | ⏳ Beklemede |
