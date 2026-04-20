# PLAN: Santis Ultra Audit Sentinel V4 (V100 Engine)

## 1. Executive Summary
This document outlines the upgrade path from the current Sentinel V3 (Local File Walker) to **Sentinel V4 (Ultra V100)**.
V100 uses a hybrid approach:
1.  **Network Crawler (Primary):** Checks URLs via `aiohttp` against the running `localhost:8000`. This catches server-side 500 errors, 403 forbidden, and redirection chains that a simple file walker misses.
2.  **File Walker (Fallback):** Retains the extremely fast V3 logic for deep static analysis.
3.  **UTF-8 Ironclad Core:** All reporting, logging, and path handling is strictly forced to UTF-8 to support Turkish characters perfectly.
4.  **External Link Validation:** Optionally checks `http://google.com`, etc., to ensure no broken outgoing links.

## 2. Architecture: "The Hybrid Engine"

### A. Network Layer (New)
Instead of just `os.path.exists()`, V100 performs:
```python
async with aiohttp.ClientSession() as session:
    async with session.head(url) as response:
        return response.status
```
This validates that not only does the file exist, but the *Server* can serve it correctly (MIME types, permissions).

### B. The Queue System (Enhanced)
*   **Priority Queue:** Scan critical pages (`index.html`, `booking.html`) first.
*   **Asset Deduplication:** If `style.css` is checked once, cache the result globally (already partially practiced in V3, but V100 makes it persistent).

### C. Reporting (The "Pro" feature)
*   **Output Formats:**
    *   `audit_report_<timestamp>.json` (Machine readable, full detail)
    *   `audit_report_<timestamp>.csv` (Excel compatible, for management)
*   **Fields:**
    *   `SourcePage` (Where the link was found)
    *   `TargetURL` (The broken link)
    *   `ErrorType` (404, 500, Timeout, Malformed)
    *   `Suggestion` (AI-based fix suggestion, e.g., "Did you mean /assets/img/...")

## 3. Implementation Roadmap

### Phase 1: Core Upgrade (Python Backend)
1.  Add `aiohttp` dependence.
2.  Create `NetworkSentinel` class inheriting from `SentinelEngine`.
3.  Implement `check_url_live(url)` method.
4.  Update `scan_generator` to cycle through the live server URLs instead of file paths.

### Phase 2: Data Handling & Export
1.  Create `ReportManager` class.
2.  Implement `export_csv(data)` and `export_json(data)` with `encoding='utf-8-sig'` (for Excel compatibility).
3.  Add endpoint `GET /admin/download-report?format=csv`.

### Phase 3: UI Enhancement (Admin Panel)
1.  Add "Download Report" button to System Guard panel.
2.  Add "Deep Scan" toggle (activates External Link checking).
3.  Show separate counters for "Internal vs External" errors.

## 4. Why V100? (Usage Case)
Current V3 is excellent for development (instant feedback).
V100 is for **Deployment/Production** certification. It ensures that a real user, using a real browser, will face zero errors.

## 5. Security & Performance
*   **Rate Limiting:** V100 respects the server's limits to avoid self-DDoS.
*   **Localhost Lock:** Only scans localhost to prevent accidental scanning of the entire internet.

---
**Status:** Plan Approved. Ready for Implementation Code (when requested).
