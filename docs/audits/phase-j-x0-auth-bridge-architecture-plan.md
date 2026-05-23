# Phase J-X0: Boardroom Auth Bridge Architecture Plan

## 1. Current State
- `login.html` currently posts the user's credentials (`{ passcode }`) to `/api/v1/boardroom/login`.
- The frontend inherently expects an implicit session/cookie behavior, meaning it does not read the JWT from the JSON body to manually store it.
- The Fastify ingestion API currently only supports the `Authorization: Bearer <token>` header for authentication (`fastify-auth-prehandler.ts`).

## 2. Target Architecture
- **Login Endpoint:** `/api/v1/boardroom/login` will authenticate the credentials and set an `HttpOnly` cookie containing the session token.
- **Cookie Name:** `santis_session`
- **Security Flags:**
  - `Secure: true` (Requires HTTPS or localhost)
  - `HttpOnly: true` (Prevents XSS attacks from reading the token)
  - `SameSite: Strict` (By default, ensures the cookie is only sent in a first-party context)
  - `Path: /`
  - **Lifetime:** Short-lived session to minimize attack windows.

## 3. Auth Extraction Order
The Fastify `boardroomAuthPreHandler` will be updated to respect the following order:
1. **Primary Dev/Smoke:** Prefer the `Authorization: Bearer <token>` header. This maintains compatibility for local development, API testing tools, and manual browser smoke tests.
2. **Production Fallback:** If the `Authorization` header is missing, extract the token from the `santis_session` cookie.
3. *Note: Do not remove `Bearer` support at this stage to ensure smooth transition and testability.*

## 4. CSRF Strategy
- **Requirement:** Required for state-changing routes (`POST`, `PATCH`, `DELETE`).
- **Mechanism:** Use the double-submit token strategy (a readable cookie combined with an explicit HTTP header).
- **Audit Logs:** The `GET` route for reading audit logs is considered safe and does not strictly require CSRF protection. However, any `POST` route to the audit log or future write routes must strictly enforce CSRF.

## 5. Logout
- **Endpoint:** `POST /api/v1/boardroom/logout`
- **Behavior:**
  - Clears (expires) the `santis_session` cookie.
  - Clears the CSRF cookie if present.
  - Returns a successful response for the client to handle redirection.

## 6. AdminAuth Migration
- The existing `localStorage` token mechanism in `admin-auth-adapter.js` will remain strictly as a dev-only tool.
- Production fetches will rely on the `credentials: 'include'` fetch option to ensure cookies are sent automatically.
- The UI engine will handle `401` or `403` HTTP status codes by redirecting to the login screen or showing an auth-required state.

## 7. Migration Risks
- **CORS with Credentials:** Setting `credentials: true` in CORS strictly prohibits the use of wildcard origins (`*`).
- **Same-Origin Assumption:** The cookie-based design implicitly assumes a same-origin or compatible sub-domain deployment for the Admin panel and Fastify API.
- **Cookie Domain/Path Mismatch:** Misconfigured cookie domains can lead to silent authentication failures.
- **CSRF Misconfiguration:** Incorrect implementation could block valid API mutations or leave routes exposed.
- **Transitional Risk:** Maintaining dual-support (Bearer + Cookie) requires careful testing to ensure an attacker cannot bypass CSRF by exploiting the Bearer token path.
