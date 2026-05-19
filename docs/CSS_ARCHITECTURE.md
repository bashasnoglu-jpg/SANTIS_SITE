# CSS Architecture Contract

## Overview

This document defines the CSS architecture contract for the Santis V6 design system. It establishes the rules, layers, and token conventions that all contributors must follow.

---

## Layer Structure

The Santis CSS system is organized into the following `@layer` hierarchy (imported via `assets/css/style.css`):

| Order | Layer File | Purpose |
|-------|-----------|---------|
| 1 | `santis.reset.css` | Normalize/reset browser defaults |
| 2 | `santis.tokens.css` | Global design tokens (single source of truth) |
| 3 | `santis.engines.css` | Layout engines & structural primitives |
| 4 | `santis.base.css` | Base element styles |
| 5 | `santis.components.css` | Reusable UI components |
| 6 | `santis.utilities.css` | Utility/helper classes |
| 7 | `santis.overrides.css` | Context-specific overrides (use sparingly) |

---

## Design Token Contract

All design tokens live exclusively in `assets/css/santis-v6/santis.tokens.css` inside `@layer tokens`.  
**No raw values (hex, px, font names) should appear outside of this file.**

### Typography Tokens

```css
--font-sans      → Primary sans-serif stack (Inter + system fallbacks)
--font-serif     → Luxury serif stack (Playfair Display, Cormorant Garamond)
--font-editorial → Editorial/display serif (Cormorant Garamond)
--font-primary   → Alias → var(--font-sans)
--font-secondary → Alias → var(--font-serif)
--font-mono      → Monospace stack (JetBrains Mono, Fira Code)
```

### Color Tokens

```css
--color-bg               → Page background (dark default)
--color-surface          → Card / panel surface
--color-surface-elevated → Elevated surface (modals, tooltips)
--color-text             → Primary text
--color-text-muted       → Secondary / muted text
--lux-gold               → Santis gold accent (#c6a96b)
--lux-gold-dim           → Gold accent at low opacity
--color-border           → Subtle border
--color-border-glow      → Gold-tinted glow border
```

### Spacing Tokens

```css
--space-xs   → 4px
--space-sm   → 8px
--space-md   → 16px
--space-lg   → 32px
--space-xl   → 48px
--space-2xl  → 64px
```

### Radius Tokens

```css
--radius-sm  → 6px
--radius-md  → 12px
--radius-lg  → 20px
--radius-xl  → 32px
```

### Motion Tokens

```css
--ease-lux       → Luxury easing curve
--ease-snap      → Snap easing curve
--duration-fast  → 0.2s
--duration-normal→ 0.4s
--duration-slow  → 0.8s
```

---

## Theme System

The token file supports theme overrides via data attributes on `:root`:

| Attribute | Effect |
|-----------|--------|
| `data-theme="light"` | Light / Spa color palette |
| `data-quantum="on"` | Brighter gold for active physics states |

---

## Rules

1. **Never** hardcode font names, colors, or sizes in component files — always reference a token.
2. **Never** add tokens outside `santis.tokens.css`.
3. **Never** use `!important` except inside `santis.overrides.css`.
4. All new tokens must be documented in this file.
5. Font tokens (`--font-primary`, `--font-secondary`) are **aliases** — they must always point to a semantic token (`--font-sans`, `--font-serif`), never to raw font names.

---

## Roadmap

- **PR 3A** ✅ — Consolidate font tokens; introduce `--font-sans`, `--font-serif`, `--font-editorial`.
- **PR 3B** 🔜 — Reduce homepage CSS entry points: 16 CSS → 2 CSS.