# Shared Contract Export Compatibility Matrix

Status: `REMEDIATION — LOCAL VERIFICATION`

This matrix covers every module exported by the former `@santis/domain-schema` root barrel and every public export path of the former `@santis/event-dictionary` package. Historical evidence retains the former names; current consumers use the canonical package names below.

## Domain export coverage

| Former module/export group | Canonical target | Classification | Compatibility |
| --- | --- | --- | --- |
| `tenant.contract` schemas and types | `@santis/domain-contracts/tenant.contract` | validation contract | PRESERVED |
| `DefaultSantisTenant` | `@santis/domain-runtime` | runtime default | RENAMED/MOVED |
| `intent.contract` schemas and types | `@santis/domain-contracts/intent.contract` | validation contract | PRESERVED |
| `DefaultIntentVectors` | `@santis/domain-runtime` | runtime default | RENAMED/MOVED |
| `core-state.interface` types | `@santis/domain-contracts/core-state.interface` | transport-neutral types | PRESERVED |
| `createCoreState` | `@santis/domain-runtime` | domain runtime | RENAMED/MOVED |
| `sse-envelope.contract` | `@santis/domain-contracts/sse-envelope.contract` | validation contract | PRESERVED |
| `boardroom-state.contract` | `@santis/domain-contracts` | validation contract/types | PRESERVED |
| `audit-log.contract` | `@santis/domain-contracts/audit-log.contract` | validation contract | PRESERVED |
| `session.contract` | `@santis/domain-contracts/session.contract` | validation contract | PRESERVED |
| `audit-log.events` | `@santis/domain-contracts` | contract constants/types | PRESERVED |
| `ritual-graph` | `@santis/domain-contracts` | validation contract | PRESERVED |
| `ritual-graph.fixtures` | `@santis/domain-runtime` | fixture/runtime | RENAMED/MOVED |
| `scheduling.api` | `@santis/domain-contracts/scheduling.api` | validation contract | PRESERVED |
| `scheduling.contract` | `@santis/domain-contracts/scheduling.contract` | validation contract | PRESERVED |
| `scheduling.availability` | `@santis/domain-runtime` | domain runtime | RUNTIME_ONLY |
| `scheduling.booking-guard` | `@santis/domain-runtime` | domain runtime | RUNTIME_ONLY |
| `telemetry/booking-telemetry.schema` | `@santis/domain-contracts` | validation contract | PRESERVED |
| `telemetry/signal.schema` and former `./telemetry` path | `@santis/domain-contracts/telemetry` | validation contract | PRESERVED |
| `booking/index` and five booking schema modules | `@santis/domain-contracts/booking` | validation contract | PRESERVED |
| `PackageEntity` compatibility type | `@santis/domain-contracts` | transport-neutral type | PRESERVED |

## Event export coverage

| Former public export | Canonical target | Classification | Compatibility |
| --- | --- | --- | --- |
| package root (`index`, canonical types, event schemas, pricing and SCP schemas) | `@santis/event-contracts` | validation contract | PRESERVED |
| `./command-result` | `@santis/event-contracts/command-result` | validation contract | PRESERVED |
| `parseSantisEvent`, `parseSantisCommand`, and safe-parse variants | `@santis/event-contracts` | validation runtime | PRESERVED |

```text
LEGACY_DOMAIN_ROOT_MODULE_GROUPS = 12 / 12 MAPPED
ADDITIONAL_DOMAIN_SPLIT_GROUPS   = 9 / 9 MAPPED
LEGACY_EVENT_PUBLIC_PATHS        = 2 / 2 MAPPED
COMPATIBILITY_MATRIX_COVERAGE    = 100%
```

The matrix records API disposition; it does not authorize registry publication, remote mutation, merge, or deployment.
