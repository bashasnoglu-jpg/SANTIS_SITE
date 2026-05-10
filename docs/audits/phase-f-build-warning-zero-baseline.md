# SANTIS OS — Phase F Build Warning Zero Baseline

## Status

Baseline capture only.  
No delete. No archive. No refactor.

## Branch

`phase-f-build-warning-zero-baseline`

## Command

```powershell
pnpm build
```

## Result

Build completed successfully.

```text
Root MPA: PASS
Turbo build: PASS
Tasks: 3 successful, 3 total
```

## Warning Inventory

### F1 — HTML Parse Warning

`404.html` has a parse5 warning:

```text
Unable to parse HTML; parse5 error code end-tag-without-matching-open-element
404.html:98
```

Likely malformed metadata / OpenGraph line.

### F2 — Legacy Script Module Warnings

Multiple HTML entrypoints include classic scripts that Vite cannot bundle without `type="module"`.

Examples:

```text
bronz-masaji.html
bio.html
booking.html
checkout.html
cilt-bakimi.html
hakkimizda.html
masaj.html
service-detail.html
```

This is not a deletion issue.
It is a runtime contract and bundler compatibility issue.

### F3 — CSS Import Ordering Warnings

`assets/css/style.css` emits repeated warnings:

```text
@import rules must precede all rules aside from @charset and @layer statements
```

The `santis-v6/*` chain is ALIVE and must not be archived.
Fix must preserve active CSS behavior.

### F4 — Bundle Size Warnings

Root build warning:

```text
dist/assets/js/tests_reports_html_index-*.js > 400 kB
```

Admin Panel warning:

```text
vendor-3d-calendar-*.js > 600 kB
```

These require classification before optimization.

### F5 — Generated/Test Report Leakage Into Build Output

Build output includes:

```text
dist/tests/reports/html/index.html
dist/assets/js/tests_reports_html_index-*.js
```

This indicates test report surfaces are being picked up by the root MPA build graph.

Rule 5 applies before any removal or archive.

### F6 — Turbo Stale PID Warning

Turbo reports:

```text
WARNING stale pid file at ...\turbod.pid
```

This is local tooling hygiene, not application failure.

## Phase F Proposed Order

1. F0 — Baseline document commit only.
2. F1 — Fix `404.html` malformed metadata.
3. F2 — Exclude generated test reports from root MPA input graph.
4. F3 — Normalize CSS import ordering without touching `santis-v6` semantics.
5. F4 — Classify legacy script module warnings.
6. F5 — Bundle size review and chunk strategy.

## Gates Required After Every Fix

```powershell
pnpm build
pnpm run stitch:enforce
pnpm run lint
pnpm run test:e2e -- --project=chromium tests/e2e/reservation.spec.ts
git status --short
```

## Governance

This baseline is not a fix PR.
It records the exact warning surface before intervention.

Rule 5 remains active:
No direct delete. Quarantine first.
