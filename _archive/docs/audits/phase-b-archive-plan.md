# SANTIS OS — Phase B Archive Zombie Code Safe Move Plan

> Branch: `phase-b-archive-zombie-code-safe-move`  
> Rule: `git mv`, no blind delete, no `git add .`  
> Source audit: `docs/audits/dead-code-zombie-inventory-2026-05-09.md`

---

## Purpose

Phase B archives confirmed dead / frozen / zombie surfaces without deleting history.

This phase does not refactor runtime code.  
This phase does not rewrite product behavior.  
This phase only moves confirmed legacy surfaces into `_archive/` using `git mv`.

---

## Archive Rules

```text
git mv only
no direct delete
no broad refactor
small batches
one batch = one commit
restore test artifacts after E2E
```

---

## Frozen / Archive Candidates

### Batch B1 — Low-risk root artifacts

* debug files
* old diff/stat reports
* empty forecast JSON artifacts
* duplicate ZIPs
* one-off local scripts

Action: move to `_archive/root-artifacts/`

### Batch B2 — Legacy HQ Dashboard

```text
hq-dashboard/ → _archive/legacy-hq-dashboard/
```

Reason:

* not canonical admin
* uses legacy static dashboard architecture
* superseded by `admin-panel/`

### Batch B3 — Legacy Tenant Dashboard

```text
tenant-dashboard/ → _archive/legacy-tenant-dashboard/
```

Reason:

* standalone dashboard
* not in workspace
* not part of canonical deployment path

### Batch B4 — Nexus Signaling Server

```text
nexus-signaling-server/ → _archive/nexus-signaling-server/
```

Reason:

* not in pnpm workspace
* not in CI path
* no deploy path identified

### Batch B5 — TR Masaj Backup Manual

```text
tr/masajlar/_backup_manual/ → _archive/tr-masajlar-backup-manual/
```

Reason:

* explicit backup directory
* not production route
* duplicate legacy pages

### Batch B6 — Legacy Admin Panel

```text
admin/ → _archive/legacy-admin-panel/
```

Reason:

* frozen by `admin/_DEPRECATED_ADMIN.md`
* canonical admin is `admin-panel/`
* highest-risk move, do last

---

## Verification Per Batch

```powershell
pnpm run lint
pnpm run stitch:enforce
pnpm run test:e2e -- --project=chromium tests/e2e/reservation.spec.ts
git restore tests/artifacts tests/reports
git status --short
```

---

## Non-goals

* no runtime behavior changes
* no visual refactor
* no dependency cleanup
* no package manager changes
* no source rewrite
