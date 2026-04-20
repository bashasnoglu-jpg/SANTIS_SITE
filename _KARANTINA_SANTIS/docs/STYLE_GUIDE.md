# Santis Club • Visual Identity System (V5.5)

**Code Name:** Liquid Starlight
**Design Philosophy:** Quiet Luxury, Negative Space, Cinematic Depth.

---

## 1. Color Palette (The "Obsidian" Collection)

The V5.5 palette shifts from solid blacks to deep, rich organic darks.

| Token | Value | Description |
| :--- | :--- | :--- |
| **`--os-bg`** | `#050505` | **Deep Obsidian.** The void. Not absolute black. |
| **`--os-glass`** | `rgba(20, 20, 20, 0.85)` | **Dark Glass.** Used for cards, sidebars, and overlays. High blur required. |
| **`--os-gold`** | `#d4af37` | **Santis Gold.** Primary accent. Use sparingly (Buttons, Highlights). |
| **`--os-text`** | `#e0e0e0` | **Mist White.** Primary text. Never pure white (`#fff`). |
| **`--os-text-muted`** | `#888888` | **Stone Grey.** Secondary text, labels, and metadata. |
| **`--os-success`** | `#00ff88` | **Cyber Mint.** Functional success states (Audit, Save). |
| **`--os-danger`** | `#ff4444` | **Signal Red.** Errors and destructive actions. |

---

## 2. Typography

**Headings:** `Playfair Display` (Serif)
*   Keywords: Elegant, Editorial, Timeless.
*   Usage: H1, H2, Hero Titles, Ritual Names.

**Body / UI:** `Inter` (Sans-Serif)
*   Keywords: Clean, Legible, Modern.
*   Usage: Paragraphs, Buttons, Tables, UI Controls.

---

## 3. Surface & Texture

### The "Liquid Starlight" Overlay
All pages must include the atmospheric grain overlay to prevent color banding and add cinematic texture.

```css
body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background: var(--os-noise); /* SVG Turbulence */
    mix-blend-mode: overlay;
    opacity: 0.07;
    z-index: 0;
}
```

### Glassmorphism (Advanced)
Do not use simple opacity. Use `backdrop-filter` for depth.

```css
.glass-panel {
    background: var(--os-glass);
    -webkit-backdrop-filter: blur(24px);
    backdrop-filter: blur(24px);
    border: 1px solid var(--os-glass-border);
}
```

---

## 4. Interaction & Motion

**Principles:**
1.  **Ease-Out Expo:** All movements should feel sudden but land softly (`cubic-bezier(0.16, 1, 0.3, 1)`).
2.  **No Instant Changes:** Hover states, modals, and tabs must transition.
3.  **Breathing:** "Soul Engine" elements should have a slow, perpetual pulse (6s-10s duration).

---

## 5. UI Components

### Buttons
*   **Primary:** Solid Gold (`#d4af37`), Black Text. No border radius (Sharp) or Pill (Rounded) depending on context.
*   **Ghost:** Transparent background, White Border (1px).

### Modals
*   Centered, Glass background.
*   Clicking outside (Backdrop) must close the modal.
*   "Esc" key support is mandatory.

### Toast Notifications
*   Location: Bottom-Right.
*   Duration: 2400ms.
*   Stacking: Newest on top.
