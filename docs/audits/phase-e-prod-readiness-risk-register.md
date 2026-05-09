# SANTIS OS — Phase E Production Readiness Risk Register

> **Status:** Deployment Baseline Ready ✅ | Performance Gate Conditional ⚠️  
> **Date:** 2026-05-09  
> **Branch:** `phase-e-prod-deployment-readiness-seal`

---

## ⚖️ Executive Summary

Phase E has established a unified build and orchestration baseline. While the system is technically deployable to Vercel/Docker environments, full production readiness is currently **conditional** due to performance budget violations in the E2E suite and the use of aggressive exclusion strategies for legacy root surfaces.

---

## 🚩 Risk Inventory

| ID | Category | Title | Impact | Mitigation / Status |
|:---|:---|:---|:---|:---|
| **PERF-01** | Performance | 120 FPS Frame Budget Failure | High | Flaky/failing in full suite (8.3ms violation). Requires investigation into `requestAnimationFrame` bottlenecks in the core engine. |
| **BUILD-01** | Architecture | Root MPA Exclusion Strategy | Medium | Legacy HTML files (`tr/`, `en/`, `tools/`) are excluded from Vite build to ensure stability. These surfaces remain unbundled/legacy. |
| **DEPLOY-01** | Infrastructure | Admin Subpath Dependency | Low | `/admin` subpath mapping depends strictly on `Vite base: '/admin/'` and Vercel rewrites. Parity must be verified in pre-prod. |
| **QA-01** | Quality | Targeted vs. Full E2E | Medium | Targeted reservation flows pass (24/24), but full suite shows environment-dependent failures. |

---

## 🏛️ Governance & Audit Decisions

### AUDIT-DEC-20260509-01: Aggressive Root Exclusion
**Decision:** Exclude legacy directories (`tr`, `en`, `tools`, `templates`, `packages`, `apps`) and specific legacy files from the root Vite MPA build.  
**Rationale:** The root workspace contains a significant volume of legacy/MPA files with non-standard script tags and structural duplication. To achieve a stable production build for core marketing pages (index, hamam, etc.), these legacy surfaces were quarantined from the bundling process.  
**Impact:** Excluded pages will not benefit from cache-busting or minification in the current pipeline.

### AUDIT-DEC-20260509-02: Deployment Merge-and-Copy
**Decision:** Use a merge-and-copy strategy in `vercel.json` to unify the root MPA and the `admin-panel` SPA.  
**Rationale:** Standardizing on a single Vercel deployment while maintaining architectural separation of the admin module.

---

## 🛡️ Reality Lock Verification (Commit: 5872ef65)
- [x] No `.env` leak verified.
- [x] No `node_modules` or `dist` in index.
- [x] Port SSOT (8081 Marketing, 8080 Admin, 3030 API) verified.
- [x] Unified Build (`pnpm build`) PASS.
