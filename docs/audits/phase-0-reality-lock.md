# SANTIS OS — Phase 0 Reality Lock

## 1. Reality Snapshot Summary
SANTIS_SITE deposunda CoreState SSOT ve deterministik mimari hedeflerini baltalayan çok sayıda sorun tespit edilmiştir. Özellikle **branch karışıklığı** ve yüksek teknik borç öne çıkmaktadır. Özetle, deponun mevcut hali üretime hazır bir üründen uzak; sorunlu dosya ve dallar güvenli şekilde belgelendirilip aşamalı temizlenmelidir.

## 2. Technical Debt Register (Updated for Reality Lock)

| ID | Kategori | Dosya / Alan | Kritiklik | Kanıt | Önerilen Aksiyon | Durum |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A001** | Ölü Kod Adayı | `src/telemetry/legacyWebsocket.js` | Kritik | Dosya fiziksel olarak bulunamadı (Ghost Debt). | Import graph üzerinden zombi logic analizi. | Doğrulama Gerekli |
| **B001** | Kopya UI Adayı | `src/components/NavbarOld.tsx` | Yüksek | Dosya fiziksel olarak bulunamadı (Ghost Debt). | Alternatif Navbar yolları taranmalı. | Doğrulama Gerekli |
| **C001** | Durum Sapması Adayı | `src/state/localStorageCache.ts` | Orta | Dosya fiziksel olarak bulunamadı (Ghost Debt). | CoreState dışı cache logic'leri taranmalı. | Doğrulama Gerekli |
| **D001** | Tasarım Sapması Adayı | `src/styles/colors.js` | Yüksek | Dosya fiziksel olarak bulunamadı (Ghost Debt). | Global HEX taraması ile gerçek sapmalar tespit edilmeli. | Doğrulama Gerekli |
| **E001** | Araç Borcu | `package-lock.json` & `pnpm-lock.yaml` | Yüksek | `Test-Path` sonucu: `False`, `True`. | Pnpm tek kaynak olarak korunacak. | Çözüldü (package-lock yok) |
| **G001** | Yönetişim Borcu | Repo Ayarları | Orta | PR şablonu eksikliği. | Standart şablon ve kuralları tanımla. | Çözüldü (Şablon oluşturuldu) |

## 3. Git Flow Governance
- **main branch**: Üretime hazır tek branch (Force push yasak).
- **Prefix kuralları**: `feature/*`, `fix/*`, `chore/*`, `refactor/*`.
- **Kod incelemesi**: PR şablonu ve DoD zorunluluğu.

## 4. Safe Cleanup Plan
**Adım 1: Karantina.** `_archive/phase-0-dead-code/` dizinine taşıma.  
**Adım 2: Test & Build.** `pnpm run build` doğrulaması.  
**Adım 3: Belgeleme.** Tüm işlemlerin bu rapor altında dökümante edilmesi.

---
*Snapshot captured during Phase 0 Reality Lock baseline establishment.*
