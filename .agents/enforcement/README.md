# Santis OS Enforcement Automation

This directory contains the Phase 1: Passive Governance scripts.

## Philosophy
**Observe Before Enforce.**
These tools detect, measure, and report architectural and stylistic violations (entropy) across the Santis OS ecosystem. They operate in a strictly passive mode:
- **NO blocking** of builds or CI pipelines (`process.exit(0)` is always returned).
- **NO auto-deleting** of files.
- **NO auto-refactoring** of code.

## Available Scanners
- `detect-forbidden-imports.ts` (P0): Scans for unapproved state managers or ORMs (zustand, redux, prisma).
- `detect-package-manager-drift.ts` (P1): Scans for `package-lock.json` and `yarn.lock` shadowing the canonical `pnpm` ecosystem.
- `detect-arbitrary-tailwind.ts` (P2): Scans for Quiet Luxury UI violations like `w-[21px]` or inline `style={}` bindings.

## How to Run

To run the unified governance report manually without installing global dependencies, use `tsx` via `pnpm` (or `npx`):

```bash
# Run the unified passive report from the repository root:
pnpm dlx tsx .agents/enforcement/governance-report.ts
```

Alternatively, you can run individual checks:

```bash
pnpm dlx tsx .agents/enforcement/detect-forbidden-imports.ts
pnpm dlx tsx .agents/enforcement/detect-package-manager-drift.ts
pnpm dlx tsx .agents/enforcement/detect-arbitrary-tailwind.ts
```
