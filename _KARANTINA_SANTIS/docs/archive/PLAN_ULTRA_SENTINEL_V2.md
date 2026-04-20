# 🛡️ SANTIS ULTRA SENTINEL V2 - ZERO ERROR ARCHITECTURE

## 🔬 Deep Analysis of Current System Integrity

### Critical Structural Flaws Identified
1.  **Disconnected Logic:** `panel-v2.html` calls functions (`addNewSlot`, `saveSettings`, `updateHeroPreview`) that simply *do not exist* in `app-v2.js`. This is a guaranteed runtime crash.
2.  **Server Protocol Mismatch:** The frontend sends AI requests to `POST /admin/generate-ai`, but the backend (`server.py`) has no route listener for this specific path. It effectively "ghosts" the request.
3.  **Audit Fragility:** The current audit relies on spawning an external Node.js process (`audit-engine.js`). This introduces OS-level dependency risks (PATH issues, Node version mismatches).
4.  **Sync Blocking:** Standard requests (like the current audit) block the server. A proper "Ultra" system must be **Asynchronous** to keep the admin panel responsive during deep scans.

---

## 🏗️ THE "ZERO ERROR" EXECUTION MASTER PLAN

### PHASE 1: THE KERNEL PATCH (Server-Side)
**Objective:** Establish 100% reliable communication channels.

1.  **Implement `POST /admin/generate-ai`:**
    *   **Input Validation:** Strict Pydantic model (`AIRequest`).
    *   **Error Handling:** Try/Catch block around the Gemini API call with fallback text generation if AI is offline.
    *   **CORS:** Ensure headers allow requested content types.

2.  **Native Python Crawler Integration:**
    *   Eliminate `node audit-engine.js`.
    *   Create `class SentinelEngine` directly within the Python environment.
    *   **Benefit:** Direct access to file system (checking `assets/img`) without HTTP overhead.

### PHASE 2: THE BRAIN TRANSPLANT (Client-Side)
**Objective:** Eliminate "ReferenceError" completely.

1.  **Hydrate `app-v2.js`:**
    *   Implement `addNewSlot()`: Must create HTML dynamically for the 8-slot grid.
    *   Implement `updateHeroPreview()`: Real-time binding between inputs and the visual preview box.
    *   Implement `saveSettings()`: Fetch API call to `POST /api/settings`.
    *   Implement `triggerUpload()`: A robust mock for file selection (or true upload if requested).

2.  **State Management:**
    *   Introduce a global `AppState` object to track dirty forms (unsaved changes warning).

### PHASE 3: THE SENTINEL STREAM (Real-Time Audit)
**Objective:** Matrix-style live feedback.

1.  **Protocol:** Server-Sent Events (SSE).
    *   **Why?** WebSockets are overkill/complex for one-way status, HTTP polling is slow. SSE is perfect for "Progress Bars".
2.  **Event Types:**
    *   `SCAN_START`: Initializes UI.
    *   `ASSET_CHECK`: `{ url: "img/logo.png", status: 200 }`
    *   `LINK_BROKEN`: `{ url: "/bad-link", source: "index.html" }` (Red Flag).
    *   `COMPLETE`: Generates the final score.

---

## 🛡️ "Zero Error" Verification Checklist
*Before declaring success, we must verify:*
1.  Clicking "AI Generate" returns text, not a 405 error.
2.  Clicking "New Slot" adds a visible card to the grid immediately.
3.  The Audit runs to completion without freezing the browser tab.

**Approving this plan authorizes the immediate rewriting of `server.py` and `app-v2.js` to match these strict specifications.**
