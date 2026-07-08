# Santis OS Automation Control Plane — Rollout Plan

Status: Proposed and partially scaffolded
Branch: `feat/automation-control-readonly`

## 1. Objective

Connect the existing Airtable `Automation_Control` governance registry to Santis OS Admin without changing current Airtable records or native Airtable automation toggles during the first phase.

The control plane must preserve four distinct concepts:

1. **Observed native state** — `Airtable Status`
2. **Governance lifecycle** — `Santis OS Status`
3. **One-shot execution request** — `Run_Request`
4. **Computed safety permission** — `Can_Run`

These must not be collapsed into one ON/OFF toggle.

## 2. Non-negotiable safety rules

- No browser-side Airtable PAT or API key.
- No direct frontend calls to Airtable.
- No mutation endpoint in Phase 1.
- No changes to `OFF`, `Can Activate?`, `Run_Request`, or `Santis OS Status` in Phase 1.
- No native Airtable automation toggle changes in Phase 1.
- `Can_Run = 0` always renders as locked/non-runnable.
- Live environment controls remain disabled until Preview/Test acceptance is complete.
- High-risk state changes require explicit confirmation and audit evidence.
- Tenant, Location, and Environment context must be checked before any future write request.

## 3. Phase 1 — Read-only mirror

### Backend

Add:

`GET /api/v1/admin/automation-control`

Behavior:

- Reads only the existing Airtable `Automation_Control` table.
- Uses backend Airtable credentials.
- Normalizes governance fields for the Admin UI.
- Sorts by `Activation Order`.
- Returns `mode = read-only`.
- Is disabled by default behind:

`SANTIS_AUTOMATION_CONTROL_READ_ENABLED=true`

### Frontend

Add a read-only `AutomationControlCenter` surface showing:

- Automation Name
- Environment
- Source Table
- Target Table
- Airtable Status
- Santis OS Status
- Risk Level
- Can Activate?
- Activation Order
- Can_Run
- Last observed timestamp

All visible toggles remain non-interactive and are labeled as read-only.

### Acceptance

- Existing five registry records render.
- `Can_Run = 0` renders locked.
- No PATCH/POST request exists.
- Airtable record values remain unchanged before/after test.
- Native Airtable automation toggles remain unchanged before/after test.

## 4. Phase 2 — Registry completeness and identity

Current registry coverage must be reconciled against the actual automation inventory before enabling controls.

Required additions should be reviewed before creation:

- Stable `Automation_Key`
- Optional native automation identifier if available from a supported source
- Registry ownership/status for current booking safety automations

Do not use display name alone as long-term identity because names can be renamed.

Target booking safety registry includes, at minimum:

- Booking Combo Segment Generator
- Atomic Concurrency Guard
- Segment Therapist Capability Guard
- Segment Room Capability Guard
- Segment Therapist Conflict Guard
- Segment Room Conflict Guard
- Segment Operational Quarantine
- SRG Aggregate Gate

## 5. Phase 3 — Desired state model

Do not overload `Airtable Status` as a command field.

Recommended future field:

`Requested_Mode`

Allowed values:

- OFF
- SHADOW
- MONITOR
- ENFORCE

Meaning:

- **OFF** — execution disabled by Santis OS policy
- **SHADOW** — calculate/log only, no operational mutation
- **MONITOR** — surface findings, do not block operation
- **ENFORCE** — guard may apply operational block/mutation according to contract

`Airtable Status` remains observed/native state.

## 6. Phase 4 — Safe write request API

Future command endpoint:

`POST /api/v1/admin/automation-control/{id}/request-mode`

The endpoint must not blindly toggle native Airtable automations.

Required checks:

1. Authenticated admin session
2. Role authorization
3. Tenant scope
4. Location scope
5. Environment scope
6. Risk-level policy
7. `Can Activate?`
8. `Can_Run`
9. Current-state/version check
10. Required reason for high-risk changes

The command writes a requested policy state and audit event first.

## 7. Phase 5 — Execution adapter

Each controllable automation must read the Santis OS control state before operational mutation.

Conceptual flow:

User/Admin request
→ policy validation
→ requested mode
→ execution adapter
→ run/skip decision
→ `Automation_Runs` audit row

Expected skip result:

`SKIPPED_DISABLED`

An OFF result must not write PASS, FAIL, quarantine changes, booking changes, or live-board changes.

## 8. Phase 6 — RBAC

Recommended permissions:

- Receptionist: view none or read-only summary
- Spa Manager: branch-scoped read; future SHADOW/MONITOR request only
- Owner / Boardroom Admin: controlled mode requests
- System Admin: technical registry and adapter management

High-risk Live changes require confirmation and reason.

## 9. Phase 7 — Rollout order

1. Read-only Preview
2. Read-only Test
3. Registry reconciliation
4. One low-risk Test automation in SHADOW
5. Audit verification
6. One controlled MONITOR pilot
7. ENFORCE only after explicit acceptance
8. Live branch rollout one branch at a time

## 10. Current implementation status

Implemented on `feat/automation-control-readonly`:

- Read-only FastAPI endpoint scaffold
- Endpoint registration in production runtime entry
- Endpoint registration in local runtime entry
- Read-only React `AutomationControlCenter` component
- Feature flag default-off behavior

Not yet completed:

- Boardroom navigation wiring
- Build/type/lint verification
- Runtime smoke test against Preview
- Authentication hardening for the admin control endpoint
- Any write endpoint
- Any Airtable record mutation
- Any native Airtable automation toggle mutation
