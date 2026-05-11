# Technical Debt Register — SANTIS OS

| ID | Kategori | Dosya / Alan | Kritiklik | Kanıt | Önerilen Aksiyon | Durum |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A001** | Ölü Kod | `src/telemetry/legacyWebsocket.js` | Kritik | Kullanılmayan eski WebSocket modülü. | Karantina prosedürünü uygula ve sil. | ⏳ Beklemede |
| **B001** | Kopya UI | `src/components/NavbarOld.tsx` | Yüksek | İki farklı navbar bileşeni varlığı. | Bileşenleri konsolide et, eskiyi sil. | ⏳ Beklemede |
| **C001** | Durum Sapması | `src/state/localStorageCache.ts` | Orta | CoreState dışı bağımsız cache. | CoreState SSOT akışına dahil et. | ⏳ Beklemede |
| **D001** | Tasarım Sapması | `src/styles/colors.js` | Yüksek | Hardcoded HEX renk kodları. | Tasarım token'ları ve strict linting kullan. | ⏳ Beklemede |
| **E001** | Araç Borcu | `package-lock.json` & `pnpm-lock.yaml` | Yüksek | Çift lock dosyası varlığı. | Pnpm üzerinde tekleştir, npm'i sil. | ⏳ Beklemede |
| **F001** | Git Borcu | Dal isimlendirmesi | Orta | Standart dışı branch isimleri. | ABNF prefix sistemini uygula. | ⏳ Beklemede |
| **G001** | Yönetişim Borcu | Repo Ayarları | Orta | PR şablonu ve CODEOWNERS eksikliği. | Standart şablon ve kuralları tanımla. | ⏳ Beklemede |
