# SANTIS OS — PHASE J-I SUPABASE AUTH INTEGRATION DESIGN

- **Date/Time:** 2026-05-23T08:52:00+02:00

## Architecture Overview
The Boardroom has officially selected **Supabase Auth** as the trusted Session & Identity Provider for Santis OS. This document outlines the architectural blueprint for integrating Supabase JWTs with our strict `SantisSessionContextSchema` via Fastify middleware.

## Integration Design Decisions

### 1. JWT Claim Mapping to SantisSessionContextSchema
Supabase JWTs contain standard claims (`sub`, `aud`, `exp`, `iat`) and a specialized `app_metadata` object (which is read-only for clients, unlike `user_metadata`). We will map the Supabase JWT claims to the `SantisSessionContextSchema` as follows:
- `sessionId`: Mapped from the JWT `session_id` or generated securely.
- `operatorId`: Mapped directly from the Supabase JWT `sub` (User ID).
- `issuedAt`: Mapped from `iat`.
- `expiresAt`: Mapped from `exp`.

### 2. Source of tenantId
The `tenantId` must **never** be trusted if it comes from a client-side HTTP body or header. Instead, it will be securely embedded inside the JWT's `app_metadata.santis.tenantId` claim. Supabase Auth Custom JWT Claims (via Hooks) or a trusted admin API will inject this `tenantId` when the token is minted.

### 3. Source of Roles and Capabilities
Similar to the tenant scope, `roles` and `capabilities` will be stored securely inside `app_metadata.santis.roles` and `app_metadata.santis.capabilities`. This guarantees that operators cannot escalate their own privileges (since `app_metadata` cannot be updated directly from the client). The Fastify middleware will extract these arrays and feed them directly into `OperatorRoleSchema` and `OperatorCapabilitySchema`.

### 4. Fastify Middleware Responsibilities
The future Fastify middleware (Phase J-J) will perform the following deterministic steps:
1. Extract the JWT from the `Authorization: Bearer <token>` header.
2. Verify the JWT cryptographic signature using the `SUPABASE_JWT_SECRET`.
3. Check the `exp` claim to ensure the token has not expired.
4. Extract the `sub` and `app_metadata.santis` payloads.
5. Parse the extracted payload strictly through `SantisSessionContextSchema.parse()`.
6. Attach the validated `SantisSessionContext` object to the Fastify `request` object (e.g., `request.santisContext`).
7. Reject the request immediately (returning `ERR_UNAUTHORIZED` or `ERR_FORBIDDEN`) if any step fails.

### 5. Moving Beyond 501 Not Implemented
The `GET /api/v1/boardroom/audit-log` endpoint must remain at `501 Not Implemented` until:
- The Fastify middleware (described above) is fully implemented and tested.
- The middleware is successfully mounted to the `/v1/boardroom` route prefix.
- Only then can the route safely return live data, knowing that every incoming request has a cryptographically verified `SantisSessionContext`.

### 6. Required Environment Variables
To achieve secure, stateless backend verification without making a network roundtrip to Supabase for every API call, the `apps/ingestion-api` will require the following environment variables:
- `SUPABASE_URL`: The project URL (for potential SDK usage).
- `SUPABASE_JWT_SECRET`: The symmetric key used to verify the HS256 signature of the Supabase JWTs locally in Fastify.

## Conclusion & Next Steps
This design solidifies the "Zero-Trust" boundary. Supabase provides the cryptography and identity management, while Santis OS (`@santis/domain-schema`) enforces the strict data shape and capabilities.

**Recommended Phase J-J:** Proceed to implement the Supabase SDK, JWT verification middleware in `apps/ingestion-api`, and the necessary environment variables configuration.
