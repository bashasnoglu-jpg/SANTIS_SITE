from __future__ import annotations

import asyncio
import os
import secrets
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.domain.identity_write_through import (
    CONTRACT_VERSION,
    booking_cache_patch,
    compute_booking_evidence,
    compute_shift_evidence,
    deterministic_boundary_key,
    reverse_impacted_booking_ids,
    shift_cache_patch,
    stable_record_ids,
)

router = APIRouter(tags=["identity-boundary"])

AIRTABLE_API_URL = "https://api.airtable.com/v0"
BASE_ID = os.getenv("AIRTABLE_BASE_ID") or os.getenv("AIRTABLE_SANTIS_BASE_ID")
AIRTABLE_TOKEN = os.getenv("AIRTABLE_PAT") or os.getenv("AIRTABLE_API_KEY")
BOUNDARY_SECRET = os.getenv("IDENTITY_BOUNDARY_SHARED_SECRET")
CONTROL_RECORD_ID = os.getenv("IDENTITY_RECON_CONTROL_RECORD_ID")

TABLE_BOOKINGS = os.getenv("IDENTITY_RECON_BOOKINGS_TABLE", "tblocCFVgSNfaLAH6")
TABLE_SHIFTS = os.getenv("IDENTITY_RECON_SHIFTS_TABLE", "tblQjvfz4ljnvCl1R")
TABLE_RUNS = os.getenv("IDENTITY_RECON_RUNS_TABLE", "tblZfL6UuOfxz3On1")

BOOKING_RECONCILED_SIGNATURE = "Identity_Reconciled_Source_Signature_v0_1"
BOOKING_FRESHNESS = "Identity_Evidence_Freshness_Status_v0_1"
BOOKING_IDENTITY_GUARD = "Therapist_Shift_Identity_Guard"
BOOKING_SHIFT_LINK = "Staff Shift Link"
BOOKING_ENVIRONMENT = "Environment"
SHIFT_STAFF_LINK = "Staff_Link"
SHIFT_BOOKINGS_REVERSE_LINK = "Bookings"

_lock_guard = asyncio.Lock()
_shift_locks: dict[str, asyncio.Lock] = {}


class ShiftOwnerWriteThroughRequest(BaseModel):
    correlation_id: str = Field(min_length=8, max_length=200)
    shift_record_id: str
    expected_current_staff_record_ids: list[str]
    new_staff_record_ids: list[str]

    @field_validator("shift_record_id")
    @classmethod
    def validate_shift_id(cls, value: str) -> str:
        if not value.startswith("rec"):
            raise ValueError("shift_record_id must be an Airtable record ID")
        return value

    @field_validator("expected_current_staff_record_ids", "new_staff_record_ids")
    @classmethod
    def validate_staff_ids(cls, value: list[str]) -> list[str]:
        normalized = sorted(set(value))
        if len(normalized) != 1:
            raise ValueError("identity boundary currently requires exactly one staff record ID")
        if any(not item.startswith("rec") for item in normalized):
            raise ValueError("staff IDs must be Airtable record IDs")
        return normalized


class AirtableClient:
    def __init__(self, base_id: str, token: str):
        self.base_id = base_id
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )

    async def close(self) -> None:
        await self.client.aclose()

    async def request(
        self,
        method: str,
        table: str,
        path: str = "",
        *,
        params: list[tuple[str, str]] | None = None,
        json_body: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        url = f"{AIRTABLE_API_URL}/{self.base_id}/{table}{path}"
        response = await self.client.request(method, url, params=params, json=json_body)
        if response.status_code >= 400:
            raise RuntimeError(
                f"Airtable {method} {table}{path} failed: "
                f"{response.status_code} {response.text[:1200]}"
            )
        return response.json()

    async def read_record(self, table: str, record_id: str) -> dict[str, Any]:
        return await self.request("GET", table, f"/{record_id}")

    async def list_records(
        self,
        table: str,
        fields: list[str],
        *,
        filter_by_formula: str | None = None,
        max_records: int | None = None,
    ) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []
        offset: str | None = None
        while True:
            page_size = min(100, max_records) if max_records else 100
            params: list[tuple[str, str]] = [("pageSize", str(page_size))]
            params.extend(("fields[]", field) for field in fields)
            if filter_by_formula:
                params.append(("filterByFormula", filter_by_formula))
            if max_records:
                params.append(("maxRecords", str(max_records)))
            if offset:
                params.append(("offset", offset))
            payload = await self.request("GET", table, params=params)
            records.extend(payload.get("records") or [])
            if max_records and len(records) >= max_records:
                return records[:max_records]
            offset = payload.get("offset")
            if not offset:
                return records

    async def patch_records(self, table: str, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        updated: list[dict[str, Any]] = []
        for index in range(0, len(records), 10):
            payload = await self.request(
                "PATCH",
                table,
                json_body={"records": records[index : index + 10], "typecast": False},
            )
            updated.extend(payload.get("records") or [])
        return updated

    async def create_record(self, table: str, fields: dict[str, Any]) -> dict[str, Any]:
        payload = await self.request(
            "POST",
            table,
            json_body={"records": [{"fields": fields}], "typecast": False},
        )
        record = (payload.get("records") or [None])[0]
        if not isinstance(record, dict) or not record.get("id"):
            raise RuntimeError("Airtable create returned no record")
        return record


async def get_shift_lock(shift_record_id: str) -> asyncio.Lock:
    async with _lock_guard:
        lock = _shift_locks.get(shift_record_id)
        if lock is None:
            lock = asyncio.Lock()
            _shift_locks[shift_record_id] = lock
        return lock


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def escape_airtable_formula_string(value: str) -> str:
    return str(value).replace("\\", "\\\\").replace("'", "\\'")


def require_runtime_config() -> tuple[str, str, str, str]:
    if not BASE_ID:
        raise HTTPException(status_code=503, detail="AIRTABLE_BASE_ID is not configured")
    if not AIRTABLE_TOKEN:
        raise HTTPException(status_code=503, detail="AIRTABLE_PAT is not configured")
    if not BOUNDARY_SECRET:
        raise HTTPException(status_code=503, detail="IDENTITY_BOUNDARY_SHARED_SECRET is not configured")
    if not CONTROL_RECORD_ID or not CONTROL_RECORD_ID.startswith("rec"):
        raise HTTPException(status_code=503, detail="IDENTITY_RECON_CONTROL_RECORD_ID is not configured")
    return BASE_ID, AIRTABLE_TOKEN, BOUNDARY_SECRET, CONTROL_RECORD_ID


def authenticate(provided_secret: str | None, configured_secret: str) -> None:
    if not provided_secret or not secrets.compare_digest(provided_secret, configured_secret):
        raise HTTPException(status_code=401, detail="invalid identity boundary secret")


def assert_test_record(record: dict[str, Any], label: str) -> None:
    environment = (record.get("fields") or {}).get("Environment")
    if environment != "Test":
        raise HTTPException(status_code=409, detail=f"{label} is not Test; Environment={environment!r}")


async def find_runs_by_key(client: AirtableClient, idempotency_key: str) -> list[dict[str, Any]]:
    escaped = escape_airtable_formula_string(idempotency_key)
    formula = f"{{Idempotency_Key}}='{escaped}'"
    return await client.list_records(
        TABLE_RUNS,
        ["Idempotency_Key", "Run_Status", "Claim_Status", "Result_Message"],
        filter_by_formula=formula,
        max_records=2,
    )


async def log_run_start(
    client: AirtableClient,
    *,
    control_record_id: str,
    request: ShiftOwnerWriteThroughRequest,
    idempotency_key: str,
) -> dict[str, Any]:
    return await client.create_record(
        TABLE_RUNS,
        {
            "Run Name": f"P0.2-A.3G WRITE-THROUGH {request.shift_record_id} {now_iso()}",
            "Automation_Control_Link": [control_record_id],
            "Run_Status": "Running",
            "Environment": "Test",
            "Trigger_Type": "Webhook",
            "Source_Record_ID": request.shift_record_id,
            "Target_Record_ID": request.shift_record_id,
            "Result_Message": "Synchronous boundary started; shift mutation not yet performed.",
            "Run_By": "Santis OS Identity Write-Through Boundary",
            "Idempotency_Key": idempotency_key,
            "Input_Fingerprint": idempotency_key.rsplit("H=", 1)[-1],
            "Idempotency_Namespace": "SHIFT_MATCH",
            "Contract_Version": CONTRACT_VERSION,
            "Claim_Status": "CLAIM REQUESTED",
            "Attempt_Number": 1,
            "Mutation_Type": "RECONCILE",
            "Run_Started_At": now_iso(),
        },
    )


async def patch_run(client: AirtableClient, run_id: str, fields: dict[str, Any]) -> None:
    await client.patch_records(TABLE_RUNS, [{"id": run_id, "fields": fields}])


async def finish_run(
    client: AirtableClient,
    run_id: str,
    *,
    status: str,
    message: str,
    error_log: str = "",
    claim_status: str | None = None,
    mutation_type: str | None = None,
) -> None:
    fields: dict[str, Any] = {
        "Run_Status": status,
        "Run_Finished_At": now_iso(),
        "Result_Message": message,
        "Error_Log": error_log[:5000],
    }
    if claim_status:
        fields["Claim_Status"] = claim_status
    if mutation_type:
        fields["Mutation_Type"] = mutation_type
    await patch_run(client, run_id, fields)


async def discover_impacted_bookings(
    client: AirtableClient,
    shift_record_id: str,
) -> list[dict[str, Any]]:
    shift = await client.read_record(TABLE_SHIFTS, shift_record_id)
    assert_test_record(shift, f"Shift {shift_record_id}")
    impacted_ids = reverse_impacted_booking_ids(
        shift,
        reverse_field_name=SHIFT_BOOKINGS_REVERSE_LINK,
    )

    impacted: list[dict[str, Any]] = []
    for booking_id in impacted_ids:
        booking = await client.read_record(TABLE_BOOKINGS, booking_id)
        assert_test_record(booking, f"Impacted booking {booking_id}")
        current_shift_ids = stable_record_ids((booking.get("fields") or {}).get(BOOKING_SHIFT_LINK))
        if shift_record_id not in current_shift_ids:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"reverse-link drift for booking {booking_id}: "
                    f"shift {shift_record_id} absent from current Staff Shift Link"
                ),
            )
        impacted.append(booking)
    return sorted(impacted, key=lambda record: str(record.get("id")))


async def invalidate_and_verify(
    client: AirtableClient,
    impacted_booking_ids: list[str],
) -> None:
    if impacted_booking_ids:
        await client.patch_records(
            TABLE_BOOKINGS,
            [
                {"id": booking_id, "fields": {BOOKING_RECONCILED_SIGNATURE: None}}
                for booking_id in impacted_booking_ids
            ],
        )

    for booking_id in impacted_booking_ids:
        current = await client.read_record(TABLE_BOOKINGS, booking_id)
        if (current.get("fields") or {}).get(BOOKING_FRESHNESS) == "FRESH - SOURCE_MATCH":
            raise HTTPException(status_code=409, detail=f"invalidation verification failed for {booking_id}")


async def stabilize_and_invalidate_impacted_set(
    client: AirtableClient,
    shift_record_id: str,
    *,
    max_rounds: int = 3,
) -> list[str]:
    """Invalidate the exact reverse-linked set and verify it remains stable across rereads.

    This narrows but does not eliminate races from external writers. Direct Airtable edits
    can still bypass this process; the API response discloses that limitation.
    """
    known_ids: set[str] = set()
    for _ in range(max_rounds):
        impacted = await discover_impacted_bookings(client, shift_record_id)
        current_ids = {str(record["id"]) for record in impacted}
        union_ids = sorted(known_ids | current_ids)
        await invalidate_and_verify(client, union_ids)
        reread = await discover_impacted_bookings(client, shift_record_id)
        reread_ids = {str(record["id"]) for record in reread}
        known_ids |= current_ids | reread_ids
        if reread_ids == current_ids:
            await invalidate_and_verify(client, sorted(known_ids))
            return sorted(known_ids)
    raise HTTPException(status_code=409, detail="impacted booking set did not stabilize")


async def reconcile_shift(client: AirtableClient, shift_record_id: str) -> dict[str, Any]:
    shift = await client.read_record(TABLE_SHIFTS, shift_record_id)
    assert_test_record(shift, f"Shift {shift_record_id}")
    evidence = compute_shift_evidence(shift)
    await client.patch_records(TABLE_SHIFTS, [{"id": shift_record_id, "fields": shift_cache_patch(evidence)}])
    return await client.read_record(TABLE_SHIFTS, shift_record_id)


async def reconcile_booking(client: AirtableClient, booking_id: str) -> dict[str, Any]:
    booking = await client.read_record(TABLE_BOOKINGS, booking_id)
    assert_test_record(booking, f"Booking {booking_id}")
    shift_ids = stable_record_ids((booking.get("fields") or {}).get(BOOKING_SHIFT_LINK))
    shifts_by_id: dict[str, dict[str, Any]] = {}
    for shift_id in shift_ids:
        shift = await client.read_record(TABLE_SHIFTS, shift_id)
        assert_test_record(shift, f"Linked shift {shift_id}")
        shifts_by_id[shift_id] = shift
    evidence = compute_booking_evidence(booking, shifts_by_id)
    await client.patch_records(TABLE_BOOKINGS, [{"id": booking_id, "fields": booking_cache_patch(evidence)}])
    return await client.read_record(TABLE_BOOKINGS, booking_id)


@router.post("/reception/identity/shift-owner/write-through")
async def shift_owner_write_through(
    request: ShiftOwnerWriteThroughRequest,
    x_santis_identity_boundary_secret: str | None = Header(default=None),
) -> dict[str, Any]:
    base_id, token, configured_secret, control_record_id = require_runtime_config()
    authenticate(x_santis_identity_boundary_secret, configured_secret)

    expected_staff_ids = sorted(set(request.expected_current_staff_record_ids))
    new_staff_ids = sorted(set(request.new_staff_record_ids))
    idempotency_key = deterministic_boundary_key(
        shift_record_id=request.shift_record_id,
        expected_staff_ids=expected_staff_ids,
        new_staff_ids=new_staff_ids,
        correlation_id=request.correlation_id,
    )

    lock = await get_shift_lock(request.shift_record_id)
    async with lock:
        client = AirtableClient(base_id, token)
        run_record: dict[str, Any] | None = None
        try:
            existing_runs = await find_runs_by_key(client, idempotency_key)
            if len(existing_runs) > 1:
                raise HTTPException(status_code=409, detail="duplicate idempotency key rows detected")
            existing = existing_runs[0] if existing_runs else None
            if existing and (existing.get("fields") or {}).get("Run_Status") == "Success":
                return {
                    "status": "NOOP",
                    "reason": "deterministic request already completed",
                    "existing_run_id": existing.get("id"),
                    "idempotency_key": idempotency_key,
                    "contract_version": CONTRACT_VERSION,
                }
            if existing and (existing.get("fields") or {}).get("Run_Status") in {"Running", "Queued"}:
                raise HTTPException(status_code=409, detail="deterministic request already in progress")

            shift_before = await client.read_record(TABLE_SHIFTS, request.shift_record_id)
            assert_test_record(shift_before, f"Shift {request.shift_record_id}")

            run_record = await log_run_start(
                client,
                control_record_id=control_record_id,
                request=request,
                idempotency_key=idempotency_key,
            )
            await patch_run(
                client,
                str(run_record["id"]),
                {"Claim_Status": "CLAIMED", "Claimed_At": now_iso()},
            )

            invalidation_started_at = now_iso()
            impacted_ids = await stabilize_and_invalidate_impacted_set(client, request.shift_record_id)
            invalidated_at = now_iso()

            # Optimistic expected-state guard. A competing writer changes Staff_Link ->
            # abort after invalidation, leaving impacted bookings fail-closed.
            shift_pre_mutation = await client.read_record(TABLE_SHIFTS, request.shift_record_id)
            current_staff_ids = stable_record_ids((shift_pre_mutation.get("fields") or {}).get(SHIFT_STAFF_LINK))
            if current_staff_ids != expected_staff_ids:
                message = (
                    "Expected shift owner changed before mutation; impacted bookings remain stale. "
                    f"expected={expected_staff_ids} current={current_staff_ids}"
                )
                await finish_run(
                    client,
                    str(run_record["id"]),
                    status="Failed",
                    message=message,
                    claim_status="CONFLICT",
                )
                raise HTTPException(status_code=409, detail=message)

            await client.patch_records(
                TABLE_SHIFTS,
                [{"id": request.shift_record_id, "fields": {SHIFT_STAFF_LINK: new_staff_ids}}],
            )
            shift_mutated_at = now_iso()

            shift_after = await reconcile_shift(client, request.shift_record_id)
            reconciled_bookings = [
                await reconcile_booking(client, booking_id)
                for booking_id in impacted_ids
            ]
            reconciled_at = now_iso()

            stale_after_reconcile = [
                str(booking.get("id"))
                for booking in reconciled_bookings
                if (booking.get("fields") or {}).get(BOOKING_FRESHNESS) != "FRESH - SOURCE_MATCH"
            ]
            if stale_after_reconcile:
                message = f"Reconciliation incomplete; stale bookings remain: {stale_after_reconcile}"
                await finish_run(
                    client,
                    str(run_record["id"]),
                    status="Failed",
                    message=message,
                    claim_status="REJECTED",
                )
                raise HTTPException(status_code=409, detail=message)

            message = (
                f"Write-through complete; impacted={len(impacted_ids)}; "
                "all impacted bookings verified non-FRESH before shift mutation."
            )
            await finish_run(
                client,
                str(run_record["id"]),
                status="Success",
                message=message,
                claim_status="RELEASED",
                mutation_type="RECONCILE",
            )

            return {
                "status": "SUCCESS",
                "contract_version": CONTRACT_VERSION,
                "run_id": run_record.get("id"),
                "idempotency_key": idempotency_key,
                "shift_record_id": request.shift_record_id,
                "expected_staff_ids": expected_staff_ids,
                "new_staff_ids": new_staff_ids,
                "impacted_booking_ids": impacted_ids,
                "impact_count": len(impacted_ids),
                "invalidation_started_at": invalidation_started_at,
                "invalidated_at": invalidated_at,
                "shift_mutated_at": shift_mutated_at,
                "reconciled_at": reconciled_at,
                "boundary_order_proven": invalidated_at <= shift_mutated_at,
                "shift_freshness": (shift_after.get("fields") or {}).get(
                    "Shift_Identity_Freshness_Status_v0_1"
                ),
                "booking_results": [
                    {
                        "booking_record_id": booking.get("id"),
                        "freshness": (booking.get("fields") or {}).get(BOOKING_FRESHNESS),
                        "identity_guard": (booking.get("fields") or {}).get(BOOKING_IDENTITY_GUARD),
                    }
                    for booking in reconciled_bookings
                ],
                "honesty_boundary": {
                    "direct_airtable_edits_can_bypass_boundary": True,
                    "process_local_lock_is_not_distributed_lock": True,
                    "external_writer_can_race_after_last_impacted_set_read": True,
                    "native_airtable_trigger_deployed": False,
                },
            }

        except HTTPException:
            raise
        except Exception as exc:
            if run_record and run_record.get("id"):
                try:
                    await finish_run(
                        client,
                        str(run_record["id"]),
                        status="Failed",
                        message=(
                            "Write-through boundary failed; prior invalidation remains fail-closed "
                            "if completed."
                        ),
                        error_log=str(exc),
                        claim_status="REJECTED",
                    )
                except Exception:
                    pass
            raise HTTPException(status_code=500, detail=f"identity boundary failed: {exc}") from exc
        finally:
            await client.close()
