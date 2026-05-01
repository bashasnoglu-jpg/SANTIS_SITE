# Santis OS Archive Policy

This document defines the policy for managing legacy, zombie, and experimental code within the Santis OS ecosystem.

## Definition of Archive Code

Code stored in `assets/js/_archive/` (and similar `_archive` directories across the workspace) is considered **zombie code** or **inactive legacy code**. This code is:
- **NOT** executed as part of the live production runtime.
- **NOT** actively maintained.
- **NOT** guaranteed to pass modern CI checks (such as the Localhost Leak Audit).

## The Rule of Non-Intervention

Refactoring inactive code is an anti-pattern. We do not invest engineering effort into modernizing code that is not actively used. Therefore:

1. **Audit Exclusions**: The `assets/js/_archive` directory is permanently whitelisted in security and architecture audits (e.g., `scripts/audit-localhost-leak.js`).
2. **No Bulk Refactoring**: We do not perform sweeping changes (like migrating to `getRuntimeConfig()`, updating imports, or fixing TypeScript types) on files inside `_archive/`.

## Restoration Policy

If a file currently in `_archive/` is deemed necessary for the active runtime again:
1. It MUST be moved **out** of the `_archive/` directory to its proper canonical location (e.g., `assets/js/modules/`).
2. It MUST be fully refactored and modernized to meet all current architectural standards (e.g., `getRuntimeConfig()` for API routes, proper `SovereignBus` usage, UI consistency).
3. Once moved and refactored, it will naturally fall back under the strict CI audit enforcement.
