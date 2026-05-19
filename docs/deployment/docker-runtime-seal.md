# Santis OS — Docker Runtime Seal (TD-007)

This document formalizes the deployment and containerization of the Santis OS ecosystem under strict **Sovereign Quiet Luxury** engineering and local DevOps architecture standards. 

---

## 🛡️ 1. Architectural Overview

The local Docker execution runtime containerizes the clean workspace state without altering the production cloud deployment paths (Vercel/Cloudflare).
 

The environment orchestrates five services over a isolated network boundary:

```mermaid
graph TD
    Client[Web Browser] -->|Port 8080| Web[Nginx Web Static]
    Client -->|Port 8081| Admin[Nginx Admin Panel Static]
    Client -->|Port 8000| API[FastAPI API Backend]
    
    API -->|Internal Network| Postgres[(PostgreSQL 16)]
    API -->|Internal Network| Redis[(Redis 7)]
```

---

## 📁 2. Deliverables and Configurations

### 1. `.dockerignore`
Isolates build contexts recursively using wildcard expressions (`**/node_modules`) to prevent local host-compiled dependency leakage and broken symlinks inside container boundaries.

### 2. `compose.yml`
Defines orchestration for all 5 services with internal service linking, environment injection, port maps, and health checks:
- **`api`**: Custom FastAPI container exposed on port `8000`.
- **`web`**: Static Nginx container exposed on port `8080`.
- **`admin-panel`**: Static Nginx container exposed on port `8081`.
- **`postgres`**: PostgreSQL 16 exposed on `5432`.
- **`redis`**: Redis 7 mapped to host port `16379` to prevent conflicts.

### 3. `docker/api/Dockerfile`
- Base: `python:3.12-slim`
- Fully compatible with dynamic launcher entrypoints (`uvicorn ${SANTIS_API_APP:-server:app}`).
- Healthcheck endpoint: `/health`.

### 4. `docker/web/Dockerfile` & `nginx.conf`
- Base: `nginx:1.27-alpine`
- Serves the static site directly from the source directory, bypassing heavy build dependencies.

### 5. `docker/admin-panel/Dockerfile` & `nginx.conf`
- Base: `node:20-alpine` (Stage 1) -> `nginx:1.27-alpine` (Stage 2)
- Multi-stage build leveraging Corepack for PNPM 10 workspace resolution and production minification.

---

## 🔑 3. Port Mapping and Hardening (WSL2 / Hyper-V Mitigation)

To prevent port allocation conflicts on Windows dev machines:
- **Redis Exclusion Bypass**: The host port is mapped to `16379:6379`. This avoids Hyper-V / WSL2 administered port exclusion ranges (e.g. `6354-6453`) that block host binding.
- **Internal Service Communication**: The API backend continues to reference `redis:6379` within the container network mesh (`santis_network`), keeping data paths completely isolated.

---

## 🟢 4. Verification and Validation Procedures

### Repository Lint / Compile Verification
Before building, run the standard workspace verification suite:
```bash
pnpm run tokens:css:check
pnpm run lint
pnpm run build
pnpm run audit:all
```

### Container Spin-Up & Inspection
```bash
# Build the images
docker compose build

# Launch the orchestrator in the background
docker compose up -d

# Inspect active services
docker compose ps
```

### Healthy Endpoint Handshakes
```bash
# Verify API Healthcheck (returns HTTP 200 OK)
curl.exe -s http://localhost:8000/health

# Verify Public Web Static Page
curl.exe -I http://localhost:8080

# Verify Admin Panel Static Page
curl.exe -I http://localhost:8081
```
