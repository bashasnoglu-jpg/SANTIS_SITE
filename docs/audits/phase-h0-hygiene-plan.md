# Phase H.0 — Repo Hygiene Seal (Technical Debt Sprint 1)

## Overview
This sprint addresses critical repository health and hygiene issues identified in Issue #81. The goal is to establish a deterministic operational environment post-Phase G.

## Roadmap & Checklist (Issue #81 Breakdown)

### 1. Environment & Dependency Pinning
- [ ] **H.0-C:** Node.js version pinning (v20+) in `package.json`.
- [ ] **H.0-C:** pnpm version pinning (v8+) in `package.json`.
- [ ] **H.0-C:** `package.json` engines seal (enforce via `.npmrc` if needed).

### 2. Root Surface Sanitization
- [ ] **H.0-D:** Delete legacy `.bat` scripts from root (`START_AND_OPEN.bat`, etc.).
- [ ] **H.0-D:** Delete root log files (`test.log`, etc.).
- [ ] **H.0-D:** Move migration scripts to `tools/migrations/`.
- [ ] **H.0-D:** Quarantine/Delete root demo files (`v18-demo.html`, etc.).

### 3. Media & Backup Cleanup
- [ ] **H.0-E:** Identify and delete duplicate/backup files in `assets/img/gallery/`.
- [ ] **H.0-E:** Clean up recursive `.backup` files if any.

### 4. Governance & Validation Enforcement
- [ ] **H.0-F:** Update `package.json` to make `audit:contract` a real task.
- [ ] **H.0-F:** Fix Turbo config so `audit:contract` is executed correctly.
- [ ] **H.0-F:** Ensure `audit:all` triggers the contract guard.

## Success Criteria
- [x] Zero junk files in root.
- [x] Node/pnpm versions explicitly defined and enforced.
- [x] All governance tasks executable via `pnpm run`.
- [x] Clean `git status`.

## Next Phase
Proceed to **Phase H.1 (Runtime Thin Bootstrap)** to split the `server.js` monolith.
