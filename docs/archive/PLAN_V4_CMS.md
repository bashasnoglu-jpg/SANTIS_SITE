# 🏗️ SANTIS CLUB v4.0 - DYNAMIC CMS ARCHITECTURE PLAN

**Status:** 📅 DRAFT (Planning Phase)
**Goal:** Transition from Static Site to Admin-Managed AI-CMS.

---

## 1. 🏛️ SYSTEM ARCHITECTURE (Sistem Mimarisi)

Moving from "Static HTML" to "API-Driven Architecture".

**Components:**
1.  **Backend (The Brain):** `server.py` (FastAPI)
    *   Serves API Endpoints (`/api/services`, `/api/config`).
    *   Manages "Database" (JSON Files for simplicity & speed).
    *   Handles AI Generation via Gemini.
2.  **Admin Panel (The Cockpit):** `admin/panel.html`
    *   **Dashboard:** System Status.
    *   **Content Manager:** Add/Edit text, images, tags.
    *   **AI Lab:** Generate descriptions using prompts.
    *   **Config:** Toggle Animations (Quiet/Loud Mode), SEO Settings.
3.  **Frontend (The Face):** `index.html` & `pages/`
    *   Becomes "Reactive". Instead of hardcoded text, it fetches content from `server.py`.
    *   Example: Product Cards are not `<div>` blocks in HTML, but rendered via JS from JSON data.

---

## 2. 🗄️ DATA STRUCTURE (Veri Yapısı)

We will use a **Flat-File JSON Database** to keep it portable and fast (No SQL setup needed yet).

### A. `db/services.json` (Product Catalog)
```json
[
  {
    "id": "thai-massage-v1",
    "slug": "royal-thai-massage",
    "title_tr": "Kraliyet Thai Masajı",
    "desc_tr": "Nuad Boran tekniği ile...",
    "category": "massage",
    "image": "/assets/img/thai.webp",
    "price": 3500,
    "duration": 60,
    "tags": ["stretch", "energy"]
  }
]
```

### B. `db/config.json` (Site Settings)
```json
{
  "site_mode": "production",
  "animation_level": "medium", // off, low, high
  "maintenance_mode": false,
  "seo_defaults": {
    "title_suffix": "• Santis Club"
  }
}
```

---

## 3. 🛠️ ADMIN MODULES (Yönetim Modülleri)

### Module 1: Service Editor (Hizmet Editörü)
*   **UI:** Form-based editor (Title, Price, Image Picker).
*   **Features:**
    *   "Save" -> Writes to `services.json`.
    *   "Preview" -> Opens a temp page.

### Module 2: AI Content Generator (AI Yazar)
*   **UI:** "Magic Wand" button next to Description fields.
*   **Action:**
    *   User inputs: "Thai Massage, Luxury"
    *   Click "Generate"
    *   Server Prompt: "Write a quiet luxury description for..."
    *   Result fills the text area.

### Module 3: System Config (Sistem Ayarları)
*   **Toggles:**
    *   [x] Enable Soul Engine (Atmosphere)
    *   [x] Mobile Reduced Motion
    *   [ ] Maintenance Mode

---

## 4. 🛣️ IMPLEMENTATION ROADMAP (Uygulama Yol Haritası)

### PHASE 1: Backend Preparation (Backend Hazırlığı)
1.  Create `db/` folder and initial JSON files.
2.  Add API Endpoints to `server.py`:
    *   `GET /api/services` (Read)
    *   `POST /api/services` (Write)
    *   `GET /api/config`
    *   `POST /api/config`

### PHASE 2: Admin Panel Upgrade (Admin Güncellemesi)
1.  Update `admin/panel.html` UI to fetch/display data from API.
2.  Add "Service Editor" form.
3.  Connect "AI Generate" button to existing `/admin/generate-ai` endpoint.

### PHASE 3: Frontend Hydration (Önyüz Bağlantısı)
1.  Update `app.js` to fetch `config.json` on load.
2.  If `config.animation_level === 'off'`, verify CSS reduced motion is active.
3.  Update `santis-soul.js` to respect Config.

---

## 5. 🚀 IMMEDIATE NEXT STEP

**Onaylarsanız PHASE 1'e başlıyorum:**
1.  `db` klasörü oluşturulacak.
2.  `server.py`'ye CRUD endpointleri eklenecek.
