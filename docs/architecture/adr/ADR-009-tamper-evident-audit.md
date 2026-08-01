# ADR-009 — Tamper-Evident Audit

**Status:** Proposed  
**Decision Type:** Security and Compliance Architecture  
**Version:** 0.9-RC2  
**Production Authority:** No

## Context

Santis OS must preserve evidence for security-sensitive, financial and operational mutations. Ordinary application logs are insufficient because they may be incomplete, mutable, environment-specific or inaccessible during an incident. A normal PostgreSQL table is not absolutely immutable because privileged administrators can alter it.

The platform therefore requires audit records that are append-oriented, access-controlled and capable of revealing unauthorized modification without storing unnecessary personal data.

## Decision

Santis OS SHALL implement a tamper-evident audit architecture.

Audit records MUST be written through a dedicated audit interface and SHOULD be append-only at the application privilege level. Critical audit sequences SHALL support cryptographic integrity verification through a hash chain, Merkle-style checkpoint or equivalent reviewed mechanism.

Periodic signed checkpoints MUST be stored outside the primary application database in independently controlled object storage or an equivalent trust boundary.

The audit system is not a replacement for canonical domain records, observability logs or legal retention policy.

## Normative Requirements

- Every successful high-risk mutation MUST create audit evidence.
- Rejected security-sensitive commands SHOULD create audit evidence without exposing secrets.
- Audit records MUST include actor identity or actor reference, actor type, action, resource type, resource identifier, tenant scope, reason code, trace identifier and timestamp.
- AI-originated actions MUST be distinguishable from human and system actions.
- Audit payloads MUST minimize PII and MUST NOT copy free-text health notes, credentials, payment secrets or unnecessary customer data.
- Application roles MUST NOT have UPDATE or DELETE privileges on audit records.
- Audit-writer privileges MUST be separate from ordinary domain-writer privileges where operationally practical.
- Integrity verification MUST be repeatable and documented.
- Checkpoint creation, storage and verification failures MUST be observable.
- Retention, deletion exceptions and legal holds MUST be governed by approved policy and local legal review.
- Hashing or encryption MUST NOT be described as automatically satisfying GDPR or Montenegro privacy law.

## Alternatives Considered

### Ordinary application logs only

Rejected because they do not provide sufficient mutation evidence, retention guarantees or tamper detection.

### Database triggers as the sole audit mechanism

Rejected because hidden trigger behavior can create coupling, may omit application context and remains controlled by the same database authority.

### Blockchain anchoring

Deferred. It adds cost and operational complexity without being necessary for the current assurance level.

### Fully immutable external ledger from day one

Deferred until regulatory or enterprise requirements justify the additional infrastructure.

## Consequences

### Positive

- Improves incident investigation and accountability.
- Makes unauthorized historical modification detectable.
- Separates business truth from audit evidence.
- Supports enterprise review and financial-control evidence.

### Negative

- Requires key management, checkpoint verification and retention operations.
- Hash chains complicate partitioning, repair and high-throughput ingestion.
- Legal retention and erasure requirements require careful data minimization.
- Privileged administrators can still disrupt the system; the design is tamper-evident, not absolutely immutable.

## Evidence Required

Production acceptance requires:

- append-only application privilege tests,
- audit coverage tests for critical commands,
- tamper simulation and verification failure detection,
- signed checkpoint generation and external storage proof,
- restore and re-verification procedure,
- PII review,
- retention and legal-hold policy,
- audit-writer credential rotation procedure,
- security reviewer approval.

## Related Documents

- `volume-1-architecture-principles/02-engineering-principles.md`
- `volume-1-architecture-principles/04-failure-philosophy.md`
- `volume-2-technical-architecture/08-module-communication.md`
- ADR-002 — PostgreSQL as Canonical Authority

## Current Decision Status

**Normative Design / Production Not Approved**
