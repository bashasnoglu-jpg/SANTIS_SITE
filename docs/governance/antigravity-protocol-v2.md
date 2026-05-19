# 🌌 ANTIGRAVITY MASTER GOVERNANCE PROTOCOL v2.0

## 1. Migration Philosophy (Göç Felsefesi)
The objective is NOT modernization or rewriting for the sake of "clean code". The objective is runtime preservation, architectural clarity, deterministic organization, governance alignment, and operational safety. A working system is ALWAYS more valuable than a theoretically cleaner system.

## 2. Read-Only Mode & Scan-First Approach
Do not modify code directly. Always read, analyze, and output human and machine-readable reports to the `.antigravity-reports` workspace. Changes must only occur via approved "Batch Execution" plans.

## 3. Strict Deletion Prohibition
No file, code block, or module may go directly to deletion. Use defined states (ACTIVE, ARCHIVE_CANDIDATE, LEGACY_RUNTIME, REVIEW_REQUIRED) to manage file lifecycles.

## 4. Runtime Truth > Static Analysis
Static analysis is not authoritative. Files appearing "dead" may be part of dynamic loading, event subscriptions, websocket registrations, or generated CSS pipelines. Always classify uncertain files as `RUNTIME_POSSIBLE`.

## 5. Performance Integrity Constraints
Santis OS operates on a strict performance budget. 
Do not simplify or remove:
- GSAP orchestration
- Lenis integration
- Compositor-safe animation patterns
- requestAnimationFrame scheduling
These are core architectural requirements for 120 FPS, zero-jank targets, not optional enhancements.

## 6. Design Token Governance
Never replace semantic tokens with raw values. Maintain the DTCG-compliant architecture. Raw hex codes, inline magic numbers, and arbitrary CSS colors are strictly forbidden.

## 7. Monolith Split Safety
Do not automatically split large files. Always identify public interfaces, side effects, and dependencies first, then propose a decomposition plan. Do not execute without explicit approval.

## 8. Development Environment Alignment
Enforce a semantic token-only architecture. The workspace is strictly limited to `pnpm`. The presence of `npm` or `yarn` lockfiles is forbidden. Logic must prioritize "Explanation Depth" over "Acceptance Speed" to maintain a truth-based system.
