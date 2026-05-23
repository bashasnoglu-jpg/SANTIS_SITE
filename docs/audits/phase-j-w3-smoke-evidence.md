# Phase J-W3: Live Browser Smoke Evidence & Auth Bridge Plan

## Current Status
**STATUS:** PENDING USER VISUAL CONFIRMATION

*This document serves as a manual checklist for the Boardroom operator to verify the Audit Log UI functionality and security locally or on staging. It also defines the roadmap for the future production Auth Bridge.*

---

## Part 1: Visual Smoke Test Checklist

The following tests must be performed manually in the browser. Please check off each item once verified.

### 1. Fail-Closed State (Token Missing)
- [ ] Open `public/admin/audit-logs.html` in the browser.
- [ ] Verify that no network request to `/api/v1/boardroom/audit-log` is made.
- [ ] Verify that the screen prominently displays `AUTHENTICATION REQUIRED. TOKEN MISSING.`.
- [ ] Verify that the table, pagination, and filter bar are hidden.

### 2. Authorization Injection
- [ ] Open the browser Developer Console (F12).
- [ ] Execute `AdminAuth.setAuthToken('VALID_JWT_HERE')` using a token with admin/boardroom roles.
- [ ] Reload the page.
- [ ] Verify that the network request completes with `200 OK`.

### 3. Data Rendering & Pagination
- [ ] Verify that the Audit Log table renders the retrieved rows correctly.
- [ ] Verify that timestamps, events, actor IDs, and IP addresses map to the correct columns.
- [ ] Verify that the pagination indicator shows "Page 1" and the correct total count.
- [ ] Click "Next" (if applicable) and verify the table updates correctly with the new offset.

### 4. Filter Bar Behavior
- [ ] Change the "Event" filter to `auth.login` and click Search.
- [ ] Verify the table reloads and only shows `auth.login` events.
- [ ] Clear the filters by clicking "Reset" and verify the full list returns.

### 5. Drawer & XSS Escape Verification
- [ ] Click the "Inspect" button on any log entry.
- [ ] Verify the side drawer slides out smoothly.
- [ ] Verify the ID, Tenant ID, User Agent, and JSON Payload are displayed correctly.
- [ ] **Crucial Security Check:** If a payload contains `<script>alert(1)</script>`, verify it is rendered as raw text and NOT executed (HTML Escaping).
- [ ] Click the overlay or the "X" button and verify the drawer closes.

---

## Part 2: Future Auth Bridge Plan

Currently, the `AdminAuth` adapter relies on `localStorage` for testing. For production, relying entirely on `localStorage` is vulnerable to XSS token theft. The following architecture will replace it.

### Proposed Architecture: Secure HttpOnly Cookie / Short-Lived Bridge

**1. Login Endpoint Migration (`/api/v1/boardroom/login`)**
The login endpoint must be fully migrated to the Fastify ingestion API. It will authenticate the `passcode` or credentials against Supabase.

**2. Token Issuance & Storage**
Instead of returning the JWT in the response body, the API will issue a `Secure`, `HttpOnly`, `SameSite=Strict` cookie containing the JWT. 

**3. API Gateway / Pre-handler Update**
The Fastify `boardroomAuthPreHandler` will be updated to check for the JWT inside the `Cookie` header (e.g., `santis_session`) if the `Authorization: Bearer` header is absent.

**4. CSRF Protection**
Since cookies will be automatically sent, a CSRF token mechanism (or relying entirely on `SameSite=Strict` if running on the exact same domain) must be implemented for state-changing routes.

**5. Client-Side Adapter Deprecation**
Once the HttpOnly cookie is active, `admin-auth-adapter.js` will no longer need to manually inject the `Authorization: Bearer` header. It will simply act as a fetch wrapper that handles 401/403 redirects back to `login.html`.
