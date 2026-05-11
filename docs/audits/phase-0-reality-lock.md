# SANTIS OS — Phase 0 Reality Lock

## 1. Reality Snapshot Summary

SANTIS_SITE deposunda CoreState SSOT ve deterministik mimari hedeflerini baltalayan çok sayıda sorun tespit edilmiştir. Özellikle **branch karışıklığı**, spekülatif teknik borç kayıtları ve doğrulanmamış eski kod adayları öne çıkmaktadır.

Bu raporun amacı kod silmek değil; önce gerçekliği mühürlemek, aday borçları sınıflandırmak, kanıtı olmayan iddiaları "Ghost Debt" olarak işaretlemek ve güvenli temizlik sürecini tanımlamaktır.

## 2. Technical Debt Register — Reality Lock View

| ID | Kategori | Dosya / Alan | Kritiklik | Kanıt | Önerilen Aksiyon | Durum |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A001** | Ölü Kod Adayı | `src/telemetry/legacyWebsocket.js` | Kritik | Dosya fiziksel olarak bulunamadı (Ghost Debt). | Import graph üzerinden zombi logic analizi. | Doğrulama Gerekli |
| **B001** | Kopya UI Adayı | `src/components/NavbarOld.tsx` | Yüksek | Dosya fiziksel olarak bulunamadı (Ghost Debt). | Alternatif Navbar yolları taranmalı. | Doğrulama Gerekli |
| **C001** | Durum Sapması Adayı | `src/state/localStorageCache.ts` | Orta | Dosya fiziksel olarak bulunamadı (Ghost Debt). | CoreState dışı cache logic'leri taranmalı. | Doğrulama Gerekli |
| **D001** | Tasarım Sapması Adayı | `src/styles/colors.js` | Yüksek | Dosya fiziksel olarak bulunamadı (Ghost Debt). | Global HEX taraması ile gerçek sapmalar tespit edilmeli. | Doğrulama Gerekli |
| **E001** | Araç Borcu | `package-lock.json` & `pnpm-lock.yaml` | Yüksek | `Test-Path` sonucu: `False`, `True`. | Pnpm tek kaynak olarak korunacak. | Çözüldü (package-lock yok) |
| **G001** | Yönetişim Borcu | Repo Ayarları | Orta | PR şablonu eksikliği. | Standart şablon ve kuralları tanımla. | Çözüldü (Şablon oluşturuldu) |

## 3. Additional Phase 0 Audit Buckets

| ID | Category | File/Area | Severity | Evidence | Action |
|---|---|---|---|---|---|
| TD-001 | Git | old phase branches | High | multiple long-running branches | classify/archive |
| TD-002 | Tooling | package-lock.json | High | pnpm is canonical | keep removed if pnpm-lock exists |
| TD-003 | UI | duplicate nav systems | Critical | multiple nav files | select SSOT |
| TD-004 | Design | hardcoded colors | Medium | hex values found | migrate to tokens |
| TD-005 | State | legacy websocket/realtime | High | duplicate realtime channels suspected | normalize to SSE/CoreState |

## 4. Git Flow Governance

- **main branch**: Üretime hazır tek branch.
- **develop branch**: Entegrasyon branch'i.
- **Prefix kuralları**: `feature/*`, `fix/*`, `chore/*`, `docs/*`, `refactor/*`, `hotfix/*`, `archive/*`.
- **Yasaklı branch adları**: `test`, `final`, `new`, `phase84`, `hakan`, `son`.
- **Kod incelemesi**: PR şablonu ve DoD zorunluluğu.

## 5. Safe Cleanup Plan

**Adım 1: Detect.** Aday dosya veya branch gerçek kanıtla tespit edilir.  
**Adım 2: Classify.** Alive / Dormant / Dead / Unknown sınıflandırması yapılır.  
**Adım 3: Quarantine.** Silme yerine `_archive/phase-0-dead-code/` dizinine taşıma yapılır.  
**Adım 4: Test & Build.** `pnpm run build`, `pnpm run lint`, ilgili testler çalıştırılır.  
**Adım 5: Document.** `archive-manifest.md` ve teknik borç sicili güncellenir.  
**Adım 6: Delete.** Sadece kanıt ve review sonrası silme yapılır.

## 6. Phase 0 Bitiş Kriteri

Phase 0 bitmiş sayılmaz; şu şartlar sağlanınca mühürlenir:

- [ ] main ve develop ayrıldı
- [x] branch prefix standardı yazıldı
- [ ] eski branchler sınıflandırıldı
- [x] teknik borç raporu oluşturuldu
- [ ] dead code adayları karantinaya alındı
- [x] package manager canonical hale getirildi
- [ ] duplicate UI kaynakları listelendi
- [x] build en az bir kere temiz çalıştı
- [x] GitHub branch protection açıldı
- [ ] Phase 0 PR ile merge edildi

---

*Snapshot captured during Phase 0 Reality Lock baseline establishment.*
