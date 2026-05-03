# Repository Boundary Contract

## Purpose
This document defines the boundary between the public Santis Club website and the private Santis OS infrastructure.

The goal is to protect:
- Santis brand clarity
- SEO authority
- Deployment simplicity
- Proprietary operating-system architecture
- Internal telemetry and decision logic

## Public Repository: `SANTIS_SITE`

`SANTIS_SITE` is allowed to contain only public, guest-facing, frontend-safe assets.

Allowed examples:
- `public/`
- `assets/`
- `tr/`, `en/`, `ru/`, `de/`, `ar/`, `fr/`
- Static HTML pages
- Public frontend JavaScript
- Public CSS
- Public images, fonts, icons, and manifest files
- `sitemap.xml`
- `robots.txt`
- Vite frontend build configuration
- Public brand and SEO documentation

## Private Repository: `SANTIS_OS`

The following categories must live in private infrastructure and must not be committed to the public website repository:
- Backend APIs
- Ingestion APIs
- Admin panels
- Boardroom dashboards
- Database schemas
- Decision kernels
- Event dictionaries
- Telemetry systems
- Runtime audit scripts
- Signaling servers
- Internal operational dashboards
- Proprietary business logic
- Credentials, secrets, tokens, and environment files

## Migration Candidates

The following paths should be reviewed and migrated out of the public repository if they contain internal logic:
- `apps/api/`
- `apps/ingestion-api/`
- `packages/db/`
- `packages/decision-kernel/`
- `packages/event-dictionary/`
- `server/core/`
- `nexus-signaling-server/`
- `santis-os-monorepo/`
- `santis-live-simulator/`

## Rule
Public repository equals luxury guest experience.
Private repository equals Santis OS operational intelligence.
No internal runtime logic should be exposed through `SANTIS_SITE`.
