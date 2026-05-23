# SANTIS OS — PHASE J-I.1 SUPABASE JWT VERIFICATION AMENDMENT

- **Date/Time:** 2026-05-23T08:54:00+02:00
- **Reference:** Phase J-I (Supabase Auth Integration Design)

## Current Design Risk
In Phase J-I, the initial integration design proposed using the `SUPABASE_JWT_SECRET` for local JWT verification via HS256 (Shared Secret). However, current Supabase guidance and modern zero-trust security standards warn against relying on shared-secret verification when avoidable. Distributing the master JWT secret to API services creates an unnecessary attack vector and increases the blast radius of potential compromises.

## Preferred Verification Strategy (JWKS)
To adhere to the strictest security standards, the preferred verification path will use **Asymmetric JWT Signing (RS256) and JWKS (JSON Web Key Set)**:
1. **Asymmetric Keys:** Utilize Supabase asymmetric JWT signing keys (if configured/available on the project).
2. **JWKS Verification:** Verify incoming access tokens locally via JWKS using a robust library like `jose` (`createRemoteJWKSet` + `jwtVerify`). This requires no shared secret on the server.
3. **Payload Mapping:** Once cryptographically verified, map the trusted JWT claims into the strict `SantisSessionContextSchema`.

## Fallback Strategy
If the Supabase project configuration remains restricted to HS256/shared-secret only, **do not implement local shared-secret verification by default**. Instead:
- Prefer Supabase Auth server verification (network roundtrip) over sharing the root secret.
- **OR** keep the route `501 Not Implemented` until the Boardroom explicitly approves the security tradeoff of distributing the shared secret.

## Required Environment Variables (Preferred JWKS Mode)
- `SUPABASE_URL`: The project URL.
- `SUPABASE_JWKS_URL`: The endpoint to fetch the public keys (can often be derived from `SUPABASE_URL`, e.g., `<URL>/auth/v1/jwks`).

## Required Claims for SantisSessionContextSchema
The verification middleware will extract and validate the following standard and custom claims:
- `sub` (maps to `operatorId`)
- `exp` (expiration)
- `iat` (issued at)
- `app_metadata.santis.tenantId`
- `app_metadata.santis.roles`
- `app_metadata.santis.capabilities`

## Architectural Confirmations
- **No middleware implemented:** This is a documentation-only security amendment. No Fastify or `jose` code was written.
- **No endpoint behavior changed:** The system remains structurally identical.
- **Audit-log route remains 501:** The endpoint `GET /api/v1/boardroom/audit-log` strictly returns `501 Not Implemented`.

## Recommended Phase J-J
**Phase J-J:** Implement the **JWKS-based Fastify auth context adapter** using the `jose` library, *only after* the asymmetric signing/JWKS strategy is approved by the Boardroom. Until then, `ingestion-api` remains safe behind its 501 shield.
