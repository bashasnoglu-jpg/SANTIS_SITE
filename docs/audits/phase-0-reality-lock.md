# SANTIS OS — Phase 0 Reality Lock

## Technical Debt Register

| ID | Category | File/Area | Severity | Evidence | Action |
|---|---|---|---|---|---|
| TD-001 | Git | old phase branches | High | multiple long-running branches | classify/archive |
| TD-002 | Tooling | package-lock.json | High | pnpm is canonical | remove if pnpm-lock exists |
| TD-003 | UI | duplicate nav systems | Critical | multiple nav files | select SSOT |
| TD-004 | Design | hardcoded colors | Medium | hex values found | migrate to tokens |
| TD-005 | State | legacy websocket | High | duplicate realtime channels | normalize to SSE/CoreState |

## Phase 0 Bitiş Kriteri
Phase 0 bitmiş sayılmaz; şu şartlar sağlanınca mühürlenir:
[ ] main ve develop ayrıldı
[x] branch prefix standardı yazıldı
[ ] eski branch’ler sınıflandırıldı
[x] teknik borç raporu oluşturuldu
[ ] dead code adayları karantinaya alındı
[x] package manager canonical hale getirildi
[ ] duplicate UI kaynakları listelendi
[x] build en az bir kere temiz çalıştı
[x] GitHub branch protection açıldı
[ ] Phase 0 PR ile merge edildi

---
*Snapshot captured during Phase 0 Reality Lock baseline establishment.*
