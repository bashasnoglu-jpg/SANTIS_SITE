# Santis OS Visual Hierarchy X-Ray

## Governance Status
- Source issue: `#195`
- Mode: TOOLING ONLY
- Runtime UI changes: NONE
- Canonical lock reference: `docs/audits/phase-vh-0-visual-hierarchy-lock.md`

## Purpose
This audit layer measures visual hierarchy drift without changing the site. It supports the VH-0 lock rules around CTA dominance, typography scale, negative space, motion restraint, and emergency override detection.

## Active Tools
- `pnpm run audit:visual-hierarchy`: scans `assets/css` and reports measured findings.
- `pnpm run audit:visual-hierarchy:strict`: fails on detected findings for future locked phases.
- `pnpm run audit:visual`: alias for the measured audit.
- `pnpm run tokens:css`: compiles `packages/design-system/theme-manifest.json` into `assets/css/tokens.css`.
- `pnpm run tokens:css:check`: verifies generated CSS token output without writing files.

## Current Guard Coverage
| Rule | Coverage |
| :--- | :--- |
| Emergency z-index | Detects `9999`, `2147483647`, and four-plus digit z-index values |
| Raw color literals | Detects CSS hex values outside ignored generated/token files |
| Important overrides | Detects `!important` pressure points |
| Oversized H2 risk | Detects section-title font-size declarations above VH-0 cap |
| Raw motion | Detects raw second-based transition/animation durations |
| Raw blur and shadows | Detects un-tokenized blur and box-shadow declarations |

## Deliberate Non-Actions
- No navbar constitutional patch was applied.
- No runtime CSS refactor was applied.
- `assets/css/tokens.css` was regenerated from `packages/design-system/theme-manifest.json` to make `tokens:css:check` deterministic.

## Validation Commands
```powershell
pnpm run audit:visual-hierarchy
pnpm run tokens:css:check
pnpm run audit:repo-boundary
pnpm run audit:workspace
```
