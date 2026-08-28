-- Archived pre-canonical artifact from FI-DI-P0.4.
-- Superseded by the Canonical Target Dictionary decision on 2026-07-13.
-- DO NOT APPLY.

-- Santis OS — FI-DI-P0.4 financial analytics foundation
-- Artifact only. DO NOT APPLY during P0.4 E2 static evidence phase.

-- Prerequisite for gen_random_uuid(). Managed PostgreSQL platforms may require
-- an authorized operator to enable this extension before migration apply.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE fi_sync_run_mode AS ENUM ('NORMAL', 'FORCED_REPLAY');
CREATE TYPE fi_sync_run_status AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED', 'ABORTED');
CREATE TYPE fi_quarantine_status AS ENUM ('OPEN', 'CLOSED');

-- The complete superseded artifact remains available in Git history at blob
-- f02442ef2fafcc927a9e4205cd8a03b97fb71caf.
-- This archive marker intentionally prevents accidental execution while
-- preserving the supersession chain in the repository.
