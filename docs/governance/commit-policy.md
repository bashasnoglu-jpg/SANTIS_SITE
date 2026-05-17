# SANTIS OS — Commit Message Standard (Conventional Commits)

This document formalizes the commit message standard for Santis OS. Adherence to this standard is mandatory for all contributors and AI agents.

## 1. Core Principles
- **Clarity**: Messages must clearly explain *what* changed and *why*.
- **Consistency**: Use lowercase for the type and a concise summary.
- **Convention**: Follow the `<type>: <description>` format.

## 2. Canonical Types

| Type | Description | Example |
| :--- | :--- | :--- |
| `feat` | New application features or architectural components. | `feat: add sovereign booking flow shell` |
| `fix` | Bug fixes or defect resolutions. | `fix: repair pnpm lock mismatch on vercel` |
| `chore` | Tooling, cleanup, dependencies, or maintenance. | `chore: archive legacy navbar engines` |
| `refactor` | Code changes that neither fix a bug nor add a feature. | `refactor: isolate corestate boundary validation` |
| `docs` | Documentation, rules, and audit reports. | `docs: add phase 0 reality lock audit` |
| `test` | Adding missing tests or correcting existing tests. | `test: add booking flow smoke test` |
| `perf` | A code change that improves performance. | `perf: reduce layout shift in hero frame` |
| `security` | Security-related changes or hardening. | `security: restrict ingestion api cors origins` |

## 3. Phase 0 Examples

### Documentation Audits
```bash
git add docs/audits/phase-0-reality-lock.md
git commit -m "docs: add phase 0 reality lock audit"
```

### Quarantining Legacy Code
```bash
git add .
git commit -m "chore: quarantine legacy dead code candidates"
```

### Governance Establishment
```bash
git add .
git commit -m "chore: establish git flow governance"
```

## 4. Integration with PRs
- All commits in a PR should follow this standard.
- The PR title itself should also follow the conventional format to ensure clean merge histories.
