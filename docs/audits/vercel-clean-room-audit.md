# Vercel Clean Room Audit

Date: 2026-05-26
Mode: Read-only / no production mutation

## Projects Reviewed

### sovereign-os
Role: Canonical public production shell
Status: Active
Build: npm run build / public output
Env Vars: None found in production
Custom Domain: None found

### santis-site-admin-panel
Role: Canonical admin panel
Status: Active
Build: pnpm --filter admin-panel build / admin-panel/dist
Env Vars: None found in production
Custom Domain: None found

### santis-core
Role: Legacy / delete candidate
Status: Stale
Action: Do not delete until repo/deploy ownership is confirmed

## Domain Findings

No custom domains found on the Vercel account.

## Environment Variable Findings

No production environment variables found on the reviewed Vercel projects.

Risk:
- No Vercel-side secret exposure observed.
- Repo-side hardcoded secrets still need separate scan.
- Runtime may be incomplete if production needs Supabase, bypass tokens, API keys, or internal backend URLs.

## Canonical Topology

- Public app: sovereign-os
- Admin app: santis-site-admin-panel
- Legacy candidate: santis-core

## Next Actions

1. Remove temporary Vercel audit directory.
2. Verify `.vercel/project.json` is bound only to the intended canonical project.
3. Run repo-side secret scan.
4. Confirm production deploy URLs and latest commit mapping.
5. Only after evidence, consider archiving or deleting `santis-core`.
