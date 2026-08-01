# Santis OS Architecture Status Matrix

- **Book Version:** 0.9-RC2
- **Document Status:** Normative Draft
- **Architecture Review:** Pending
- **Production Authority:** No

## Status Legend

| Status | Meaning |
|---|---|
| `CONCEPT` | Early proposal; not normative and not implemented. |
| `NORMATIVE DESIGN` | Approved target design; implementation or runtime proof may not exist yet. |
| `PROTOTYPED` | Implemented in a limited or non-production form. |
| `SHADOW VERIFIED` | Compared in shadow mode with evidence and no authority over production state. |
| `ACCEPTANCE PENDING` | Implementation exists but required acceptance evidence or independent review is incomplete. |
| `PRODUCTION APPROVED` | Required gates, evidence, and approvals are complete for the declared scope. |
| `DEPRECATED` | Must not be used for new work; retained only for migration, audit, or rollback history. |

## Current Component Status

| Component | Current status | Production authority | Notes |
|---|---|---:|---|
| Airtable operational model | `PROTOTYPED` | Partial | Operational rules and interfaces exist; Airtable is not the final transaction authority. |
| LOCK-59 Airtable guard | `PROTOTYPED` | No | Schema and guard model exist; runtime evidence is partial. |
| LOCK-59 PostgreSQL/RLS implementation | `NORMATIVE DESIGN` | No | Requires backend membership checks, exact-ID guards, RLS harness, and negative acceptance matrix. |
| BK-P0 Canonical Booking Writer | `ACCEPTANCE PENDING` | No | Durable idempotency and concurrency design exist; final controlled acceptance remains required. |
| PostgreSQL canonical authority | `NORMATIVE DESIGN` | No | Target authority for canonical operational and financial state. |
| Transactional outbox | `NORMATIVE DESIGN` | No | Proof of concept and consumer idempotency evidence required. |
| React reception schedule | `PROTOTYPED` | No | Target operational UI; must send commands through backend services. |
| Airtable projection/governance role | `NORMATIVE DESIGN` | No | Projection contract and reconciliation policy remain to be completed. |
| Financial command/journal/ledger model | `PROTOTYPED` | No | Shadow/projection model only; not production accounting authority. |
| Cedar authorization engine | `CONCEPT` | No | Evaluation candidate; requires ADR and policy benchmark. |
| AI orchestration | `CONCEPT` | No | No direct SQL or unrestricted database mutation permitted. |
| Production reliability handbook | `CONCEPT` | No | SLO, DR, incident response, deployment and runbooks remain incomplete. |

## v1.0 Publication Gates

Architecture Book v1.0 MUST NOT be published as production-governing authority until the following evidence is linked:

- BK-P0 concurrency acceptance
- Idempotency replay/conflict acceptance
- LOCK-59 negative test matrix
- Zero partial-write evidence
- Initial PostgreSQL RLS test harness
- Transactional outbox proof of concept
- Restore test plan
- Airtable projection contract
- Required architecture, backend, security, database, operations, and business approvals
