# 🏙️ SANTIS CITY OS: THE SELF-SUSTAINING METROPOLIS (V300)

## 1. Concept: "The Automated City Manager"
We are no longer just building a website. We are managing a digital city.
Layers are districts. Assets are infrastructure. Code is the law.
The **V300 City OS** is the AI Mayor that ensures every district is clean, efficient, and running at 100% capacity.

---

## 2. The 7 Protocols of Cleanliness (Integration of User & Quantum Plans)

### Protocol 1: 🌆 DOM & Layer Zoning (Ghost Hunter V3)
*   **Problem:** Illegal construction (invisible divs), roadblocks (z-index wars), abandoned lots (empty elements).
*   **Solution:**
    *   **Zoning Enforcement:** Resets all `z-index` > 9999 to strict layers (Header: 1000, Modal: 2000).
    *   **Demolition Squad:** Removes elements with `opacity: 0` + `pointer-events: auto` that block interaction.
    *   **Garbage Collection:** Deletes empty divs/spans that serve no visual or functional purpose.

### Protocol 2: 🔤 The Universal Translator (UTF-8 Matrix)
*   **Problem:** Communication breakdown (Encoding mismatch, "Ã¼" garbage).
*   **Solution:**
    *   **Deep Scan:** Reads every text file bit-by-bit.
    *   **Heuristic Fix:** Detects Windows-1254/ISO-8859-9 and forcibly rewrites as Clean UTF-8.
    *   **HTML Sanitization:** Removes archaic tags (`<center>`, `<font>`) and upgrades to HTML5 semantics.

### Protocol 3: 📦 Infrastructure Optimization (Asset Molecularizer)
*   **Problem:** Heavy traffic (4MB PNGs), potholes (404s), rust (unused CSS).
*   **Solution:**
    *   **Traffic Control:** Converts heavy PNG/JPG to WebP (avoids Logos).
    *   **Dead End Fixing:** Re-routes 404 links to the nearest valid sibling or Home.
    *   **Inventory Purge:** Deletes `assets/img` files that constitute "Dead Weight" (not referenced in any HTML/CSS).

### Protocol 4: 🔗 Network Grid Stabilization (Link & Social)
*   **Problem:** Broken power lines (Dead External Links, Redirect Loops).
*   **Solution:**
    *   **Signal Test:** Pings every external link (WhatsApp, Instagram).
    *   **Chain Resolution:** Flattens 301->302->200 chains into direct links.
    *   **Schema Validation:** Ensures `tel:` and `mailto:` links are valid.

### Protocol 5: 🧠 Memory & Cache Detox (Browser Hygiene)
*   **Problem:** Mental fog (Stale LocalStorage, Old Service Workers).
*   **Solution:**
    *   **Brainwash Script:** Injects a "Reset" command to clients that clears specific `localStorage` keys (e.g., `santis_v1_cart`).
    *   **Cache Busting:** Appends `?v=timestamp` to all CSS/JS references in HTML automatically.

### Protocol 6: 📜 Archives & Log Incineration
*   **Problem:** Bureaucratic bloat (Old temp files, logs, backups).
*   **Solution:**
    *   **The Shredder:** Deletes `.log`, `.tmp`, `.bak` files older than 7 days.
    *   **Registry Clean:** Compresses useful logs into `archives/` and wipes the rest.

### Protocol 7: ⚡ Kinetic Energy Harvesting (Performance)
*   **Problem:** Friction (Old Event Listeners, Heavy Animations).
*   **Solution:**
    *   **Listener Exorcism:** Uses `getEventListeners()` in DevTools context to find detached handlers.
    *   **GPU Offloading:** Rewrites `left/top` animations to `transform: translate3d`.

---

## 3. The Control Center (Admin Panel Workflow)

We will build a **"MASTER CLEANUP"** Module in the Admin Panel.

### The UI: "The Big Red Button" (But Better)
Instead of one button, we present a **"Tactical Nuke"** approach:

1.  **Diagnostic Phase:**
    *   User clicks **[ SCAN CITY STATUS ]**.
    *   System reports: "3 Ghosts, 12 Bad Chars, 50MB Trash".

2.  **Execution Phase:**
    *   User can toggle specialized squads:
        *   `[x] DOM Squad`
        *   `[x] UTF-8 Squad`
        *   `[x] Asset Squad`
    *   User clicks **[ ⚡ EXECUTE CLEANUP PROTOCOLS ]**.

3.  **Live Haptic Feed:**
    *   Terminal style logs stream via SSE:
        *   `> Ghost Hunter: Removed <div id="ad-wrapper">`
        *   `> Asset Ops: banner.png (4MB) -> banner.webp (200KB)`
        *   `> Encoding: 42 Files Normalized`

---

## 4. Implementation Directives

1.  **Backend (`server.py`):**
    *   Implement `V300CityEngine` class inheriting from `V100HybridEngine`.
    *   Add endpoints: `/admin/clean/master`, `/admin/scan/diagnose`.

2.  **Frontend (`admin/panel.html`):**
    *   Add the **"City Management"** Tab.
    *   Build the Terminal Output UI.

3.  **Scripts:**
    *   `tools/CITY_CLEANUP.bat` for headless execution.

---

## 5. Decision Point
Hakan, this V300 Plan unifies everything into a cohesive "City Management" system.
**Shall I proceed to PHASE 1 (Backend: V300 Engine Implementation)?**
