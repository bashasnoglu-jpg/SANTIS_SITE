# SANTIS OS — State Drift Inventory

## Status

Documentation-only audit.  
Focus: Parallel state authorities, environment-bound assumptions, and global namespace proliferation.

## Core Findings

Current architecture is not a "dead code" problem; it is a **"parallel state authority"** problem.

### 1. Parallel State Engines
Two independent state engines exist without a defined relationship or bridge:
- **NeuralDB (High-Tier Intelligence):** Manages `telemetry`, `defcon`, `mrr`, and system status.
- **SantisStore (Low-Tier UI):** Manages DOM hydration and reactive UI components.

### 2. Environment Drift
Hardcoded `localhost:*` endpoints (8080, 4040) are present in core runtime modules, bypassing production environment abstraction.

### 3. Runtime Mock Leakage
`fakeData` and simulation logic (`DREAM MODE`) are integrated into the active runtime path rather than being isolated as debug plugins.

## Classification

| Surface | Governance Status | Reason |
|---|---|---|
| `santis-neural-db.js` | ✅ ALIVE (Intelligence Layer) | Primary state engine for cortex |
| `santis-store.js` | ✅ ALIVE (UI Hydration Layer) | Primary state engine for UI |
| `window.NeuralDB` | 🔍 REVIEW REQUIRED | Global namespace pollution |
| `window.SantisStore` | 🔍 REVIEW REQUIRED | Global namespace pollution |
| Hardcoded `localhost:*` refs | ⚠️ DRIFT | Environment-bound assumptions |
| `fakeData` runtime paths | ⚠️ DRIFT | Mock/Runtime overlap |
| `sessionStorage` persona flows | 🔍 REVIEW REQUIRED | Out-of-band state tracking |

## Governance Recommendations

### Phase F — Environment Hygiene
- Abstract all `localhost` endpoints into a unified `RUNTIME_CONFIG`.
- Normalize telemetry endpoints across all modules.
- Implement production-ready environment detection.

### Phase G — Unified State Authority
- Establish a formal relationship contract between `NeuralDB` and `SantisStore`.
- Map the `CoreState` authority graph.
- Define deterministic hydration boundaries.

## Do Not Touch
- `santis-neural-db.js`
- `santis-store.js`
- `NeuralDB.state` mutations

until the Environment Hygiene PR is merged.

---
**Bu rapor silme talimatı değildir. Bu rapor yalnızca kanıt temelli envanter ve yönetişim planıdır.** ✅
