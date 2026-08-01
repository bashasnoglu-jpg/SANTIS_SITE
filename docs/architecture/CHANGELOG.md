# Architecture Book Changelog

All material architecture changes MUST be recorded here and linked to the relevant pull request, ADR, contract, or acceptance evidence.

## 0.9-RC2 — Draft

### Added

- Canonical GitHub location under `docs/architecture/`
- Document-control metadata
- Architecture status legend and initial component status matrix
- v1.0 publication gates

### Planned for RC2

- Corrected engineering principles
- Module communication model: synchronous command, synchronous query, asynchronous event
- Canonical Data Contract classification
- Production/non-production physical separation ADR
- Event envelope and schema-versioning contract
- Availability and Resource Claim Contract
- PostgreSQL transaction-context and RLS examples
- Official-source reference policy

### Governance

- This version is a normative draft.
- It has no production authority.
- Changes require pull-request review before merge into `develop`.
