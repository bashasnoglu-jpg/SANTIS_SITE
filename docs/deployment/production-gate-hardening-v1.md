# Production Gate Hardening v1

## Scope

This record applies only to `hardening/production-gates`, branched from:

`develop@5250f8d206e96aaef1d159b0dce91f4d0d8a1837`

It does not grant `main` integration, production deployment, or production authority.

## 1. Deploy Gate fail-closed semantics

`.github/workflows/deploy-gate.yml` captures the status of both the Python gate and `tee`
through Bash `PIPESTATUS`. The reporting pipeline is allowed to complete so the report
artifact can still be uploaded, and the following `Gate Check` step converts any non-zero
captured exit status into a failed workflow.

Required invariant:

- Python gate failure cannot be hidden by a successful `tee`.
- `tee` failure cannot be hidden by a successful Python process.
- the report upload remains `if: always()`.

## 2. Rollback telemetry boundary

Rollback execution must never depend on runner-local `localhost:3030`.

`TELEMETRY_ENDPOINT` is now sourced from the GitHub Actions variable
`vars.TELEMETRY_ENDPOINT`. Telemetry is best-effort and may not block emergency rollback.

Production operator requirements:

- if configured, the endpoint must be HTTPS and reachable from a GitHub-hosted runner;
- telemetry configuration is not a prerequisite for image pull/re-tag/push;
- rollback continues to require the GitHub `production` Environment.

No telemetry endpoint value is committed to the repository.

## 3. Node 20 runtime contract

The public project already declares Node 20 in the root `package.json`.
This hardening package adds an explicit `20.x` engine contract to:

- `admin-panel/package.json`
- `apps/admin-bff/package.json`

The repository runtime contract is therefore Node 20 across the public build, Admin Panel,
and Admin BFF. Vercel project settings must not be used to widen this contract.

## 4. Admin BFF production binding contract

The browser-facing Admin Panel preserves same-origin calls:

`Browser -> https://<admin-origin>/api/admin/*`

Vercel then proxies those calls to:

`${ADMIN_BFF_SERVICE_ORIGIN}/api/admin/*`

The route is declared in `admin-panel/vercel.json` using the deployment variable
`ADMIN_BFF_SERVICE_ORIGIN`.

The variable MUST:

- be configured only through Vercel environment configuration;
- contain an HTTPS origin with no embedded credentials;
- point to the dedicated Admin BFF service;
- never point back to the Admin Panel origin;
- never be committed as a literal repository value.

The Admin BFF service must independently configure `ADMIN_PUBLIC_ORIGIN` to the canonical
Admin Panel browser origin. Existing Origin/Fetch-Metadata/session authorization checks
remain authoritative.

If `ADMIN_BFF_SERVICE_ORIGIN` is absent or invalid, release is fail-closed. Production
promotion is not eligible until a deployment-level read-back proves the route and a
same-origin `/api/admin/session` smoke request reaches the Admin BFF.

## Verification boundary

The branch CI may verify repository configuration, buildability, and mechanical pipeline
semantics. It MUST NOT perform a production deployment, production rollback, `main`
mutation, or production image promotion.
