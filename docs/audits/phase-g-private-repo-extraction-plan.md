# SANTIS_SITE — Phase G Private Repo Extraction Plan

**Date:** 2026-05-14
**Status:** DRAFT / FOR_BOARDROOM_REVIEW
**Engineer:** Antigravity (Santis OS Governance Engineer)
**Subject:** Extraction of `_archive/private-infra/` to `SANTIS_CORE`

---

## 1. Executive Summary

Phase G defines the strategic roadmap for extracting the archived private infrastructure from `SANTIS_SITE` into a dedicated, sovereign private repository: `SANTIS_CORE`. This move will finalize the Santis OS decoupling, leaving the public repository as a pure frontend/content surface while consolidating the operational runtime in a secure environment.

---

## 2. Extraction Strategy: Git Filter-Repo

To preserve the 5+ years of git history associated with the 480 archived files, the **Extraction-by-Filter** method is recommended over a simple "copy-paste."

- **Tool:** `git filter-repo` (Modern successor to filter-branch).
- **Process:** 
  1. Clone `SANTIS_SITE` into a temporary workspace.
  2. Run `git filter-repo --path _archive/private-infra/`.
  3. Re-map the directory structure to root (e.g., `_archive/private-infra/server/` → `server/`).
  4. Push the resulting history-preserved repository to the new private remote.

---

## 3. New Repository Topology: `SANTIS_CORE`

The new repository will be structured as a Sovereign Monorepo:

```text
SANTIS_CORE/
├── apps/
│   ├── api/
│   └── ingestion-api/
├── packages/
│   ├── db/
│   └── decision-kernel/
├── server/
│   ├── core/
│   ├── services/
│   └── boardroom/
├── configs/
├── scripts/
└── tests/
```

---

## 4. Dependency Management (`PUBLIC_COUPLED`)

The `packages/event-dictionary` remains the critical bridge. 

- **Strategy:** `event-dictionary` stays in the **public** repository as a shared contract surface.
- **Consumption:** `SANTIS_CORE` will consume `@santis/event-dictionary` as an external workspace dependency or via a private NPM registry.
- **Future:** Eventually, `event-dictionary` may be mirrored or replaced by a more robust Schema Registry.

---

## 5. CI/CD & Deployment Strategy

Extraction allows for absolute separation of concerns in the pipeline:

- **SANTIS_SITE CI:** Focuses on static site generation (SSG), accessibility, and SEO.
- **SANTIS_CORE CI:** Focuses on server-side tests, database migrations, and operational security.
- **Deployment:** `SANTIS_CORE` will use a private CI runner (e.g., GitHub Actions on private runner or self-hosted) to deploy to the Sovereign Infrastructure.

---

## 6. Security & Credentials

Phase E identified the SQLite `.db` files and Cerberus Auth as sensitive.

- **Extraction Rule:** The history of these files will be preserved.
- **Sanitization:** A "Credential Audit" will be performed *immediately* after extraction to ensure no development secrets are leaked into the new private repo history (even if private, hygiene is paramount).
- **Environment:** Transition from `.env` files to a secure Vault (e.g., HashiCorp Vault or GitHub Secrets) for all operational runtimes.

---

## 7. Operational Roadmap

| Phase | Milestone | Description |
| :--- | :--- | :--- |
| **G.1** | **Target Org Ready** | Creation of private GitHub Organization / Repository. |
| **G.2** | **Extraction Execution** | Running `git filter-repo` and pushing initial state. |
| **G.3** | **Dependency Re-wiring** | Updating `package.json` in both repos to point to new homes. |
| **G.4** | **CI/CD Handover** | Moving private deployment workflows to the new repo. |
| **G.5** | **Public Cleanup** | Final deletion of `_archive/private-infra/` from `SANTIS_SITE`. |

---

## 8. Explicit Non-Actions (Planning Only)

- ❌ No repository creation.
- ❌ No file extraction.
- ❌ No deletion of archived assets.
- ❌ No CI/CD changes.

---

**Status:** PLANNING_COMPLETE
**Branch:** `docs/phase-g-private-repo-extraction-plan`
**Engineer:** Antigravity (Santis OS Governance Engineer)
**Date:** 2026-05-14
