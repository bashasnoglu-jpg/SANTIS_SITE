# SANTIS OS - Phase 4C Runtime Render Contract

> Branch: `phase-4c-runtime-render-contract-seal`  
> Scope: live-data render safety for JS runtime modules  
> Rule: no broad legacy rewrite, no frozen admin refactor, no speculative DOM migration

---

## 1. Purpose

Phase 4C introduces a bounded runtime render contract for dynamic HTML surfaces.

The goal is not to rewrite the legacy runtime.  
The goal is to separate:

```text
trusted static template
vs
escaped dynamic value
```

This phase exists to reduce XSS and runtime DOM drift risk in live-data render paths.

---

## 2. In Scope

Initial Phase 4C implementation targets:

```text
assets/js/modules/santis-boardroom-mfe.js
assets/js/modules/santis-boardroom-pro-live.js
```

Reason:

- Both files render live boardroom / action / pricing data.
- Both use `innerHTML` in runtime surfaces.
- Both include dynamic labels, queue entries, action cards, or modal body content.
- Both are small enough to seal without converting the whole runtime layer.

---

## 3. Initial Candidate Evidence

### 3.1 `santis-boardroom-mfe.js`

Observed surfaces:

```text
resultArea.innerHTML
fpsEl.innerHTML
busEl.innerHTML
```

Risk profile:

- intent/action result rendering
- runtime HUD rendering
- MFE shell has both static template and dynamic value injection

Decision:

```text
Phase 4C candidate: YES
First migration batch: YES
```

---

### 3.2 `santis-boardroom-pro-live.js`

Observed surfaces:

```text
pricing/action label render
action card render
stream/queue/modal render
modalBody.innerHTML = actionHtml
```

Risk profile:

- live action card data
- pricing/action labels
- queue and stream render
- modal body render from generated HTML string

Decision:

```text
Phase 4C candidate: YES
First migration batch: YES
```

---

## 4. Second Wave Candidates

These are in scope for later Phase 4C batches, not the first migration commit:

```text
assets/js/modules/santis-boardroom-oracle-v2.js
assets/js/modules/santis-concierge.js
assets/js/modules/sovereign-boutique.js
assets/js/modules/admin-bookings-list.js
assets/js/modules/boardroom-incident-feed.js
```

Reason:

- They may contain dynamic template rendering.
- Some already received localized escaping hardening in Phase 4B.
- They need separate review to avoid broad PR scope.

---

## 5. Out of Scope

The following are intentionally excluded from the first Phase 4C implementation:

```text
admin-panel/src/components/dashboard/SantisBoardroom.jsx
assets/js/core/*
admin/*
hq-dashboard/*
tenant-dashboard/*
static-only template injection with no dynamic value
```

### Notes

`admin-panel/src/components/dashboard/SantisBoardroom.jsx` uses React `dangerouslySetInnerHTML`, but it belongs to the React/admin-panel surface and should not be mixed with the JS module runtime helper.

`assets/js/core/*` is a wider legacy runtime layer and should be inventoried separately before any migration.

Frozen admin surfaces belong to Phase B archive governance, not Phase 4C.

---

## 6. Runtime Render Contract

### Rule 1 - Dynamic values must be escaped

Any user, API, pricing, queue, intent, action, label, description, status, or telemetry value inserted into HTML must pass through an escape helper.

```text
dynamic value -> escapeHtml(value) -> HTML string
```

### Rule 2 - Prefer textContent for pure text

If a node only needs text, use:

```text
node.textContent = value
```

not:

```text
node.innerHTML = value
```

### Rule 3 - Static templates may remain static

Trusted static shell templates may use `innerHTML` only if no dynamic runtime values are interpolated.

### Rule 4 - Mixed templates must isolate dynamic values

Allowed pattern:

```js
container.innerHTML = `
  <article class="static-class">
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(description)}</p>
  </article>
`;
```

Forbidden pattern:

```js
container.innerHTML = `
  <article>
    <h3>${title}</h3>
    <p>${description}</p>
  </article>
`;
```

### Rule 5 - No broad rewrite

Do not convert the full runtime to React or rebuild the entire DOM system in Phase 4C.

---

## 7. Proposed Helper

Initial helper path:

```text
assets/js/modules/safe-render.js
```

Initial API:

```js
export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function setText(node, value) {
  if (!node) return;
  node.textContent = String(value ?? '');
}
```

Optional later API:

```js
export function html(parts, ...values) {
  return parts.reduce((output, part, index) => {
    const value = index < values.length ? escapeHtml(values[index]) : '';
    return output + part + value;
  }, '');
}
```

---

## 8. Verification Gate

Every Phase 4C migration batch must pass:

```powershell
node --check <changed-js-files>
pnpm run stitch:enforce
pnpm run lint
pnpm run test:e2e -- --project=chromium tests/e2e/reservation.spec.ts
git restore tests/artifacts tests/reports
git status --short
```

Targeted smoke should be added when a changed module has a deterministic page/runtime entry.

---

## 9. Non-Goals

```text
No frozen admin cleanup
No broad assets/js/core rewrite
No visual redesign
No routing changes
No pricing behavior changes
No action semantics changes
No git add .
```

---

## 10. First Implementation Plan

Commit 1:

```text
docs(audit): add Phase 4C runtime render contract
```

Commit 2:

```text
feat(runtime): add safe render helper for JS modules
```

Commit 3:

```text
fix(runtime): apply safe render contract to boardroom module templates
```

Initial migration files:

```text
assets/js/modules/santis-boardroom-mfe.js
assets/js/modules/santis-boardroom-pro-live.js
```
