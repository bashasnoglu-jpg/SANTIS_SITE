# Technical Debt Register — SANTIS OS

| ID | Kategori | Dosya / Alan | Kritiklik | Kanıt | Önerilen Aksiyon | Durum |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A001** | Ölü Kod | `src/telemetry/legacyWebsocket.js` | Kritik | Dosya sistemde yok (Deep Search: False). | Yok (Hayalet Borç). | ✅ Çözüldü (Sistemde Bulunmuyor) |
| **B001** | Kopya UI | `src/components/NavbarOld.tsx` | Yüksek | Dosya sistemde yok (Deep Search: False). | Yok (Hayalet Borç). | ✅ Çözüldü (Sistemde Bulunmuyor) |
| **C001** | Durum Sapması | `src/state/localStorageCache.ts` | Orta | Dosya sistemde yok (Deep Search: False). | Yok (Hayalet Borç). | ✅ Çözüldü (Sistemde Bulunmuyor) |
| **D001** | Tasarım Sapması | `src/styles/colors.js` | Yüksek | Dosya sistemde yok (Deep Search: False). | Yok (Hayalet Borç). | ✅ Çözüldü (Sistemde Bulunmuyor) |
| **E001** | Araç Borcu | `package-lock.json` & `pnpm-lock.yaml` | Yüksek | Çift lock dosyası varlığı. | Pnpm üzerinde tekleştir, npm'i sil. | ✅ Çözüldü (package-lock yok) |
| **F001** | Git Borcu | Dal isimlendirmesi | Orta | Standart dışı branch isimleri. | ABNF prefix sistemini uygula. | ⏳ Beklemede |
| **G001** | Yönetişim Borcu | Repo Ayarları | Orta | PR şablonu ve CODEOWNERS eksikliği. | Standart şablon ve kuralları tanımla. | ⏳ Beklemede |
