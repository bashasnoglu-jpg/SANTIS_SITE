# Santis OS — Backup and Offline Schedule Dry-Run Runbook

## Phase

P0-SEAL-05A — Backup & Offline Schedule Dry-Run Proof

## Status

Operational dry-run procedure. This document contains no guest, client, payment, or live business data.

## Purpose

P0-SEAL-04 created the backup/export contract, the read-only Airtable backup scaffold, the offline daily schedule generator, and the CI safety audit.

P0-SEAL-05A proves that those tools can be executed safely in an operations environment without committing generated output or private data to Git.

## Non-Negotiable Safety Rules

- Do not commit generated backup files.
- Do not commit generated offline schedule files.
- Do not paste client names, phone numbers, payment details, or notes into GitHub.
- Do not expose Airtable tokens in logs, screenshots, commits, pull requests, or comments.
- Use the read-only scripts only.
- Do not run any Airtable write, schema, migration, or cleanup command as part of this dry run.

## Required Local Environment

The operator machine must have the following values available in the local shell or local environment file that is not committed to Git:

```text
AIRTABLE_BASE_ID or AIRTABLE_SANTIS_BASE_ID
AIRTABLE_PAT or AIRTABLE_API_KEY
AIRTABLE_BOOKINGS_TABLE_ID
```

Optional table identifiers for the full backup scaffold:

```text
AIRTABLE_CLIENTS_TABLE_ID
AIRTABLE_PAYMENTS_TABLE_ID
AIRTABLE_INVENTORY_TABLE_ID
```

## Pre-Run Repository Checks

Before running the dry run, confirm the working tree is understood and generated-output folders are ignored:

```bash
git status --short
pnpm run audit:ops-backup-safety
```

The safety audit must pass before any dry-run export is trusted.

## Backup Export Dry Run

Run the read-only Airtable backup export:

```bash
pnpm run ops:backup:airtable -- --date=YYYY-MM-DD
```

Example:

```bash
pnpm run ops:backup:airtable -- --date=2026-06-23
```

Expected output folder:

```text
Santis_OS_Backups/YYYY-MM-DD/
```

Expected files:

```text
bookings.csv
clients.csv
payments.csv
inventory.csv
santis_backup_YYYY-MM-DD.xlsx
manifest.json
```

## Offline Daily Schedule Dry Run

Run the read-only offline daily schedule generator for the branch:

```bash
pnpm run ops:offline-schedule -- --location=budva --date=YYYY-MM-DD
```

Example:

```bash
pnpm run ops:offline-schedule -- --location=budva --date=2026-06-23
```

Expected output folder:

```text
Santis_OS_Offline_Schedule/YYYY-MM-DD/
```

Expected files:

```text
budva-daily-schedule.csv
budva-daily-schedule.xlsx
budva-daily-schedule.pdf
budva-daily-schedule-manifest.json
```

## Output Validation Checklist

Validate the generated backup files locally:

- `manifest.json` exists.
- CSV files open locally.
- XLSX workbook opens locally.
- Backup workbook contains the expected minimum tables.
- No token, API key, or secret appears in generated files.
- No generated file is staged in Git.

Validate the offline daily schedule locally:

- PDF opens locally.
- XLSX opens locally.
- Schedule contains booking time, client, service, therapist, room, status, payment status, and balance due fields.
- Schedule is understandable enough for reception to work from it if Airtable or internet access fails.
- No generated file is staged in Git.

## Post-Run Git Safety Check

After generating the files, run:

```bash
git status --short --ignored --untracked-files=all
```

Expected result:

- Generated backup folders may appear as ignored files.
- Generated files must not appear as staged files.
- No generated file may be committed.

## Evidence That May Be Shared

The following proof may be shared in a GitHub issue, PR comment, or technical debt report:

```text
P0-SEAL-05A DRY RUN RESULT
Date: YYYY-MM-DD
Location: Budva
Backup command: PASS / FAIL
Offline schedule command: PASS / FAIL
Backup manifest exists: YES / NO
Offline schedule manifest exists: YES / NO
CSV files open locally: YES / NO
XLSX files open locally: YES / NO
PDF opens locally: YES / NO
Generated files ignored by Git: YES / NO
Secrets exposed: NO
Client/payment data committed to Git: NO
Operator: <name>
```

Do not include screenshots or file extracts that show client names, phone numbers, payment details, private notes, tokens, or API keys.

## Failure Handling

If backup export fails:

1. Do not commit any partial output.
2. Check local environment variables.
3. Check Airtable table identifiers.
4. Check Airtable token permissions.
5. Re-run only after the cause is understood.

If offline schedule generation fails:

1. Do not commit any partial output.
2. Confirm Bookings table access.
3. Confirm date and branch arguments.
4. Confirm generated-output folders are still ignored.

## Closure Criteria

P0-SEAL-05A is considered closed when:

- `audit:ops-backup-safety` passes locally.
- Backup export command completes locally.
- Offline schedule command completes locally.
- Expected CSV/XLSX/PDF/manifest outputs are created locally.
- Generated files remain outside Git commits.
- No Airtable token or private guest/payment data is exposed.

## Business Meaning

After P0-SEAL-05A is closed, Santis OS has operational evidence that it can produce backup and offline working files for reception without relying only on live Airtable availability.
