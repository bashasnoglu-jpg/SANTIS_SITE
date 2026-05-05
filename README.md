# Santis Club
Luxury wellness, ritual design, and intelligent guest experience platform.
Welcome to the public frontend repository for Santis.

## Overview
This repository (`SANTIS_SITE`) serves as the **Public Website and Luxury Wellness Experience Layer** for Santis Club.
It contains the guest-facing website, static assets, ritual pages, multilingual wellness content, and booking gateway surfaces designed for a cinematic luxury wellness experience.

## Repository Scope
This repository is intended for:
- Public website pages
- Static frontend assets
- SEO files
- Ritual library content
- Guest-facing booking and discovery flows
- Frontend build configuration

Internal operating systems, APIs, decision kernels, telemetry layers, database packages, dashboards, and operational intelligence modules must live in private Santis OS infrastructure.
See [`docs/REPO_BOUNDARY.md`](docs/REPO_BOUNDARY.md).

## Architecture
This project uses a Vite-powered Multi-Page Application architecture.
The main application lives in the `admin-panel/` directory, which is the primary Vite workspace built and deployed.
Primary concerns:
- SEO-safe static page delivery
- Fast cinematic frontend loading
- Multilingual ritual discovery
- Luxury-grade visual presentation
- Public booking intent capture

## Build
```bash
pnpm install --frozen-lockfile
pnpm run build
```
The production build output is written to `admin-panel/dist/`.

## Deployment
Recommended deployment targets:
- Vercel (configured via `vercel.json`; serves `admin-panel/dist`)
- Cloudflare Pages
- Static edge hosting with CDN-backed media delivery

## Brand Boundary
Santis Club is the public luxury wellness brand.
Santis OS is the private operational intelligence layer.
The two must remain structurally separated to protect brand clarity, security, and proprietary system architecture.
