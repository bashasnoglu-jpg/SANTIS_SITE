# 🛡️ SANTIS ULTRA SENTINEL V3 - GLOBAL UTF-8 CORE

## 1. STRATEGIC FUSION: The "Universal Language" Standard
We are merging the "Zero Error" architecture (Sentinel V2) with the "Universal UTF-8" requirement (User's Vision).

**Core Philosophy:**
The system must not only *display* data correctly but *process, store, and export* it with encoding infallibility. Valid for Turkish, English, and potential future languages (Arabic, Russian, etc.).

---

## 2. THE NEW ARCHITECTURE: SENTINEL V3

### A. The "UTF-8 Ironclad" Pipeline (Data Flow)
Every byte of text that enters or leaves the system passes through a normalization checkpoint.

1.  **Ingestion (Crawler):**
    *   **Input:** Raw HTML/Assets from file system or network.
    *   **Process:** Python `text.encode('utf-8', errors='replace').decode('utf-8')` + `unicodedata.normalize('NFC')`.
    *   **Result:** All "bozuk" characters (ü ”“) are instantly repaired or flagged.

2.  **Processing (Python Backend):**
    *   **FastAPI:** Configured to enforce `content-type: application/json; charset=utf-8`.
    *   **File I/O:** All `open()` calls use `encoding='utf-8-sig'` (The `-sig` is crucial for Excel compatibility in Windows!).

3.  **Visualization (Admin Panel):**
    *   **HTML Headers:** `<meta charset="UTF-8">` is non-negotiable.
    *   **Fetch API:** Explicitly requesting `Accept-Charset: utf-8`.

4.  **Export (Downloads):**
    *   **CSV Magic:** Prepend `\uFEFF` (Byte Order Mark) so Excel opens Turkish characters correctly without "Import Wizard" hassle.
    *   **JSON:** Pretty-printed, unescaped unicode (`ensure_ascii=False`).

### B. The Engine (Implementation Details)

#### 1. Server-Side (`server.py` & `admin/sentinel.py`)
*   **SentinelEngine Class:** A new automated crawler inheriting from `HTMLParser`.
*   **Endpoints:**
    *   `POST /admin/generate-ai`: **UTF-8 In/Out** for prompted text.
    *   `GET /admin/audit-stream`: **SSE Stream** encoded in UTF-8.
    *   `POST /api/settings`: Saves `theme.json` with perfect encoding.

#### 2. Client-Side (`app-v2.js`)
*   **Rebuilt Functions:**
    *   `addNewSlot()`: Generates UTF-8 safe HTML elements.
    *   `exportData()`: Updated to generate the BOM-prefixed CSVs.
*   **State Management:** Reactive updates.

---

## 3. EXECUTION STEPS (The "Zero Error" Path)

### PHASE 1: THE SERVER CORE (UTF-8 Hardening)
1.  **Rewrite `server.py`:**
    *   Implement `SentinelEngine` (The Crawler).
    *   Implement `POST /admin/generate-ai` (The AI Brain).
    *   Implement SSE Streaming logic using `async generators`.
    *   **Key Tech:** `aiofiles` for non-blocking, encoding-aware file operations.

### PHASE 2: THE BRAIN TRANSPLANT (Frontend Logic)
1.  **Rewrite `app-v2.js`:**
    *   Add missing `addNewSlot` logic (8-grid system).
    *   Add `updateHeroPreview` (Real-time visual feedback).
    *   Add `saveSettings` (Data persistence).
    *   Add `exportAuditCSV` (The UTF-8 w/ BOM generator).

### PHASE 3: NEURO-SYNC DATA ARCHITECTURE (Signal-Based Hardening)
1.  **Event-Driven Standardization:**
    *   **Goal:** Eliminate "Race Conditions" where scripts run before data is ready.
    *   **Mechanism:** Standardize on `product-data:ready` signal dispatched by `product-data.js`.
    *   **Adoption:** Update `home-products.js`, `category-engine.js`, `card-manager.js`, and `app-admin.js` to listen for this specific signal.
    *   **Deprecation:** Remove `SantisCatalogReady` and `window.NV_DATA_READY` polling loops.

### PHASE 4: THE COMPATIBILITY LAYER
1.  **Verify & Backup:**
    *   Ensure `product-data.js` and `home_data.json` are read/written keeping accents (ş, ı, ğ) intact.

---

## 4. IMMEDIATE ACTION
I will now execute **Phase 1 & 2 simultaneously** by providing the complete, fused code for `server.py` and `app-v2.js`.
This supersedes all previous "patch" attempts. We are deploying the **V3 Engine**.
