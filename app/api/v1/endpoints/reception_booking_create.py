from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/reception", tags=["reception"])

AIRTABLE_API_URL = "https://api.airtable.com/v0"
AIRTABLE_BASE_ID_ENV_KEYS = ("AIRTABLE_BASE_ID", "AIRTABLE_SANTIS_BASE_ID")
AIRTABLE_TOKEN_ENV_KEYS = ("AIRTABLE_PAT", "AIRTABLE_API_KEY")

BOOKINGS_TABLE_ID = os.getenv("AIRTABLE_BOOKINGS_TABLE_ID", "tblocCFVgSNfaLAH6")
BRANCH_CONFIG_TABLE_ID = os.getenv("AIRTABLE_BRANCH_BOARD_CONFIG_TABLE_ID", "tblW9jDU4gOXbrJCe")
THERAPISTS_TABLE_ID = os.getenv("AIRTABLE_THERAPISTS_TABLE_ID", "tblP1I56GubdY96Es")
ROOMS_TABLE_ID = os.getenv("AIRTABLE_ROOMS_TABLE_ID", "tblikrHnBSMKt5B3h")
SERVICES_TABLE_ID = os.getenv("AIRTABLE_SERVICES_TABLE_ID", "tbluiywBUXipbWlIa")
CLIENTS_TABLE_ID = os.getenv("AIRTABLE_CLIENTS_TABLE_ID", "tbl6cxT1XnkUifl4I")

CANONICAL_CREATE_ENABLE_ENV = "SANTIS_LOCK59_CANONICAL_CREATE_ENABLED"
LIVE_CREATE_ENABLE_ENV = "SANTIS_LOCK59_LIVE_CREATE_ENABLED"
RECORD_ID_RE = re.compile(r"^rec[A-Za-z0-9]{14}$")

CONFIG_FIELDS = [
    "Board Name",
    "Branch Code",
    "Tenant_Link",
    "Location_Link",
    "Environment",
    "Board Status",
    "QA Status",
    "Booking_Create_Enabled",
]
THERAPIST_FIELDS = ["Name", "Tenant_Link", "Location_Link", "Environment", "Active", "Status"]
ROOM_FIELDS = ["Name", "Tenant_Link", "Location_Link", "Environment", "Room_Status", "Status"]
SERVICE_FIELDS = ["Name", "Tenant_Link", "Active", "Status"]
CLIENT_FIELDS = ["Full Name", "Tenant_Link", "Environment", "Status"]

BLOCKED_RESOURCE_STATUSES = {
    "archive",
    "archived",
    "blocked",
    "cancelled",
    "closed",
    "inactive",
    "maintenance",
    "out of service",
    "terminated",
}
ALLOWED_INITIAL_BOOKING_STATUSES = {"Draft", "Hold", "Pending"}
TEST_WRITE_BOARD_STATUSES = {"Ready for Test", "QA Testing", "Active"}
LIVE_WRITE_QA_STATUSES = {"PASS", "QA PASS"}


class CanonicalBookingCreateRequest(BaseModel):
    branchConfigId: str
    clientId: str
    serviceId: str
    therapistId: str
    roomId: str
    startDateTime: str
    status: str = "Draft"
    receptionNotes: str | None = None
    dryRun: bool = True
    forceLive: bool = False


def _first_env(keys: tuple[str, ...]) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return None


def _env_enabled(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in {"1", "true", "yes", "on"}


def _airtable_token() -> str:
    token = _first_env(AIRTABLE_TOKEN_ENV_KEYS)
    if not token:
        raise HTTPException(
            status_code=503,
            detail="Airtable token is not configured. Set AIRTABLE_PAT or AIRTABLE_API_KEY.",
        )
    return token


def _airtable_base_id() -> str:
    base_id = _first_env(AIRTABLE_BASE_ID_ENV_KEYS)
    if not base_id:
        raise HTTPException(status_code=503, detail="Airtable base is not configured. Set AIRTABLE_BASE_ID.")
    return base_id


def _airtable_json_request(
    method: str,
    table_id: str,
    *,
    record_id: str | None = None,
    fields: list[str] | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    base_id = _airtable_base_id()
    token = _airtable_token()
    suffix = f"/{record_id}" if record_id else ""
    params: list[tuple[str, str]] = []
    for field_name in fields or []:
        params.append(("fields[]", field_name))
    query = f"?{urlencode(params)}" if params else ""
    url = f"{AIRTABLE_API_URL}/{base_id}/{table_id}{suffix}{query}"
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(
        url,
        data=body,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urlopen(request, timeout=15) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(status_code=502, detail=f"Airtable {method} failed: {raw[:800]}") from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"Airtable network error: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="Airtable returned invalid JSON") from exc


def _airtable_get_record(table_id: str, record_id: str, fields: list[str]) -> dict[str, Any]:
    return _airtable_json_request("GET", table_id, record_id=record_id, fields=fields)


def _airtable_create_record(table_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    response = _airtable_json_request(
        "POST",
        table_id,
        payload={"records": [{"fields": fields}], "typecast": False},
    )
    records = response.get("records") or []
    if not records:
        raise HTTPException(status_code=502, detail="Airtable did not return the created booking record.")
    return records[0]


def _require_record_id(value: str, label: str) -> str:
    if not RECORD_ID_RE.fullmatch(value or ""):
        raise HTTPException(status_code=422, detail=f"{label} must be an Airtable record ID.")
    return value


def _link_ids(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value] if RECORD_ID_RE.fullmatch(value) else []
    if isinstance(value, dict):
        record_id = value.get("id")
        return [record_id] if isinstance(record_id, str) and RECORD_ID_RE.fullmatch(record_id) else []
    if isinstance(value, list):
        result: list[str] = []
        for item in value:
            result.extend(_link_ids(item))
        return result
    return []


def _normalize(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, dict):
        value = value.get("name") or value.get("id") or ""
    return str(value).strip()


def _require_exactly_one_link(fields: dict[str, Any], field_name: str, owner: str) -> str:
    ids = _link_ids(fields.get(field_name))
    if len(ids) != 1:
        raise HTTPException(
            status_code=409,
            detail=f"{owner}.{field_name} must contain exactly one canonical record link; found {len(ids)}.",
        )
    return ids[0]


def _require_expected_tenant(fields: dict[str, Any], expected_tenant_id: str, owner: str) -> None:
    tenant_ids = _link_ids(fields.get("Tenant_Link"))
    if set(tenant_ids) != {expected_tenant_id}:
        raise HTTPException(
            status_code=409,
            detail=f"{owner} tenant mismatch. Expected exactly {expected_tenant_id}; got {tenant_ids}.",
        )


def _require_expected_location(fields: dict[str, Any], expected_location_id: str, owner: str) -> None:
    location_ids = _link_ids(fields.get("Location_Link"))
    if expected_location_id not in location_ids:
        raise HTTPException(
            status_code=409,
            detail=f"{owner} location mismatch. Expected branch {expected_location_id}; got {location_ids}.",
        )


def _require_environment(fields: dict[str, Any], expected_environment: str, owner: str) -> None:
    environment = _normalize(fields.get("Environment"))
    if environment != expected_environment:
        raise HTTPException(
            status_code=409,
            detail=f"{owner} environment mismatch. Expected {expected_environment}; got {environment or 'EMPTY'}.",
        )


def _require_not_blocked_status(fields: dict[str, Any], owner: str, *field_names: str) -> None:
    for field_name in field_names:
        value = _normalize(fields.get(field_name)).lower()
        if value in BLOCKED_RESOURCE_STATUSES:
            raise HTTPException(status_code=409, detail=f"{owner}.{field_name} is not operational: {value}.")


def _parse_aware_datetime(value: str) -> str:
    candidate = (value or "").strip()
    if candidate.endswith("Z"):
        candidate = candidate[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="startDateTime must be valid ISO-8601.") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise HTTPException(status_code=422, detail="startDateTime must include an explicit UTC offset or Z.")
    return parsed.isoformat()


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _preflight(payload: CanonicalBookingCreateRequest) -> tuple[dict[str, Any], dict[str, Any]]:
    config_id = _require_record_id(payload.branchConfigId, "branchConfigId")
    client_id = _require_record_id(payload.clientId, "clientId")
    service_id = _require_record_id(payload.serviceId, "serviceId")
    therapist_id = _require_record_id(payload.therapistId, "therapistId")
    room_id = _require_record_id(payload.roomId, "roomId")
    start_datetime = _parse_aware_datetime(payload.startDateTime)

    if payload.status not in ALLOWED_INITIAL_BOOKING_STATUSES:
        raise HTTPException(
            status_code=409,
            detail=f"Initial booking status must be one of {sorted(ALLOWED_INITIAL_BOOKING_STATUSES)}.",
        )
    if payload.receptionNotes and len(payload.receptionNotes) > 2000:
        raise HTTPException(status_code=422, detail="receptionNotes exceeds 2000 characters.")

    config = _airtable_get_record(BRANCH_CONFIG_TABLE_ID, config_id, CONFIG_FIELDS)
    config_fields = config.get("fields", {})
    tenant_id = _require_exactly_one_link(config_fields, "Tenant_Link", "Branch_Board_Config")
    location_id = _require_exactly_one_link(config_fields, "Location_Link", "Branch_Board_Config")
    environment = _normalize(config_fields.get("Environment"))
    board_status = _normalize(config_fields.get("Board Status"))
    qa_status = _normalize(config_fields.get("QA Status"))
    booking_create_enabled = bool(config_fields.get("Booking_Create_Enabled"))

    if environment not in {"Test", "Live"}:
        raise HTTPException(status_code=409, detail=f"Branch config environment is not creatable: {environment or 'EMPTY'}.")

    therapist = _airtable_get_record(THERAPISTS_TABLE_ID, therapist_id, THERAPIST_FIELDS)
    room = _airtable_get_record(ROOMS_TABLE_ID, room_id, ROOMS_FIELDS)
    service = _airtable_get_record(SERVICES_TABLE_ID, service_id, SERVICE_FIELDS)
    client = _airtable_get_record(CLIENTS_TABLE_ID, client_id, CLIENT_FIELDS)

    therapist_fields = therapist.get("fields", {})
    room_fields = room.get("fields", {})
    service_fields = service.get("fields", {})
    client_fields = client.get("fields", {})

    _require_expected_tenant(therapist_fields, tenant_id, "Therapist")
    _require_expected_location(therapist_fields, location_id, "Therapist")
    _require_environment(therapist_fields, environment, "Therapist")
    if not bool(therapist_fields.get("Active")):
        raise HTTPException(status_code=409, detail="Therapist is not Active.")
    _require_not_blocked_status(therapist_fields, "Therapist", "Status")

    _require_expected_tenant(room_fields, tenant_id, "Room")
    _require_expected_location(room_fields, location_id, "Room")
    _require_environment(room_fields, environment, "Room")
    _require_not_blocked_status(room_fields, "Room", "Room_Status", "Status")

    _require_expected_tenant(service_fields, tenant_id, "Service")
    if not bool(service_fields.get("Active")):
        raise HTTPException(status_code=409, detail="Service is not Active.")
    _require_not_blocked_status(service_fields, "Service", "Status")

    _require_expected_tenant(client_fields, tenant_id, "Client")
    _require_environment(client_fields, environment, "Client")
    _require_not_blocked_status(client_fields, "Client", "Status")

    booking_fields: dict[str, Any] = {
        "Tenant_Link": [tenant_id],
        "Location_Link": [location_id],
        "Environment": environment,
        "Client_Link": [client_id],
        "Service_Link": [service_id],
        "Therapist_Link": [therapist_id],
        "Room_Link": [room_id],
        "Start_DateTime": start_datetime,
        "Status_New": payload.status,
        "Branch_Config_Link": [config_id],
        "Booking_Create_State": "Submitted",
    }
    if payload.receptionNotes:
        booking_fields["Reception_Notes"] = payload.receptionNotes.strip()

    evidence = {
        "branchConfigId": config_id,
        "boardName": _normalize(config_fields.get("Board Name")),
        "branchCode": _normalize(config_fields.get("Branch Code")),
        "tenantId": tenant_id,
        "locationId": location_id,
        "environment": environment,
        "boardStatus": board_status,
        "qaStatus": qa_status,
        "bookingCreateEnabled": booking_create_enabled,
        "validatedAt": _utc_now_iso(),
        "canonicalCardinality": {
            "tenant": 1,
            "location": 1,
            "therapist": 1,
            "room": 1,
            "service": 1,
            "client": 1,
        },
        "legacySelectorFieldsWritten": [],
        "independentGuardsNotForged": [
            "Branch_Guard_Status",
            "Booking_Conflict_Status",
            "Therapist_Capability_Status",
            "Room_Capability_Status",
            "Therapist Shift Gate",
            "Quarantine_Status",
            "Level_3_Authorization_Link_Gate",
            "Live_Board_Final_Gate",
        ],
    }
    return booking_fields, evidence


def _assert_write_gate(payload: CanonicalBookingCreateRequest, evidence: dict[str, Any]) -> None:
    if not evidence["bookingCreateEnabled"]:
        raise HTTPException(status_code=409, detail="Branch config Booking_Create_Enabled is false. Write blocked.")
    if not _env_enabled(CANONICAL_CREATE_ENABLE_ENV):
        raise HTTPException(
            status_code=409,
            detail=f"Canonical booking writes are disabled. Set {CANONICAL_CREATE_ENABLE_ENV}=true only for controlled QA.",
        )

    environment = evidence["environment"]
    board_status = evidence["boardStatus"]
    qa_status = evidence["qaStatus"]

    if environment == "Test":
        if board_status not in TEST_WRITE_BOARD_STATUSES:
            raise HTTPException(
                status_code=409,
                detail=f"Test config Board Status must be one of {sorted(TEST_WRITE_BOARD_STATUSES)}; got {board_status or 'EMPTY'}.",
            )
        return

    if not payload.forceLive:
        raise HTTPException(status_code=409, detail="Live canonical booking write requires forceLive=true.")
    if not _env_enabled(LIVE_CREATE_ENABLE_ENV):
        raise HTTPException(
            status_code=409,
            detail=f"Live canonical booking writes are disabled. {LIVE_CREATE_ENABLE_ENV} is not enabled.",
        )
    if board_status != "Active":
        raise HTTPException(status_code=409, detail="Live branch config Board Status must be Active.")
    if qa_status not in LIVE_WRITE_QA_STATUSES:
        raise HTTPException(
            status_code=409,
            detail=f"Live branch config QA Status must be one of {sorted(LIVE_WRITE_QA_STATUSES)}.",
        )


@router.post("/bookings")
def create_canonical_booking(payload: CanonicalBookingCreateRequest) -> dict[str, Any]:
    """LOCK-59 canonical create contract.

    The client supplies a Branch_Board_Config record ID plus resource record IDs.
    Tenant, location and environment are resolved from config and never trusted from
    client input. Legacy branch-specific selector fields are never written.

    dryRun defaults to True. Real writes require explicit environment gates; Live
    writes additionally require forceLive and a separate Live enable flag.
    """

    booking_fields, evidence = _preflight(payload)

    if payload.dryRun:
        return {
            "ok": True,
            "dryRun": True,
            "bookingCreated": False,
            "contract": "LOCK-59-CANONICAL-CREATE-V1",
            "evidence": evidence,
            "wouldCreateFields": booking_fields,
            "message": "Canonical preflight passed. No Airtable record was created.",
        }

    _assert_write_gate(payload, evidence)
    created = _airtable_create_record(BOOKINGS_TABLE_ID, booking_fields)
    booking_record_id = created.get("id")
    if not booking_record_id:
        raise HTTPException(status_code=502, detail="Booking was created but no Airtable record ID was returned.")

    return {
        "ok": True,
        "dryRun": False,
        "bookingCreated": True,
        "contract": "LOCK-59-CANONICAL-CREATE-V1",
        "bookingRecordId": booking_record_id,
        "environment": evidence["environment"],
        "branchConfigId": evidence["branchConfigId"],
        "tenantId": evidence["tenantId"],
        "locationId": evidence["locationId"],
        "legacySelectorFieldsWritten": [],
        "message": "Canonical booking created. Independent guards must still evaluate before Live Board readiness.",
    }
