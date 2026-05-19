# Santis OS - Repository Reality Map v1.0
Generated: 2026-05-15
Mode: READ-ONLY AUDIT

## Overview
The Santis OS repository is a modular, event-driven architecture designed for high-performance hospitality services. It follows a "Sovereign Enterprise" pattern where core logic is distributed across packages and the frontend is managed via a centralized asset engine.

## Core Directory Structure

### 🏗️ 1. Infrastructure & Governance
- `.agents/`: AI orchestration, enforcement scripts (Linting, Boundary checks, CoreState validation).
- `.antigravity-reports/`: [CURRENT_LOCATION] Audit and migration mapping.
- `docs/governance/`: Canonical rules (AGENTS.md, antigravity-protocol-v2.md, REPO_BOUNDARY.md).
- `docs/audits/`: Historical phase reports (G, H, VH, I).

### 📦 2. Packages (Core Logic)
- `packages/domain-schema/`: Central source of truth for boardroom contracts and state definitions.
- `packages/event-dictionary/`: Event bus definitions and protocol types.
- `packages/design-system/`: CSS tokens, JS validators, and "Stitch" enforcement tools.

### 🎨 3. Frontend (Assets & Runtime)
- `assets/css/`: Modular CSS architecture (tokens, components, atmospheres, animations).
- `assets/js/core/`: Sovereign Runtime Engine (Santis-OS, Router, Telemetry, WS-Manager).
- `assets/img/`: Optimized media assets (WebP/AVIF focus).
- `assets/fonts/`: Premium typography assets.

### 🖥️ 4. Application Layers
- `admin-panel/`: Boardroom management interface (Tailwind v4 / Vite).
- `public/`: Static entry points.

### 🗄️ 5. Legacy & Maintenance
- `archive/`: Quarantined legacy code, temporary scripts, and stale reports.
- `_archive/`: (Note: Recent Phase G.5-B merge removed private-infra from here).

## System Critical Boundaries
1. **CoreState SSOT**: Managed via `packages/domain-schema`.
2. **Design Tokens**: Managed via `assets/css/tokens` and enforced by `stitch`.
3. **Runtime Connectivity**: Managed via `santis-ws-orchestrator.js` and `santis-telemetry-bus.js`.

## Active Phase Context
- **Phase H**: Technical Debt Compression.
- **Phase VH**: Visual Hierarchy Lock.
- **Phase I**: Asset Weight & Performance Optimization.
