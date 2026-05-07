# Legacy Server Contract Inventory

## Status

Root `server.js` is no longer the canonical backend runtime.

Current runtime rule:

```txt
Canonical backend: apps/ingestion-api
Legacy snapshot: legacy/server.js
```

Root `server.js` is a deprecated guard and intentionally exits to prevent accidental use of the legacy runtime.

## Purpose

This document records the legacy runtime contract before any further cleanup, quarantine, or deletion work.

The goal is not to revive `legacy/server.js`. The goal is to preserve useful runtime contracts while identifying mock, duplicate, or obsolete surfaces.

## SSE Contract

Legacy SSE payloads must preserve this envelope shape if migrated or replaced:

| Field       | Required | Notes               |
| ----------- | -------: | ------------------- |
| `topic`     |      yes | Logical event topic |
| `patch`     |      yes | Delta payload       |
| `ts`        |      yes | Numeric timestamp   |
| `seq`       |      yes | Monotonic sequence  |
| `timestamp` |      yes | ISO timestamp       |

## Endpoint Inventory

| Endpoint                         | Method | Legacy Role               | Canonical Replacement                 | Action         |
| -------------------------------- | -----: | ------------------------- | ------------------------------------- | -------------- |
| `/api/v1/core-state`             |    GET | Legacy CoreState hydrate  | `apps/ingestion-api` core-state route | Verify parity  |
| `/api/v1/stream/events`          |    GET | Legacy SSE stream         | ingestion-api SSE/core-state stream   | Verify/migrate |
| `/api/v1/telemetry/beacon`       |   POST | Tolerant telemetry mock   | ingestion-api telemetry route         | Verify parity  |
| `/api/v1/boardroom/metrics`      |    GET | Mock Boardroom metrics    | Boardroom read model                  | Replace        |
| `/api/v1/admin/bookings`         |    GET | Mock bookings             | future admin API                      | Quarantine     |
| `/api/v1/auth/login`             |   POST | Mock auth token           | ingestion-api auth route              | Deprecated     |
| `/api/v1/media/assets`           |    GET | Mock/media manifest data  | media service or static manifest      | Audit          |
| `/api/v1/media/filters`          |    GET | Mock filter list          | media service or static manifest      | Audit          |
| `/api/v1/media/slots/health`     |    GET | Mock slot health          | media observability                   | Audit          |
| `/api/v1/admin/telemetry/stream` |    GET | In-memory telemetry drain | Boardroom observability               | Replace        |
| `/api/v1/god-mode/stream`        |    GET | SSE stub                  | ingestion-api/oracle stream           | Deprecated     |
| `/ws`                            |     WS | Legacy websocket gateway  | ingestion-api websocket gateway       | Deprecated     |

## Quarantine Rules

- Do not re-enable `legacy/server.js` as a production runtime.
- Do not remove legacy endpoints until canonical replacements are verified.
- Do not change SSE envelope fields without a contract migration.
- Do not introduce hardcoded localhost URLs.
- Keep root `server.js` as a guard unless a new canonical runtime launcher replaces it.

## Next PRs

1. `chore(legacy): harden deprecated server entrypoint guard`
2. `test(runtime): add SSE envelope contract guard`
3. `refactor(server): quarantine legacy mock routes`
4. `docs(runtime): update runtime constitution after legacy audit`

## Related Work

- [#70](https://github.com/bashasnoglu-jpg/SANTIS_SITE/issues/70) — P1: Split server.js into sovereign runtime modules
- [#142](https://github.com/bashasnoglu-jpg/SANTIS_SITE/issues/142) — P0 Closure Report: SANTIS_SITE V4 stabilization and runtime drift seal
