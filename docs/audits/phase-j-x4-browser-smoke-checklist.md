# Phase J-X4 Browser Smoke Checklist

This document is the manual verification checklist for the Admin Auth Adapter Cookie Mode integration, validating that `login.html` successfully exchanges a Supabase JWT for the backend's HttpOnly session cookie, and that the dashboard consumes the cookie appropriately.

## Pre-requisites
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` are provided either via `window.ENV` or replaced manually in `login.html` (for local dev testing only).
- [ ] A valid Supabase admin user exists.
- [ ] Fastify ingestion API is running.
- [ ] Static server is serving `login.html` and `boardroom.html` on the exact same domain (e.g. `localhost:80` via proxy) as the API, ensuring `SameSite=Strict` allows cookies. (Note: if testing directly across ports without a proxy, change Fastify to `SameSite=Lax` and cross-origin settings temporarily).

## Smoke Test Steps

### 1. Login UI Validation
- [ ] Navigate to `/admin/login.html`.
- [ ] Verify the "Cerberus Gate" aesthetic is intact.
- [ ] Verify there are two inputs: `IDENTITY` (email) and `PASSPHRASE` (password).
- [ ] Attempt login with invalid credentials -> Verify `ACCESS DENIED` appears, button resets.

### 2. Login Flow & Cookie Issuance
- [ ] Enter valid admin email and password.
- [ ] Click "Mührü Aç".
- [ ] Verify network tab shows `POST` to Supabase `/auth/v1/token`.
- [ ] Verify network tab shows `POST` to `/api/v1/boardroom/login` with `credentials: include`.
- [ ] Verify Response sets two cookies:
  - `santis_session` (HttpOnly=true, Secure=true)
  - `csrf_token` (HttpOnly=false, Secure=true)
- [ ] Verify browser redirects to `boardroom.html`.

### 3. Boardroom Dashboard Integration
- [ ] On `boardroom.html`, verify the `GET /api/v1/boardroom/audit-log` network request fires successfully (200 OK).
- [ ] Verify the request headers include the `Cookie: santis_session=...; csrf_token=...`.
- [ ] Perform a state-changing action (if available on the UI, or simulate a POST to `/api/v1/boardroom/logout`).
- [ ] Verify `x-csrf-token` header matches the `csrf_token` cookie value on POST/PUT/PATCH/DELETE requests.
- [ ] Verify logout clears both cookies.

**STATUS**: ARCHITECTURE PASS / BROWSER EVIDENCE PENDING

## Evidence
- **Date/Time**: 2026-05-24T07:32:23+02:00
- **Environment Tested**: Automated AI Verification (Architecture only)
- **Command Used**: `npx playwright` (aborted due to missing credentials)
- **Browser Used**: None (Headless attempted)
- **Local or Preview URL**: `file:///public/admin/login.html`
- **Result Summary**: Architecture and tests pass 100%. Real browser visual smoke test is pending valid Supabase credentials and manual user execution.
- **Known Limitation**: Cannot verify live `Supabase -> Fastify` cookie exchange without valid `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Vercel build-rate-limit may block production deploy if repeatedly triggered.
