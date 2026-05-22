# Vercel Project Truth Map

**Date:** 2026-05-21
**Context:** The Santis OS project has multiple deployment targets in Vercel which has caused confusion regarding the true production environment.

## Canonical Projects

*   **`sovereign-os`**: **PRODUCTION TRUTH.** This is the primary, canonical production project. All production builds, final deployments, and canonical domains are routed here.
*   **`santis-site-admin-panel`**: **SECONDARY / PREVIEW.** This project is not the production source of truth. It is used for preview, secondary UI isolation, or testing purposes only.

**Action Required:**
All Boardroom governance decisions, pipeline approvals, and production hotfixes must be verified against the `sovereign-os` Vercel project.
