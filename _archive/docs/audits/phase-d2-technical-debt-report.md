# SANTIS_SITE — GitHub Teknik Borç Raporu

**Tarih:** 2026-05-14
**Repo:** `bashasnoglu-jpg/SANTIS_SITE`
**Durum:** `develop` governance-compliant
**Ana sonuç:** Phase D2 Boundary Hardening tamamlandı.

---

## 1. Yönetici Özeti

SANTIS_SITE reposu, daha önce public repo sınırlarında aktif duran private infrastructure yüzeylerini barındırıyordu. D2-B4 hattı sonunda bu private operational surface `_archive/private-infra/` altına taşındı ve repository boundary artık `audit:all` içinde **hard gate** olarak çalışıyor.

Son durumda:

```text
audit:repo-boundary PASS
audit:all PASS
lint PASS
stitch:enforce PASS
boundary violations: 6 → 0
archived private tracked files: 446
```

`packages/event-dictionary` için Boardroom kararı verildi: bu paket private infrastructure değil, public shared contract surface olarak sınıflandırıldı ve public repoda kalması onaylandı.

---

## 2. Kapanan Teknik Borçlar

| Alan | Önceki Borç | Yapılan Çözüm | Durum |
| :--- | :--- | :--- | :--- |
| Repo Boundary | Private infra public root altında aktifti | `_archive/private-infra/` altına taşındı | ✅ Kapandı |
| CI Guardrail | Boundary audit manuel çalışıyordu | `audit:repo-boundary`, `audit:all` içine ilk gate olarak eklendi | ✅ Kapandı |
| Server Coupling | `server/` public repoda aktif path idi | `server/` archive edildi | ✅ Kapandı |
| Legacy Static Import | `legacy/server.js` static server import içeriyordu | `legacy/server.js` co-archive edildi | ✅ Kapandı |
| Apps/Packages Private Surface | `apps/api`, `apps/ingestion-api`, `packages/db`, `packages/decision-kernel` aktifti | Tümü archive edildi | ✅ Kapandı |
| Event Dictionary Belirsizliği | Forbidden mı public contract mı belirsizdi | `PUBLIC_COUPLED` olarak resmileştirildi | ✅ Kapandı |

---

## 3. Arşivlenen Private Infrastructure

D2-B4 sonunda şu path'ler public root'tan çıkarıldı:

```text
_archive/private-infra/
├── apps/api/                    3 tracked file
├── apps/ingestion-api/          122 tracked file
├── packages/db/                 11 tracked file
├── packages/decision-kernel/    8 tracked file
├── server/                      301 tracked file
└── legacy/server.js             1 tracked file
```

**Toplam: 446 tracked file archived**

Bu taşıma "delete" değil; history korunarak governance archive yapıldı.

---

## 4. Boundary Gate Durumu

`audit:repo-boundary` artık `audit:all` içinde ilk sırada çalışıyor:

```json
"audit:all": "pnpm run audit:repo-boundary && pnpm run audit:environment && pnpm run audit:workspace && pnpm run audit:contract && pnpm run audit:localhost"
```

Private path geri sızarsa `audit:all` en başta fail eder.

**Violation ilerlemesi:**

| Faz | Violation |
| :--- | ---: |
| D2-B4-B baseline | 6 |
| D2-B4-D sonrası | 2 |
| D2-B4-F sonrası | 1 |
| D2-B4-G sonrası | **0 ✅** |

---

## 5. `event-dictionary` Kararı

`packages/event-dictionary` forbidden list'ten çıkarıldı çünkü public shared contract surface olarak kabul edildi.

**Aktif public consumer'lar:**

```text
admin-panel
packages/sovereign-bus
packages/openr
packages/application
tsconfig.base.json alias
pnpm-lock.yaml workspace resolution
```

**Karar: `packages/event-dictionary = PUBLIC_COUPLED`**

Taşınmadı, refactor edilmedi, public repoda kalması governance olarak onaylandı.

---

## 6. Kalan Teknik Borçlar

### 6.1 Düşük Öncelik — Stale Tooling References

`server/` archive edildikten sonra bazı smoke/tooling path string'leri artık stale:

```text
scripts/esm_smoke_targets.wave*.json
scripts/start-rollout-runtime.ts
run-*-smoke.ts dynamic imports
scripts/smoke_phase5.js
scripts/smoke_phase6.js
scripts/dev-sovereign-*.mjs
```

Boundary-safe dynamic import oldukları için build blocker değil. Graceful fail ile çalışıyorlar.

- **Öncelik:** Low
- **Risk:** Low
- **Aksiyon:** Ayrı `D2-Cleanup Tooling` audit/refactor PR

---

### 6.2 Orta Öncelik — `tsconfig.sovereign-core.json`

`tsconfig.sovereign-core.json` root'ta kaldı. Server-specific config olduğu belgelendi, ancak D2-B4-F kapsamında taşınmadı.

- **Öncelik:** Medium
- **Risk:** Medium
- **Aksiyon seçenekleri:**
  - Option 1: Root'ta governance note ile bırak
  - Option 2: Ayrı PR ile `_archive/private-infra/` altına taşı
  - Option 3: Private repo migration sırasında ele al

---

### 6.3 Orta Öncelik — Archive İçeriğinin Uzun Vadeli Stratejisi

`_archive/private-infra/` public repo içinde history-preserved quarantine olarak duruyor. Uzun vadede private repo migration yapılacaksa extraction manifest hazırlanmalı.

- **Öncelik:** Medium
- **Aksiyon:** "Private Repo Extraction Manifest" hazırlanması

---

## 7. Risk Değerlendirmesi

| Risk | Seviye | Açıklama | Öneri |
| :--- | :--- | :--- | :--- |
| Private path geri sızması | Düşük | Hard gate aktif | `audit:all` korunmalı |
| Event dictionary yanlışlıkla taşınması | Düşük | PUBLIC_COUPLED kararı kayıtlı | Forbidden list'e geri eklenmemeli |
| Stale smoke scripts | Düşük | Dynamic import / graceful fail | Cleanup fazında düzenle |
| Archive repo şişkinliği | Orta | `_archive/private-infra/` public repo içinde | Private extraction planı |
| Root server config kalıntısı | Orta | `tsconfig.sovereign-core.json` root'ta | Ayrı governance kararı |

---

## 8. Önerilen Sonraki Fazlar

### Phase E — Archive Hygiene Audit

```text
Amaç:
_archive/private-infra içeriği doğru mu?
Hangi dosyalar private repo'ya taşınmalı?
Hangi dosyalar sadece historical archive olarak kalmalı?
```

### Phase F — Tooling Cleanup

```text
Amaç:
stale server path stringleri
esm_smoke_targets.wave*.json
legacy smoke helper davranışları
```

### Phase G — Private Repo Extraction Plan

```text
Amaç:
_archive/private-infra içinden gerçek private Santis OS repo
yapısını planlamak
```

---

## 9. Nihai Teknik Borç Durumu

```text
Critical technical debt : 0
High technical debt     : 0
Medium technical debt   : 2
Low technical debt      : 2
Governance gate status  : ACTIVE
Repo boundary status    : COMPLIANT
```

**Son hüküm:**

> SANTIS_SITE artık public repo boundary açısından governance-compliant.
> Kritik teknik borç kapandı.
> Kalan borçlar operasyonel cleanup ve uzun vadeli private extraction planı seviyesinde.

---

**Rapor:** Antigravity (Santis OS Governance Engineer)
**Tarih:** 2026-05-14
**Branch:** `docs/phase-d2-technical-debt-report`
