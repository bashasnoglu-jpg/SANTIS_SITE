# Ritual Worlds UI Prototype Reference (React Lab)

## 1. Overview
Bu doküman, Santis OS "Ritüel Dünyaları" UI dönüşümü için hazırlanan React tabanlı tasarım laboratuvarı prototipini ve mimari analizini içerir. Bu prototip, nihai uygulama kodu değil, görsel ve etkileşim referansıdır.

## 2. Architectural Analysis (Triage)

### 2.1. Executive Decision
**Karar:** Bu kod **DOĞRUDAN UYGULANMAMALI**, sadece bir **Tasarım Referansı** olarak kalmalıdır.
- **Neden:** Santis OS ana hattı React değil, yüksek performanslı Vanilla JS + Data-driven DOM manipülasyonu üzerine kuruludur.

### 2.2. Component Extraction Map

| React Component | Santis Vanilla Equivalent | Data Source |
| :--- | :--- | :--- |
| `EmotionalTargetBadge` | `santis-badge--emotional` | `ritual-worlds.json` -> `emotionalTarget` |
| `AtmosphereNotePanel` | `santis-panel--atmosphere` | `ritual-worlds.json` -> `atmosphereNote` |
| `JourneyFlowTimeline` | `santis-timeline--ritual` | `ritual-worlds.json` -> `journeyFlow` |
| `QuietPriceMeta` | `santis-meta--price-hidden` | `services.json` -> `price` |
| `PsychologicalCTA` | `santis-btn--ritual-cta` | `ritual-worlds.json` -> `quietCTA` |
| `AudioToggle` | `santis-ui--acoustics` | `quietMeta` -> `silenceLevel` |

## 3. Implementation Blueprint (Vanilla JS)

### 3.1. Target File
`assets/js/components/ritual-worlds-view.js`

### 3.2. Integration Logic
```javascript
/**
 * RitualWorldsView Component
 * Renders the emotional layer components into the DOM
 */
class RitualWorldsView {
    constructor() {
        document.addEventListener('santis:rituals:ready', (e) => this.render(e.detail.worlds));
    }

    render(worlds) {
        // Vanilla DOM manipulation using data from window.SantisRitualWorlds
        console.log("🦅 [RitualUI] Rendering emotional overlays...");
    }
}
```

## 4. UI Safety Rules (Quiet Luxury Standard)
- **Visual Silence:** Düşük kontrastlı ikonlar ve soft renk paleti.
- **Slow Reveal:** Bilgilerin aniden değil, yumuşak geçişlerle (min 0.6s) sunulması.
- **Symbolic Audio:** Audio toggle'ın sadece görsel bir durum bildirimi (Sessizlik Modu) olarak çalışması.

## 5. Prototype Context (Conceptual)
Prototipte yer alan `EmotionalTargetBadge`, `AtmosphereNotePanel`, `JourneyFlowTimeline` ve `AudioToggle` fikirleri, Santis OS'in "Nervous System Safe" tasarım doktrini ile tam uyumludur. Bu bileşenlerin Vanilla JS versiyonları, Phase 3 kapsamında `assets/js/components/` altında hayata geçirilecektir.
