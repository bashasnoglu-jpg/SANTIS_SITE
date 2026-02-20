# 🏗️ SANTIS CLUB v5.0 - ULTRA MEGA CMS MASTER PLAN

**Status:** 🚀 BLUEPRINT (Ready for Execution)
**Concept:** Transforming the site into a manageable SaaS Product.

---

## 📅 DEVELOPMENT ROADMAP (Geliştirme Yol Haritası)

The transformation covers 7 distinct phases to achieve "Ultra Mega" status.

### PHASE 1: INFRASTRUCTURE (ALTYAPI)
**Goal:** Move from JSON files to a robust SQL Database.
*   **Action:** Install `sqlalchemy` & `aiosqlite`.
*   **Database:** Create `santis.db` with tables:
    *   `users`, `roles`, `pages`, `blocks`, `services`, `media`, `ai_logs`.
*   **Result:** A solid foundation for complex data relationships.

### PHASE 2: SECURITY & ROLES (GÜVENLİK)
**Goal:** Secure the Admin Panel.
*   **Action:** Implement JWT (JSON Web Tokens) Authentication.
*   **Roles:**
    *   `Admin`: Full Control.
    *   `Editor`: Content Editing.
    *   `AI Writer`: Can only generate text.
*   **Result:** Secure login system `/admin/login`.

### PHASE 3: ADVANCED AI ENGINE (YAPAY ZEKA)
**Goal:** Parametric Content Generation.
*   **Action:** Upgrade AI Endpoint to accept params:
    *   `Tone`: Luxury, Minimal, Warm.
    *   `Length`: Short, Medium, Long.
    *   `Purpose`: SEO, Product, Script.
*   **Result:** High-quality, context-aware content generation.

### PHASE 4: MEDIA ENGINE (MEDYA MOTORU)
**Goal:** Automated Image Optimization.
*   **Action:** Build a processing pipeline using `PIL`.
    *   Upload JPG/PNG -> Auto-Convert to **WebP**.
    *   Auto-Resize (Thumbnail generation).
*   **Result:** Faster loading speeds, Google-friendly images.

### PHASE 5: PAGE BUILDER (SAYFA YAPICI)
**Goal:** No-Code Page Creation.
*   **Action:** Implement "Block System".
    *   Store pages as JSON arrays of blocks (`hero`, `gallery`, `text`).
    *   Frontend renders these blocks dynamically.
*   **Result:** Admin can create unique landing pages without coding.

### PHASE 6: PERFORMANCE MODES (PERFORMANS)
**Goal:** Dynamic System Tuning.
*   **Action:** Admin Toggles in database.
    *   `perf_mode`: High/Low (Reduces animation).
    *   `mobile_lite`: Disable effects on phones.
*   **Result:** Instant control over site heaviness.

### PHASE 7: ANALYTICS (ANALİTİK)
**Goal:** System Health & Usage Tracking.
*   **Action:** Dashboard Widgets.
    *   Page Views, AI Cost, Error Logs.
*   **Result:** Total visibility into system operations.

---

## 🚀 EXECUTION ORDER

1.  **Currently at:** V4 (JSON Files).
2.  **Next Step:** **PHASE 1 (SQL Migration)**.
    *   We need to create `database.py` and define Models.
    *   Migrate existing `services.json` to SQL.

**Komutunuzla PHASE 1'e başlıyorum.**
