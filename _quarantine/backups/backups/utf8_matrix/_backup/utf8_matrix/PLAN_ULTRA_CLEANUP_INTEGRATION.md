# 🩺 SANTIS ULTRA CLEANUP: INTEGRATION MASTER PLAN

## 1. Overview
This document details the layout and logic for integrating the **"Layer Cleanup" (Katman Temizliği)** and **"Self-Healing"** modules into the Admin Panel. This transforms the "System Guard" from a passive scanner into an active maintenance console.

---

## 2. Frontend Interface Design (`admin/panel.html`)

### A. The "Action Bar" (New Component)
Located inside the "System Guard" tab, below the Audit Dashboard.

```html
<!-- ULTRA ACTIONS -->
<div class="os-card" style="margin-top: 20px; border-top: 1px solid var(--os-glass-border);">
    <h3 style="margin-bottom: 15px;">🛠️ Active Repair Modules (V100 Fixers)</h3>
    
    <div class="os-grid-2" style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        
        <!-- MODULE 1: GHOST HUNTER -->
        <div class="fixer-module">
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <h4 style="margin:0;">👻 Ghost Layer Hunter</h4>
                    <p style="font-size:11px; color:#666; margin:0;">Remove invisible z-index blockers</p>
                </div>
                <button onclick="triggerFix('ghost')" class="btn-os" id="btn-fix-ghost">EXECUTE</button>
            </div>
            <div class="progress-bar-mini" id="prog-ghost"></div>
        </div>

        <!-- MODULE 2: UTF-8 NORMALIZER -->
        <div class="fixer-module">
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <h4 style="margin:0;">🧹 UTF-8 Sanitizer</h4>
                    <p style="font-size:11px; color:#666; margin:0;">Fix encoding (Ã¼ -> ü)</p>
                </div>
                <button onclick="triggerFix('utf8')" class="btn-os" id="btn-fix-utf8">EXECUTE</button>
            </div>
        </div>

        <!-- MODULE 3: ASSET OPTIMIZER -->
        <div class="fixer-module">
            <div style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <h4 style="margin:0;">🖼️ Asset Intelligence</h4>
                    <p style="font-size:11px; color:#666; margin:0;">Compress >500KB Images (WebP)</p>
                </div>
                <button onclick="triggerFix('optimize')" class="btn-os" id="btn-fix-assets">SCAN ONLY</button>
            </div>
        </div>

    </div>
</div>
```

---

## 3. Frontend Logic (`admin/app-v2.js`)

### Function: `triggerFix(type)`

1.  **UI State:** Change Button to "Processing..." and disable.
2.  **API Call:** `POST /admin/fix/{type}`.
3.  **Response Handling:**
    *   **Success:** Show Toast ("✅ Action Completed: X items fixed").
    *   **Fail:** Show Toast ("❌ Error").
4.  **Special Case (Ghost Hunter):**
    *   This is a *Client-Side* fix for the Admin Panel itself (if it has ghosts) OR
    *   Triggers a Backend "Inject Clean Script" to `index.html`.
    *   *Decision:* For V1, this triggers the *Server* to scan HTML files for `z-index: 9999` inline styles and remove them.

---

## 4. Backend Implementation (`server.py`)

### A. Endpoint Expansion (Phase 2)

*   `POST /admin/fix/ghost`:
    *   **Logic:** Reads all HTML files. Uses Regex to find `style="...z-index: 999..."` or class definitions. Warnings only for now (Safety First).
*   `POST /admin/fix/links`:
    *   **Logic:** Scans for `href="http..."` that returned 404 in the last scan. Suggests "Wayback Machine" link or asks user for replacement.

---

## 5. Execution Steps

1.  **Modify `admin/panel.html`**: Add the HTML block above.
2.  **Update `admin/app-v2.js`**: Add `triggerFix` function.
3.  **Test**: Click "UTF-8 Sanitizer" and watch console/toast.

---
**Status:** Plan Ready. Awaiting "EXECUTE" command.
