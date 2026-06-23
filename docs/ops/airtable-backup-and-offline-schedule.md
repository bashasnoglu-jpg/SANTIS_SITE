# Santis OS — Airtable Backup and Offline Daily Schedule Contract

## Phase

P0-SEAL-04A — Backup & Offline Schedule Contract

## Status

Proposed operational safety contract.

## Purpose

Santis OS may use Airtable as the live operational data source during the first operational phase, but Airtable must not be the only copy of operational data.

This contract closes two risks:

1. Data loss if Airtable data is accidentally changed, deleted, or unavailable.
2. Reception interruption if internet or Airtable access fails during the working day.

## Non-Negotiable Operating Targets

- Data loss target: zero.
- Reception interruption target: minimum.
- Airtable remains live operations for phase one.
- A second copy must exist outside Airtable.
- Reception must have an offline daily working file before the day starts.

## Tables Covered by Daily Backup

The daily backup must include at minimum:

- Bookings
- Clients
- Payments
- Inventory

These tables are the minimum safety set because they cover the live reservation ledger, guest identity, payment state, and stock/retail exposure.

## Required Backup Formats

Each daily backup must be exported in both formats:

- CSV per table
- One Excel workbook containing the covered tables as separate sheets

The Excel workbook is required for reception and management review. CSV files are required for future migration, import, and recovery workflows.

## Required Backup Destination

Airtable cannot be the only storage location. The daily backup must be copied to at least one external storage destination such as:

- Google Drive
- OneDrive
- Dropbox

The target architecture follows the 3-2-1 rule:

- Three copies
- Two different storage types or systems
- One copy outside the live Airtable system

## Backup Folder Convention

Recommended folder structure:

```text
Santis_OS_Backups/
  YYYY-MM-DD/
    bookings.csv
    clients.csv
    payments.csv
    inventory.csv
    santis_backup_YYYY-MM-DD.xlsx
```

Example:

```text
Santis_OS_Backups/
  2026-06-23/
    bookings.csv
    clients.csv
    payments.csv
    inventory.csv
    santis_backup_2026-06-23.xlsx
```

## Offline Daily Schedule Requirement

Every morning before reception starts, Santis OS must generate an Offline Daily Schedule for the active branch.

The offline schedule is the fallback working document if internet, Airtable, or the admin panel is unavailable.

Required formats:

- PDF
- Excel

Minimum fields:

- Booking ID
- Date
- Start time
- Finish time
- Client name
- Client phone
- Service
- Duration
- Therapist
- Room
- Status
- Payment status
- Balance due
- Notes

## Offline Schedule Folder Convention

Recommended folder structure:

```text
Santis_OS_Offline_Schedule/
  YYYY-MM-DD/
    budva-daily-schedule.pdf
    budva-daily-schedule.xlsx
```

Future branches may follow the same pattern:

```text
Santis_OS_Offline_Schedule/
  YYYY-MM-DD/
    kotor-daily-schedule.pdf
    kotor-daily-schedule.xlsx
    tivat-daily-schedule.pdf
    tivat-daily-schedule.xlsx
```

## Manual Reception Fallback Procedure

If Airtable or internet access is unavailable:

1. Reception opens the latest Offline Daily Schedule for the branch.
2. New arrivals are checked against the offline file.
3. Any same-day changes are written manually into the notes column or on a printed copy.
4. When Airtable access returns, reception reconciles manual changes into Airtable.
5. Reconciliation must preserve Booking ID, Client ID when available, timestamp, payment status, and notes.

## Data Chain That Must Be Preserved

Every booking must remain traceable across:

```text
Client → Booking → Payment → Notes → Preferences → Memberships
```

At minimum, every booking must preserve:

- Booking ID
- Client ID or client reference
- Timestamp
- Location
- Service
- Therapist
- Payment status

## Read-Only Rule for Backup Scripts

Backup and offline schedule generation must be read-only against Airtable.

Allowed:

- Read records
- Export records
- Generate CSV
- Generate Excel
- Generate PDF
- Copy output to external storage

Not allowed in the backup/export flow:

- Create Airtable records
- Update Airtable records
- Delete Airtable records
- Change Airtable schema
- Store Airtable tokens in frontend code
- Commit generated backup files to Git

## Repository Safety Rule

Generated backup and offline schedule output must not be committed to the repository.

Future implementation should ensure generated folders are ignored by Git, for example:

```text
Santis_OS_Backups/
Santis_OS_Offline_Schedule/
backups/
offline-schedule/
```

## Future Implementation Sequence

### P0-SEAL-04B — Backup Export Scaffold

Add a read-only export script that produces CSV and Excel backup output for the required tables.

Expected script name:

```text
scripts/ops/export-airtable-backup.mjs
```

### P0-SEAL-04C — Offline Daily Schedule Generator

Add a read-only generator that creates the daily branch schedule as Excel and PDF.

Expected script name:

```text
scripts/ops/generate-offline-daily-schedule.mjs
```

### P0-SEAL-04D — Backup Contract Audit

Add a CI audit to confirm that backup/offline scripts, output ignore rules, and read-only boundaries remain intact.

## Closure Criteria for P0-SEAL-04A

This contract is considered closed when:

- This document is merged to `develop`.
- No runtime code is changed.
- No backend behavior is changed.
- No frontend behavior is changed.
- No Airtable write action is introduced.
- No schema migration is introduced.

## Business Meaning

After this contract is accepted, Santis OS has a clear operational safety policy for protecting live reservation, client, payment, and inventory data before automation scripts are introduced.
