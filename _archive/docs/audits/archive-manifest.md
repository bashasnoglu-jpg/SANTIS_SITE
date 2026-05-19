# SANTIS OS — Archive Manifest

**Version:** Phase 0.5  
**Last Updated:** 2026-05-08  
**Governance Reference:** `docs/governance/deletion-policy.md`

This manifest documents all archived branches in the Santis OS repository.  
Archived branches are **READ-ONLY**. They must not be rebased, force-pushed, or deleted without explicit Boardroom approval.

---

## What is an Archive Branch?

An archive branch is a historical preservation snapshot of an architectural phase, feature lineage, or governance milestone. It is not stale code — it is an **auditable record of how the system evolved**.

Archive branches follow the naming convention: `archive/<original-branch-name>`

---

## Archived Branches

### `archive/phase-82-visual-truth`

| Field | Value |
| :--- | :--- |
| **Original Branch** | `phase-82-visual-truth` |
| **Archived Date** | 2026-05-08 |
| **Status** | ARCHIVED — READ ONLY |
| **Classification** | Governance Preservation |
| **Purpose** | Historical preservation of the Visual Truth architecture evolution. Captures the canonical design token enforcement and style drift remediation work of Phase 82. |
| **Governance Value** | High — defines the Visual Truth layer that subsequent governance work (stitch guard, arbitrary Tailwind elimination) is built upon. |
| **Recovery Value** | Replayable reference for Quiet Luxury design system decisions. |
| **Deletion Eligible** | No — governance value preserved. |

---

### `archive/phase-83-boardroom-oracle-feed`

| Field | Value |
| :--- | :--- |
| **Original Branch** | `phase-83-boardroom-oracle-feed` |
| **Archived Date** | 2026-05-08 |
| **Status** | ARCHIVED — READ ONLY |
| **Classification** | Governance Preservation |
| **Purpose** | Boardroom Oracle Feed lineage preservation. Documents the real-time intelligence feed architecture connecting the Boardroom layer to the Oracle command system. |
| **Governance Value** | High — foundational to the CoreState event-driven boardroom architecture. |
| **Recovery Value** | Architecture replay reference for Boardroom intelligence pipeline. |
| **Deletion Eligible** | No — governance value preserved. |

---

### `archive/phase-84-oracle-stream`

| Field | Value |
| :--- | :--- |
| **Original Branch** | `phase-84-live-oracle-stream` |
| **Archived Date** | 2026-05-08 |
| **Status** | ARCHIVED — READ ONLY |
| **Classification** | Governance Preservation |
| **Purpose** | Temporal and live Oracle stream evolution snapshot. Captures the live data streaming architecture and temporal aggregation patterns of the Oracle intelligence layer. |
| **Governance Value** | High — temporal oracle and SSE streaming architecture foundation. |
| **Recovery Value** | Replayable reference for live data pipeline decisions. |
| **Deletion Eligible** | No — governance value preserved. |

---

## Archive Rules

1. **No direct commits** to any `archive/*` branch.
2. **No rebasing** of archive branches.
3. **No force push** to archive branches.
4. **No deletion** without explicit Boardroom approval and evidence that recovery value is zero.
5. Archive branches are excluded from CI enforcement pipelines.
6. Archive branches must be listed in this manifest before creation.

---

## Pending Archive Candidates

The following branches have been classified as ARCHIVE-CANDIDATE in `docs/audits/branch-governance-audit.md` and are pending Boardroom review:

| Branch | Reason | Status |
| :--- | :--- | :--- |
| `phase-84-replay-temporal-oracle` | Duplicate phase-84 variant | Pending review |
| `phase-0-sovereign-constitution` | Historical governance value | Pending review |
| `tech-debt/dna-guard-expansion` | Non-canonical prefix, possible value | Pending review |

---

## Archive Log

| Date | Action | Branch | Authorized By |
| :--- | :--- | :--- | :--- |
| 2026-05-08 | Created | `archive/phase-82-visual-truth` | Boardroom (user) |
| 2026-05-08 | Created | `archive/phase-83-boardroom-oracle-feed` | Boardroom (user) |
| 2026-05-08 | Created | `archive/phase-84-oracle-stream` | Boardroom (user) |
