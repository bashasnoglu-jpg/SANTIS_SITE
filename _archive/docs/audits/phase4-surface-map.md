# Phase 4 — Visual Truth Surface Map
> Generated: 2026-05-09 | Post Phase 3A + 3B Seal

## Governance Context

| PR | Status |
|---|---|
| PR #150 Phase 3A | ✅ MERGED |
| PR #151 Phase 3B | 🟡 OPEN (review bekliyor) |
| PR #149 Dead Code Audit | ⚠️ DRAFT |

> **Phase 4 başlamadan PR #151 merge gereklidir.**

---

## Excluded Surfaces (Do Not Refactor)

| Dosya | Neden | Aksiyon |
|---|---|---|
| `admin/boardroom/components/BoardroomTelemetry.tsx` | Frozen legacy `admin/` surface | Phase B archive |
| `admin/boardroom/` tüm içerik | Dead code audit kapsamı | Phase B archive |
| `hq-dashboard/` | Frozen legacy | Phase B archive |
| `tenant-dashboard/` | Frozen legacy | Phase B archive |
| `assets/js/modules/santis-boardroom-pro-live.js` | Legacy boardroom module | Phase B archive |
| `assets/js/modules/santis-boardroom.js` | Legacy boardroom module | Phase B archive |
| `assets/js/modules/santis-boardroom-mfe.js` | Legacy boardroom module | Phase B archive |

---

## Phase 4A — React / TSX Canonical Surface (admin-panel/src)
> **Yüksek öncelik** — Kullanıcıya dokunan canonical UI

### 4A-1: Boardroom Components (admin-panel/src/components/boardroom/)
| Dosya | İhlal Türü |
|---|---|
| `BoardroomView.tsx` (admin-panel/src/boardroom/) | Raw hex, inline style |
| `ControlConsolePanel.jsx` | style={{ }} |
| `ActionQueueTable.jsx` | style={{ }} |
| `DegradedImpactTiles.jsx` | style={{ }} |
| `ActionImpactTable.jsx` | style={{ }} |
| `DecisionTimeline.jsx` | style={{ }} |
| `ActionDecisionDrawer.jsx` | style={{ }} |
| `ExperimentTimeline.jsx` | style={{ }} |
| `ExperimentSummaryTiles.jsx` | style={{ }} |
| `ExperimentWinnerCard.jsx` | style={{ }} |
| `ExperimentVariantTable.jsx` | style={{ }} |
| `FunnelStateTimeline.jsx` | style={{ }} |
| `GovernanceTimeline.jsx` | style={{ }} |
| `OperatorAuditRail.jsx` | style={{ }} |
| `OverrideBadge.jsx` | style={{ }} |
| `OptimizerInsightRail.jsx` | style={{ }} |
| `PolicyDeltaCard.jsx` | style={{ }} |
| `TelemetryDebugStrip.jsx` | style={{ }} |
| `QuoteLatencyHeatline.jsx` | style={{ }} |
| `RevenueOutcomeTiles.jsx` | style={{ }} |
| `ThresholdRecommendationTable.jsx` | style={{ }} |
| `AbandonmentClusterCard.jsx` | style={{ }} |

### 4A-2: Concierge Components
| Dosya | İhlal Türü |
|---|---|
| `RevenuePriorityBanner.jsx` | style={{ }}, arbitrary |
| `RecoveryBanner.jsx` | style={{ }} |
| `ConciergeAssistBanner.jsx` | style={{ }} |
| `AdaptiveServiceShelf.jsx` | style={{ }} |
| `ActionRail.jsx` | style={{ }} |

### 4A-3: Optimizer Components
| Dosya | İhlal Türü |
|---|---|
| `SovereignDashboard.tsx` | style={{ }}, hex |
| `OpsAnomalyBanner.tsx` | style={{ }} |
| `OpsDashboard.tsx` | style={{ }} |
| `OpsTrendsPanel.tsx` | style={{ }} |
| `OpsTrendLineChart.tsx` | style={{ }} |
| `OpsTrendBarChart.tsx` | style={{ }} |
| `OpsSummaryCards.tsx` | style={{ }} |
| `OpsPolicyBanner.tsx` | style={{ }} |
| `OpsPortfolioPanel.tsx` | style={{ }} |
| `OpsPolicyBacktestPanel.tsx` | style={{ }} |
| `OpsPolicySimulationPanel.tsx` | style={{ }} |
| `OpsPolicyRecommendationsPanel.tsx` | style={{ }} |
| `OpsBlockedReasonsChart.tsx` | style={{ }} |
| `OpsBlockedCandidatesTable.tsx` | style={{ }} |
| `OpsApprovalQueue.tsx` | style={{ }} |

### 4A-4: Dashboard & Features
| Dosya | İhlal Türü |
|---|---|
| `GodSystemScanner.jsx` | hex, inline |
| `ClinicScanner.jsx` | hex, inline |
| `GodsEye.jsx` | hex, inline |
| `GhostDrawer.jsx` | hex, inline |
| `CognitiveUI.jsx` | hex, inline |
| `SantisBoardroom.jsx` | hex, inline |
| `SovereignDashboard.jsx` | hex, inline |
| `RevenueDailyFallback.jsx` | hex, inline |
| `LiveIntentMonitor.tsx` | hex |
| `SignalBadge.tsx` | hex |
| `ServiceImageUpload.jsx` | arbitrary |
| `WhyThisMatteredPanel.tsx` | hex |
| `OracleTimelinePanel.tsx` | hex |
| `DecisionOutcomeDelta.tsx` | hex |
| `ConfidenceHeatmap.tsx` | hex |

### 4A-5: Pages
| Dosya | İhlal Türü |
|---|---|
| `ServiceManager.jsx` | hex, arbitrary |
| `OptimizerOpsPage.tsx` | hex |
| `Operations.jsx` | hex |
| `Concierge.jsx` | hex |
| `App.jsx` | hex |

---

## Phase 4B — JS Modules (assets/js/modules/) — Medium Priority
> Vanilla JS modules — CSS class injection varsa token'a çevrilmeli

| Dosya | İhlal | Not |
|---|---|---|
| `santis-post-purchase.js` | `bg-[#111827]`, `text-[#D4AF37]`, `tracking-[0.2em]` | HTML template injection |
| `santis-stripe-client.js` | `colorPrimary: '#D4AF37'` | Stripe Appearance API — **istisnai** |
| `sovereign-boutique.js` | `text-[#d4af37]`, inline style template | HTML template injection |
| `santis-perf-overlay.js` | CSS-in-JS template string | Dev overlay |
| `interaction-engine.js` | `normalizeHexColor` fallback hex | Config-level |
| `massage-matrix.js` | `text-[#d4af37]`, inline style | HTML template |
| `santis-black-room-3d.js` | `console.log color` | Dev debug only |
| `useLiveRadar.js` | `console.log color` | Dev debug only |

---

## Phase 4C — Core Engine (assets/js/core/) — Low Priority
> Runtime engine files — inline style genellikle runtime JS DOM manipulation

| Dosya | İhlal | Not |
|---|---|---|
| `santis-boardroom-pro-live.js` | 20+ `el.style.color` | Runtime dynamic coloring |
| `*many core/*.js` | `#hex` in console.log | Dev artifacts only |

**Governance notu:** Core engine hex renkleri çoğunlukla runtime JS DOM manipulation veya dev console output'u. Bunlar CSS token'a **çevrilemez** — `CSS custom property` veya `NV_DESIGN_TOKEN` config ile yönetilmeli.

---

## Phase 4 Execution Plan

### Öneri: 3 Alt Faz

```
Phase 4A → admin-panel/src React/TSX yüzeyi (Boardroom + Concierge + Optimizer)
Phase 4B → assets/js/modules HTML template injection
Phase 4C → [Boardroom Approval] core engine dynamic color management
```

### Token Ihtiyacı

`boardroom-tokens.css` mevcut token'lar yeterli mi?
- `--sbr-gold`, `--sbr-dark`, `--sbr-surface`, `--sbr-danger` → ✅ var
- `--sbr-success` (#4caf50 / #00ff80) → ❌ eksik
- `--sbr-warn` (#f59e0b / #ff9800) → ❌ eksik  
- `--sbr-info` (#00ffcc) → ❌ eksik (boardroom overlay rengi)
- `--sbr-neutral-text` (#9ca3af) → ❌ eksik

Phase 4A başlamadan önce bu 4 token `boardroom-tokens.css`'e eklenmeli.

---

## Stitch Guard Compliance

Phase 3A + 3B sonrası canonical React component yüzeyi:

```
components/*.jsx    → ✅ CLEAN (Phase 3B sealed)
assets/js/components/*.js → ✅ CLEAN (Phase 3A sealed)
admin-panel/src/**  → ❌ REMAINING (Phase 4A target)
assets/js/modules/  → ⚠️  PARTIAL (Phase 4B target)
```
