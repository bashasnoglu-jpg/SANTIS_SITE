# Sovereign Git Flow Policy

## 1. Canonical Branch Hierarchy

All development and maintenance work in Santis OS must follow the defined branch hierarchy:

- **`main`**: Production-ready source. Only merged via PR.
- **`develop`**: Integration and staging hub. All feature/fix work targets this branch first.
- **`feature/*`**: New products, UI features, or business logic.
- **`fix/*`**: Bug fixes for identified issues.
- **`chore/*`**: Tooling, configuration, dependencies, and repo hygiene.
- **`refactor/*`**: Structural changes that do not alter behavior.
- **`docs/*`**: Documentation, audit reports, and governance updates.
- **`hotfix/*`**: Urgent production fixes branched directly from `main`.
- **`archive/*`**: Frozen branches preserved for historical record.

## 2. Forbidden Branch Names

Generic or individual-focused names are strictly prohibited to prevent management drift:
- `test`, `new`, `final`, `son`, `duzeltme`, `hakan`, `main-copy`, etc.

## 3. Merge Policy

- **Docs-only PRs**: May be squashed directly into `main` after review.
- **Implementation Work**: Must start from `develop` and be merged back to `develop` before final sealing into `main`.
- **Production Emergency**: Use `hotfix/*` branched from `main`.
- **Rule 5 Compliance**: All cleanup, archival, or removal work must obey **Rule 5 — Quarantine First**.

## 4. Phase F Governance

During Phase F (Build Warning Zero) and restoration phases:
- **No Direct Deletion**: Suspicious code must be quarantined first.
- **No Broad `git add .`**: Only stage targeted, audited changes.
- **Quarantine Move**: Use `_archive/phase-0-dead-code/` for structural moves.

## 5. Required Governance Gates

Every PR must pass the following gates before merge:
1. `pnpm run stitch:enforce`: Design system and visual truth validation.
2. `pnpm run lint`: Code quality and pattern compliance.
3. `Reservation E2E`: Required for any work affecting the core runtime or booking flow.

---
**Sovereign Git Flow: SEALED. 🔐**
