# Stitch Token Mapping — Santis Experience OS

Status: Draft Mapping  
Source Artifact: docs/design/stitch-experience-os-reference.md  
Runtime Change: None  
Token Change: None in this phase

## Purpose

This document maps the Stitch Experience OS visual language to the existing Santis V6 token system before any implementation PR.

## Existing Token Coverage

| Stitch Motif | Existing Santis Token | Status |
|---|---|---|
| Dark graphite / black spatial background | --color-bg, --color-surface, --color-surface-elevated | Covered |
| Glass / translucent panel | --color-surface-glass, --color-surface-glass-dark, --blur-md | Covered |
| Gold hierarchy | --lux-gold, --lux-gold-dim, --color-border-glow | Covered |
| Quiet luxury serif typography | --font-serif, --font-editorial, --font-display | Covered |
| Clean body/interface sans | --font-sans, --font-body, --font-primary | Covered |
| Cinematic motion | --ease-lux, --duration-slow, --duration-normal | Covered |
| Elevated command panels | --shadow-elevated, --shadow-gold, --radius-xl | Covered |
| Subtle borders | --color-border, --color-border-glass | Covered |

## Candidate Token Gaps

| Need | Suggested Token | Reason |
|---|---|---|
| Neural / biometric glow | --shadow-neural | For AI Concierge / Bio-Signature aura states |
| Spatial grid line | --color-spatial-grid | For telemetry and command center surfaces |
| Bio validation success | --color-bio-valid | For Sovereign_ID Validated states |
| Thermal / recovery accent | --color-thermal-soft | For recovery, heat, relaxation surfaces |
| Deep glass blur | --blur-xl | For large cinematic panels |
| Atmospheric panel gradient | --gradient-atmospheric-panel | For premium spatial panels |

## Governance Decision

No token should be added until a concrete component PR requires it.

Token additions must:
1. Be added only to assets/css/santis-v6/santis.tokens.css
2. Be documented in docs/CSS_ARCHITECTURE.md
3. Avoid raw values inside component CSS
4. Preserve existing aliases
5. Pass CSS/governance audit
