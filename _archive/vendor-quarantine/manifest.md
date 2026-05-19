# Santis OS — Vendor Quarantine Manifest (I.1-B)

Date: 2026-05-14
Phase: I.1 Repository Optimization (Asset Compression)

## Quarantined Assets
The following vendor libraries were identified as "Orphans" (unreferenced by any primary site template) and moved to quarantine to reduce build noise and asset bloat.

| Asset Path | Size | Reason | Impact |
| :--- | :--- | :--- | :--- |
| `assets/vendor/babel.min.js` | 3.1 MB | Legacy transpiler, unused in production. | High (Size Reduction) |
| `assets/vendor/react.development.js` | 740 KB | Dev build only, unused. | Medium |
| `assets/vendor/react-dom.development.js` | 1.1 MB | Dev build only, unused. | Medium |
| `assets/vendor/vue.global.prod.js` | 134 KB | No Vue templates detected in root. | Low |
| `assets/vendor/chart.js` | 165 KB | Unused/Duplicate in vendor root. | Low |

## Identification & Renaming (Non-Quarantine)
The following file was identified as active but poorly named and has been normalized:

| Original Path | New Path | Identification |
| :--- | :--- | :--- |
| `assets/vendor/.js` | `assets/vendor/stripe-elements-bundle.js` | Minified Stripe Elements / React 16 Bundle. |

## Recovery Protocol
If runtime errors emerge related to missing scripts:
1. Identify the missing file name in the console.
2. Move the file from `_archive/vendor-quarantine/` back to `assets/vendor/`.
3. Notify the Boardroom to update the manifest.

> [!IMPORTANT]
> These files are NOT deleted. They are isolated. Deletion requires Phase I.6 evaluation.
