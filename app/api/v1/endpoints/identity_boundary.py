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
    find_impacted_booking_ids,
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
BOOKING_SOURCE_SIGNATURE = "Identity_Source_Signature_v0_1"
BOOKING_FRESHNESS = "Identity_Evidence_Freshness_Status_v0_1"
BOOKING_IDENTITY_GUARD = "Therapist_Shift_Identity_Guard"
BOOKING_SHIFT_LINK = "Staff Shift Link"
BOOKING_THERAPIST_LINK = "Therapist_Link"
BOOKING_ENVIRONMENT = "Environment"

SHIFT_STAFF_LINK = "Staff_Link"
SHIFT_ENVIRONMENT = "Environment"
SHIFT_SOURCE_SIGNATURE = "Shift_Identity_Source_Signature_v0_1"

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
        self.token = token
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
            detail = response.text[:1200]
            raise RuntimeError(f"Airtable {method} {table}{path} failed: {response.status_code} {detail}")
        return response.json()

    async def read_record(self, table: str, record_id: str) -> dict[str, Any]:
        return await self.request("GET", table, f"/{record_id}")

    async def list_records(self, table: str, fields: list[str]) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []
        offset: str | None = None
        while True:
            params: list[tuple[str, str]] = [("pageSize", "100")]
            params.extend(("fields[]", field) for field in fields)
            if offset:
                params.append(("offset", offset))
            payload = await self.request("GET", table, params=params)
            records.extend(payload.get("records") or [])
            offset = payload.get("offset")
            if not offset:
                return records

    async def patch_records(self, table: str, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        updated: list[dict[str, Any]] = []
        for index in range(0, len(records), 10):
            batch = records[index : index + 10]
            payload = await self.request(
                "PATCH",
                table,
                json_body={"records": batch, "typecast": False},
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
        raise HTTPException(
            status_code=409,
            detail=f"{label} is not Test; Environment={environment!r}",
        )


async def find_existing_run(client: AirtableClient, idempotency_key: str) -> dict[str, Any] | None:
    records = await client.list_records(
        TABLE_RUNS,
        ["Idempotency_Key", "Run_Status", "Result_Message"],
    )
    matches = [
        record
        for record in records
        if (record.get("fields") or {}).get("Idempotency_Key") == idempotency_key
    ]
    if len(matches) > 1:
        raise HTTPException(status_code=409, detail="duplicate idempotency key rows detected")
    return matches[0] if matches else None


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
            "Trigger_Type": "API/Webhook",
            "Source_Record_ID": request.shift_record_id,
            "Target_Record_ID": request.shift_record_id,
            "Result_Message": "Synchronous identity boundary started; no shift mutation performed yet.",
            "Run_By": "Santis OS Identity Write-Through Boundary",
            "Idempotency_Key": idempotency_key,
            "Input_Fingerprint": idempotency_key.rsplit("H=", 1)[-1],
            "Idempotency_Namespace": "SHIFT_MATCH",
            "Contract_Version": CONTRACT_VERSION,
            "Attempt_Number": 1,
            "Mutation_Type": "RECONCILE",
            "Run_Started_At": now_iso(),
        },
    )


async def finish_run(
    client: AirtableClient,
    run_id: str,
    *,
    status: str,
    message: str,
    error_log: str = "",
) -> None:
    await client.patch_records(
        TABLE_RUNS,
        [
            {
                "id": run_id,
                "fields": {
                    "Run_Status": status,
                    "Run_Finished_At": now_iso(),
                    "Result_Message": message,
                    "Error_Log": error_log[:5000],
                },
            }
        ],
    )


async def read_impacted_bookings(client: AirtableClient, shift_record_id: str) -> list[dict[str, Any]]:
    bookings = await client.list_records(
        TABLE_BOOKINGS,
        [BOOKING_SHIFT_LINK, BOOKING_ENVIRONMENT],
    )
    impacted_ids = find_impacted_booking_ids(bookings, shift_record_id)
    impacted = [record for record in bookings if record.get("id") in set(impacted_ids)]
    for booking in impacted:
        assert_test_record(booking, f"Impacted booking {booking.get('id')}")
    return sorted(impacted, key=lambda record: str(record.get("id")))


async def invalidate_and_verify(
    client: AirtableClient,
    impacted_booking_ids: list[str],
) -> list[dict[str, Any]]:
    if impacted_booking_ids:
        await client.patch_records(
            TABLE_BOOKINGS,
            [
                {
                    "id": booking_id,
                    "fields": {BOOKING_RECONCILED_SIGNATURE: None},
                }
                for booking_id in impacted_booking_ids
            ],
        )

    verified: list[dict[str, Any]] = []
    for booking_id in impacted_booking_ids:
        current = await client.read_record(TABLE_BOOKINGS, booking_id)
        freshness = (current.get("fields") or {}).get(BOOKING_FRESHNESS)
        if freshness == "FRESH - SOURCE_MATCH":
            raise HTTPException(
                status_code=409,
                detail=f"invalidation verification failed for {booking_id}",
            )
        verified.append(current)
    return verified


async def reconcile_shift(client: AirtableClient, shift_record_id: str) -> dict[str, Any]:
    shift = await client.read_record(TABLE_SHIFTS, shift_record_id)
    assert_test_record(shift, f"Shift {shift_record_id}")
    evidence = compute_shift_evidence(shift)
    await client.patch_records(
        TABLE_SHIFTS,
        [{"id": shift_record_id, "fields": shift_cache_patch(evidence)}],
    )
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
    await client.patch_records(
        TABLE_BOOKINGS,
        [{"id": booking_id, "fields": booking_cache_patch(evidence)}],
    )
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
            existing = await find_existing_run(client, idempotency_key)
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

            impacted = await read_impacted_bookings(client, request.shift_record_id)
            impacted_ids = [str(record["id"]) for record in impacted]

            run_record = await log_run_start(
                client,
                control_record_id=control_record_id,
                request=request,
                idempotency_key=idempotency_key,
            )

            invalidation_started_at = now_iso()
            await invalidate_and_verify(client, impacted_ids)
            invalidated_at = now_iso()

            # Re-read immediately before mutation. If another writer changed Staff_Link,
            # abort while impacted bookings remain fail-closed.
            shift_pre_mutation = await client.read_record(TABLE_SHIFTS, request.shift_record_id)
            current_staff_ids = stable_record_ids(
                (shift_pre_mutation.get("fields") or {}).get(SHIFT_STAFF_LINK)
            )
            if current_staff_ids != expected_staff_ids:
                message = (
                    "Expected shift owner changed before mutation; impacted bookings remain stale. "
                    f"expected={expected_staff_ids} current={current_staff_ids}"
                )
                await finish_run(client, str(run_record["id"]), status="Failed", message=message)
                raise HTTPException(status_code=409, detail=message)

            await client.patch_records(
                TABLE_SHIFTS,
                [
                    {
                        "id": request.shift_record_id,
                        "fields": {SHIFT_STAFF_LINK: new_staff_ids},
                    }
                ],
            )
            shift_mutated_at = now_iso()

            shift_after = await reconcile_shift(client, request.shift_record_id)
            reconciled_bookings: list[dict[str, Any]] = []
            for booking_id in impacted_ids:
                reconciled_bookings.append(await reconcile_booking(client, booking_id))
            reconciled_at = now_iso()

            stale_after_reconcile = [
                booking.get("id")
                for booking in reconciled_bookings
                if (booking.get("fields") or {}).get(BOOKING_FRESHNESS) != "FRESH - SOURCE_MATCH"
            ]
            if stale_after_reconcile:
                message = f"Reconciliation incomplete; stale bookings remain: {stale_after_reconcile}"
                await finish_run(client, str(run_record["id"]), status="Failed", message=message)
                raise HTTPException(status_code=409, detail=message)

            message = (
                f"Write-through complete; impacted={len(impacted_ids)}; "
                "all impacted bookings were verified non-FRESH before shift mutation."
            )
            await finish_run(client, str(run_record["id"]), status="Success", message=message)

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
                        message="Write-through boundary failed; prior invalidation remains fail-closed if completed.",
                        error_log=str(exc),
                    )
                except Exception:
                    pass
            raise HTTPException(status_code=500, detail=f"identity boundary failed: {exc}") from exc
        finally:
            await client.close()
