# SANTIS OS — Archive Manifest

**Version:** Phase 0.5  
**Last Updated:** 2026-05-11  
**Governance Reference:** `docs/governance/deletion-policy.md`

This manifest documents all archived branches and quarantined files in the Santis OS repository.  
Archived entities are **READ-ONLY**. They must not be rebased, force-pushed, or deleted without explicit Boardroom approval.

---

## 1. Archived Branches

### `archive/phase-82-visual-truth`
| Field | Value |
| :--- | :--- |
| **Original Branch** | `phase-82-visual-truth` |
| **Archived Date** | 2026-05-08 |
| **Status** | ARCHIVED — READ ONLY |
| **Purpose** | Historical preservation of the Visual Truth architecture evolution. |

### `archive/phase-83-boardroom-oracle-feed`
| Field | Value |
| :--- | :--- |
| **Original Branch** | `phase-83-boardroom-oracle-feed` |
| **Archived Date** | 2026-05-08 |
| **Status** | ARCHIVED — READ ONLY |
| **Purpose** | Boardroom Oracle Feed lineage preservation. |

### `archive/phase-84-oracle-stream`
| Field | Value |
| :--- | :--- |
| **Original Branch** | `phase-84-live-oracle-stream` |
| **Archived Date** | 2026-05-08 |
| **Status** | ARCHIVED — READ ONLY |
| **Purpose** | Temporal and live Oracle stream evolution snapshot. |

---

## 2. Archive Rules
1. **No direct commits** to any `archive/*` branch.
2. **No force push** to archive branches.
3. **No deletion** without explicit Boardroom approval.
4. Archive branches are excluded from CI enforcement pipelines.
5. **Quarantine Rule:** No file is deleted directly; it must first be listed in the File Quarantine Log below.

---

## 3. Pending Archive Candidates
| Branch | Reason | Status |
| :--- | :--- | :--- |
| `phase-84-replay-temporal-oracle` | Duplicate phase-84 variant | Pending review |
| `phase-0-sovereign-constitution` | Historical governance value | Pending review |
| `tech-debt/dna-guard-expansion` | Non-canonical prefix, possible value | Pending review |

---

## 4. File Quarantine Log (Phase 0 Reality Lock)

Bu bölüm, `_archive/` dizinine taşınan her dosyanın kaydını tutar. Hiçbir dosya doğrudan silinmez, önce burada kayıt altına alınarak karantinaya alınır.

| Tarih | Dosya Yolu (Orijinal) | Karantina Yolu | İlgili ID | Neden | Sorumlu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| --- | --- | --- | --- | --- | --- |

---

## 5. Archive Log
| Date | Action | Entity | Authorized By |
| :--- | :--- | :--- | :--- |
| 2026-05-08 | Created | `archive/phase-82-visual-truth` | Boardroom (user) |
| 2026-05-08 | Created | `archive/phase-83-boardroom-oracle-feed` | Boardroom (user) |
| 2026-05-08 | Created | `archive/phase-84-oracle-stream` | Boardroom (user) |
