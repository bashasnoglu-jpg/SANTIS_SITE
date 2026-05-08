# SANTIS OS - AI Constitution Layer

## Project Identity
Santis OS is a Computational Hospitality OS operating on the principles of Quiet Luxury, CoreState SSOT, and deterministic UX. It is not a standard web project; it is an event-driven, boardroom-governed architecture.

## Forbidden Actions
- Do not introduce UI elements that break the Quiet Luxury design system (e.g., cheap gradients, noisy UI).
- Do not duplicate state; use only CoreState.
- Do not execute destructive terminal commands without explicit user permission.
- **Strictly Forbidden without Boardroom approval:**
  - Zustand
  - Redux
  - Prisma
  - Yarn
  - npm lockfiles (`package-lock.json`)
  - Tailwind arbitrary values (e.g., `w-[31px]`, `text-[#ff0000]`)
  - Inline colors (e.g., `style="color: red"`)
  - Uncontrolled animation engines

## Required Planning Behavior
- Always analyze the current structure before making changes.
- Always produce an Artifact/Plan before writing code.
- Report any risks or similar rule files before modifying governance files.
- Produce a short validation report after every change.
- **Strict Refactoring Protocol (Zero Technical Debt):**
  1. Detect canonical implementation.
  2. Detect duplicate systems.
  3. Detect active runtime path.
  4. Produce migration plan.
  5. Require user approval.

## CoreState SSOT Rules
- CoreState is the single source of truth.
- State transitions must be deterministic.
- See `.agents/rules/CoreStateSSOT.md` for details.

## Quiet Luxury UX Rules
- Maintain an editorial, cinematic, calm, and premium UI.
- No generic SaaS visuals or uncontrolled animations.
- See `.agents/rules/QuietLuxury.md` for details.

## Runtime Contract Rules
- All boundaries must be validated using Zod.
- Reject malformed payloads and external inputs without validation.
- See `.agents/rules/RuntimeContracts.md` for details.

## Git / Branch Discipline
- Maintain Zero Technical Debt. No zombie files, duplicate components, or silent architectural drift.
- See `.agents/rules/ZeroTechnicalDebt.md` for details.

## User Review Required
Require explicit Boardroom approval for:
- deployment
- migrations
- security changes
- pricing logic
- payment systems
- Boardroom systems
- deletion operations
- dependency replacement
- force push (`git push -f`)
- branch cleanup
- Any deviation from the canonical stack or CoreState system
- Any UI pattern changes that might affect the Quiet Luxury aesthetic

## Source of Truth Policy
If repository reality conflicts with documentation, repository runtime behavior is the source of truth.

## Safety-First Terminal Policy
- **Never execute destructive commands automatically.**
- Run only safe read/list checks unless explicitly approved.
- Do not auto-delete files, auto-refactor, or auto-consolidate without explicit instructions.
