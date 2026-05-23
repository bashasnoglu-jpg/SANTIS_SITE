# SANTIS OS — PHASE J-H AUTH PROVIDER DECISION MATRIX

- **Date/Time:** 2026-05-23T08:50:00+02:00

## Current Auth Status
Currently, Santis OS operates without an authoritative session or authentication provider. The `SantisSessionContextSchema` is strictly defined in `@santis/domain-schema`, but the mechanism to generate and verify these sessions does not exist. Consequently, the `GET /api/v1/boardroom/audit-log` endpoint deterministically returns a `501 Not Implemented` response.

## Options Compared
1. **Internal Redis-backed Session Manager:** A fully custom, in-house built session store using Redis.
2. **Clerk:** A modern, developer-friendly authentication and user management platform heavily optimized for React/Next.js.
3. **Supabase Auth:** An open-source, enterprise-grade authentication system built on Postgres and Go (GoTrue), deeply integrating with Row Level Security (RLS) and JWTs.
4. **Auth0:** A robust, legacy enterprise identity provider with extensive customization options.
5. **Custom signed JWT issuer:** A lightweight, custom-built stateless JWT generator and validator.

## Decision Matrix

| Criteria | Internal Redis | Clerk | Supabase Auth | Auth0 | Custom JWT |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Multi-tenant support** | Manual build | Excellent (Organizations) | Excellent (Custom claims / RLS) | Excellent (Organizations) | Manual build |
| **Role/capability support** | Manual build | Good | Excellent (Custom JWT claims) | Good (RBAC) | Manual build |
| **HttpOnly cookie support**| Native | Yes | Yes | Yes | Native |
| **Server-side verification**| Yes | Yes (SDK/JWKS) | Yes (Fastify JWT/JWKS) | Yes (JWKS) | Yes |
| **Fastify compatibility** | Native | Moderate (Better for Next.js) | Excellent | Excellent | Native |
| **Zero-trust compatibility** | Requires heavy lifting | Good | Excellent | Excellent | Requires heavy lifting |
| **Vendor lock-in risk** | None | High | Low (Open Source) | High | None |
| **Enterprise SaaS readiness**| Low (Initial) | High | High | Very High | Low (Initial) |
| **Santis Context Mapping** | 1:1 (Custom) | Via Webhooks/Metadata | Native JWT Claims | Via Rules/Actions | 1:1 (Custom) |

## Recommended Provider Strategy
**Recommendation:** **NEEDS_HUMAN_REVIEW** (Leaning towards **ADOPT_SUPABASE_AUTH**)

*Rationale:* Given that Santis OS already utilizes `drizzle-orm` in the `@santis/domain-schema`, a PostgreSQL-based backend is highly likely. Supabase Auth perfectly aligns with this stack. It is open-source (low vendor lock-in), issues standard JWTs that can easily map to our `SantisSessionContextSchema` via custom claims, and natively supports multi-tenant boundaries. It also avoids the massive "Technical Debt" of building and maintaining an Internal Redis Manager or Custom JWT issuer. However, the final strategic decision must be ratified by the Boardroom.

## Architectural Confirmations

**Why fake auth remains forbidden:**
Implementing fake auth (e.g., hardcoded tokens or bypassed middleware) violates the core **Zero Technical Debt** and **CoreState SSOT** principles. It creates "Zombie Code" that obscures architectural vulnerabilities and risks being deployed to production, breaking the Zero-Trust mandate of Santis OS.

**Whether /api/v1/boardroom/audit-log can move beyond 501 now:**
**No.** The endpoint cannot safely move beyond `501 Not Implemented` until the Boardroom approves an auth provider and the corresponding Fastify verification middleware is implemented. 

## Recommended Phase J-I
**KEEP_501_UNTIL_AUTH_PROVIDER_APPROVED**
We must wait for the Boardroom to finalize the Auth Provider decision based on this matrix. Once approved, Phase J-I will involve installing the chosen provider's SDK (or JWKS verifier) and securely bridging it to the `SantisSessionContextSchema` in a new Fastify middleware.
