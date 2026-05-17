# SANTIS OS — Build & Tooling Debt Inventory

## Status

Documentation-only audit.  
Focus: Build determinism, tooling authority drift, and module hybridity.

## Core Findings

Current build debt is not a package-manager conflict problem. The root package manager state is mostly healthy (pnpm).

The real issue is **build determinism and tooling authority drift**.

### 1. Missing Version Pinning
- **Node:** Node 20 is specified in `package.json`, but no local pin (`.nvmrc` or `.node-version`) exists to enforce consistency across developer environments.
- **Onboarding:** The `onboard` script references `fnm use`, but it lacks the necessary configuration file to execute deterministically.

### 2. Build Orchestration Drift
- **Vercel Conflict:** `vercel.json` contains manual artifact manipulation (`mkdir` + `cp`) that bypasses or competes with the Workspace/Turbo based build logic.
- **MPA Complexity:** Root build relies on `pnpm build:mpa && turbo run build`, indicating a dual-stage orchestration that requires normalization.

### 3. Tooling Language Sprawl
- The `scripts/` directory contains a mix of Python (30+ scripts), JavaScript, TypeScript, and MJS.
- ESM/CJS transition history is visible through mixed script conventions and decommissioned artifacts in `scripts/archive/`.
- Legacy backup files (`.js.bak`) are present in the active script path.

## Classification

| Surface | Classification | Reason |
|---|---|---|
| `pnpm-lock.yaml` | ✅ ALIVE / Package SSOT | Canonical lockfile |
| `packageManager: pnpm@10.24.0` | ✅ ALIVE | Explicit manager lock |
| `engines.node >=20 <21` | ✅ ALIVE / partial | Version range defined but not pinned locally |
| `.nvmrc` / `.node-version` | ❌ MISSING | Onboarding determinism failure |
| `vercel.json` | 🔍 REVIEW REQUIRED | Manual build orchestration drift |
| `scripts/active/*.mjs` | ✅ ALIVE | Modern governance tooling |
| `scripts/*.py` | 🔍 REVIEW REQUIRED | Legacy tooling; usage evidence pending |
| `.js.bak` files | ⚠️ GENERATED / LEGACY ARTIFACT | Backup litter |
| ESM/CJS conventions | ⚠️ DRIFT | Hybrid module debt |

## Governance Recommendations

### Phase F — Build Warning Zero
- Add `.nvmrc` or `.node-version` matching the Node 20 standard.
- Normalize Vercel build logic; decide if manual artifact copying belongs in `vercel.json` or a governed build script.
- Create a Tooling Manifest to classify all scripts (active, legacy, one-shot, generated).

## Do Not Touch
- `pnpm-lock.yaml`
- `vercel.json`
- `scripts/`

until the Build Warning Zero (Phase F) branch is opened.

---
**Bu rapor silme talimatı değildir. Bu rapor yalnızca kanıt temelli envanter ve yönetişim planıdır.** ✅
