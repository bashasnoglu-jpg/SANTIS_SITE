#!/usr/bin/env node

console.error(`
[SANTIS_RUNTIME_GUARD] Deprecated entrypoint blocked.

server.js is no longer the canonical backend runtime.
Use the Sovereign runtime instead:

  pnpm dev

or run the ingestion API workspace directly.

Canonical backend: apps/ingestion-api
Legacy snapshot: legacy/server.js
`);

process.exit(1);
