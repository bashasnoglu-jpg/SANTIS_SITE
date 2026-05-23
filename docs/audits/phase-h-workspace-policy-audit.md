# SANTIS OS — PHASE H / WORKSPACE POLICY AUDIT

- **Date/Time:** 2026-05-23T07:51:00+02:00

## Current State vs Proposed State
- **Current `develop` `.npmrc`:** Contains standard governance constraints (`engine-strict=true`, `manage-package-manager-versions=true`). It does **not** declare any workspace injection policy, relying on pnpm's default symlink behaviors.
- **Proposed Branch `.npmrc`:** The branch `copilot/update-sovereign-projects-again` introduces the global flag `inject-workspace-packages=false`.

## Workspace Impact Analysis
- **Workspace Packages Affected:** 9 active workspace packages (e.g., `packages/ui`, `admin-panel`).
- **Dependencies Analysis:** `admin-panel` currently depends on `@santis/event-dictionary` and `@santis/ui` via the `"workspace:*"` protocol. There are no explicitly defined `dependenciesMeta.*.injected` fields anywhere in the monorepo.
- **Benefits of Proposed Flag:** None proven. The current Vercel build (via Vite) resolves workspace symlinks correctly without needing to globally block package injection.
- **Risks of Proposed Flag:** Setting `inject-workspace-packages=false` globally explicitly forbids pnpm from deep-copying workspace packages. If a future architectural requirement (like a specific Vercel edge function or a rigid Docker build step) requires `injected: true` to bypass symlink resolution issues, this global flag will silently override it, causing hard-to-debug "Module Not Found" deployment failures. It introduces a brittle and unnecessary constraint.

## Recommendation and Next Actions
- **Recommendation:** **REJECT_AND_DELETE_BRANCH**
- **Rationale:** The proposed setting solves no active bugs and severely limits the flexibility of the monorepo's dependency linking strategy. The Santis OS architecture should rely on canonical pnpm v10 default workspace behaviors unless a localized `injected` override is strictly proven necessary.
- **Clear Next Action:** Proceed to securely delete the final preserved branch `copilot/update-sovereign-projects-again` without merging its changes.
