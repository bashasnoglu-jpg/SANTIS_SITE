# Shared Contract Ownership Decision

```text
STATUS               = APPROVED — OPTION B
PACKAGE              = PAKET_SEP_4
DECISION_AUTHORITY   = HAKAN
RECOMMENDED_OPTION   = B
APPROVED_OPTION      = B
```

## Decision Question

How should SANTIS_WEB consume domain and event contracts without owning or directly embedding SANTIS_OS runtime authority?

## Options

| Option | Model | Benefit | Material risk | Draft position |
| :--- | :--- | :--- | :--- | :--- |
| A | SANTIS_OS owns both current packages intact and publishes exact versions | Fast ownership clarification | Packages continue mixing contracts, fixtures and domain runtime | Transition fallback |
| B | Split transport-neutral contracts/validators from OS runtime and publish exact immutable packages | Strongest least-privilege boundary | Requires export migration, compatibility mapping and independent dual-repo verification | RECOMMENDED |
| C | Keep packages physically in SANTIS_WEB and document OS ownership | Lowest initial effort | Physical ownership, workspace coupling and future drift remain ambiguous | Temporary only |

## Domain Schema — File-Level Disposition Proposal

| File | Proposed class | Target under Option B |
| :--- | :--- | :--- |
| `package.json` | TOOLING | New contract package metadata |
| `tsconfig.json` | TOOLING | New contract package build config |
| `scripts/active/audit-contract.mjs` | TOOLING | Contract-package audit tooling |
| `scripts/ensure-no-db.mjs` | TOOLING | Contract-package boundary guard |
| `src/audit-log.contract.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/audit-log.events.ts` | CONTRACT_CONSTANT | `@santis/event-contracts` or domain contracts after naming decision |
| `src/boardroom-state.contract.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/booking/booking-action.schema.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/booking/booking-guard.schema.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/booking/booking-progress.schema.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/booking/booking-visual.schema.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/booking/booking.schema.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/booking/index.ts` | TOOLING/BARREL | Rebuilt contract-only barrel |
| `src/core-state.interface.ts` | MIXED — CONTRACT + DOMAIN_RUNTIME | Types to contracts; `createCoreState` to SANTIS_OS runtime |
| `src/index.ts` | MIXED BARREL | Replace with explicit contract-only exports |
| `src/intent.contract.ts` | MIXED — CONTRACT + DEFAULT_RUNTIME | Schemas/types to contracts; defaults reviewed separately |
| `src/ritual-graph.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/ritual-graph.fixtures.ts` | FIXTURE/TEST | SANTIS_OS test fixtures |
| `src/scheduling.api.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/scheduling.contract.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/scheduling.availability.ts` | DOMAIN_RUNTIME | SANTIS_OS scheduling runtime |
| `src/scheduling.availability.test.ts` | FIXTURE/TEST | SANTIS_OS runtime tests |
| `src/scheduling.booking-guard.ts` | DOMAIN_RUNTIME | SANTIS_OS booking runtime |
| `src/scheduling.booking-guard.test.ts` | FIXTURE/TEST | SANTIS_OS runtime tests |
| `src/scheduling.fixtures.ts` | FIXTURE/TEST | SANTIS_OS test fixtures |
| `src/session.contract.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/sse-envelope.contract.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/telemetry/booking-telemetry.schema.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/telemetry/signal.schema.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/domain-contracts` |
| `src/tenant.contract.ts` | MIXED — CONTRACT + DEFAULT_RUNTIME | Schema/types to contracts; default instance reviewed separately |

```text
DOMAIN_SCHEMA_FILE_COVERAGE = 30 / 30
```

## Event Dictionary — File-Level Disposition Proposal

| File | Proposed class | Target under Option B |
| :--- | :--- | :--- |
| `package.json` | TOOLING | New event-contract package metadata |
| `tsconfig.json` | TOOLING | New event-contract build config |
| `scripts/active/audit-contract.mjs` | TOOLING | Contract-package audit tooling |
| `src/canonical.types.ts` | CONTRACT_CONSTANT + TYPES | `@santis/event-contracts` |
| `src/command-result.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/event-contracts` |
| `src/event.types.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/event-contracts` |
| `src/pricing.schemas.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/event-contracts` |
| `src/scp.schemas.ts` | CONTRACT + VALIDATION_RUNTIME | `@santis/event-contracts` |
| `src/index.ts` | CONTRACT REGISTRY + PARSE RUNTIME | `@santis/event-contracts`; retain parse/safeParse as contract validation |

```text
EVENT_DICTIONARY_FILE_COVERAGE = 9 / 9
```

## Exact-Version Distribution Design

```text
PACKAGE_SCOPE              = @santis
VERSION_POLICY             = IMMUTABLE SEMVER
CONSUMER_RANGE_POLICY      = EXACT VERSION ONLY
CROSS_REPO_WORKSPACE_LINK  = FORBIDDEN
PUBLISH_AUTH               = OIDC / SHORT-LIVED IDENTITY — DESIGN ONLY
REGISTRY                   = GOVERNANCE DECISION REQUIRED
```

Example consumer contract:

```json
{
  "@santis/domain-contracts": "1.0.0",
  "@santis/event-contracts": "1.0.0"
}
```

## Proposed Transition Sequence

1. Seal existing public export inventory and compatibility fixtures.
2. Create contract-only package designs without changing current consumers.
3. Move validation-safe exports; keep domain engines and fixtures in OS runtime design.
4. Publish immutable release candidates through an approved registry pipeline.
5. Replace one consumer at a time with exact versions.
6. Prove SANTIS_WEB and SANTIS_OS builds independently.
7. Reject remaining cross-repository `workspace:*` links.
8. Obtain independent read-back before deprecating old package paths.

No step above is authorized for execution by this draft.

## Decision Block

```text
SELECTED_OPTION       = B
DECIDED_BY            = HAKAN
DECISION_DATE         = 2026-08-20
CONDITIONS            = PAKET_IMP_1 LOCAL IMPLEMENTATION ONLY
GOVERNANCE_DECISION   = APPROVED — OPTION B
```

