from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover - Python < 3.9 fallback
    ZoneInfo = None

router = APIRouter(prefix="/reception", tags=["reception"])

AIRTABLE_API_URL = "https://api.airtable.com/v0"
AIRTABLE_BASE_ID_ENV_KEYS = ("AIRTABLE_BASE_ID", "AIRTABLE_SANTIS_BASE_ID")
AIRTABLE_TOKEN_ENV_KEYS = ("AIRTABLE_RECEPTION_WRITE_TOKEN",)
BOOKINGS_TABLE_ID = os.getenv("AIRTABLE_BOOKINGS_TABLE_ID", "tblocCFVgSNfaLAH6")
COMMISSION_RULES_TABLE_ID = os.getenv("AIRTABLE_COMMISSION_RULES_TABLE_ID", "tblukYjjH5K6Ah9i2")
COMMISSION_LEDGER_TABLE_ID = os.getenv("AIRTABLE_COMMISSION_LEDGER_TABLE_ID", "tbliz2cnvA3cyVaLd")
TIMEZONE = "Europe/Podgorica"
USER_LOCALE = "en-us"

BOOKING_FIELDS = [
    "Booking ID",
    "Reception Time Display",
    "Start_DateTime",
    "Calculated_Finish_DateTime",
    "Client_Link",
    "Service_Link",
    "Therapist_Link",
    "Room_Link",
    "Location_Link",
    "Status_New",
    "Payment_Status_New",
    "Payment Method",
    "Total Paid EUR",
    "Balance_Due_EUR",
    "Reception Ready Status",
    "Therapist Shift Gate",
    "Reception_Priority",
    "Environment",
]

COMMISSION_BOOKING_FIELDS = [
    "Booking ID",
    "Tenant_Link",
    "Location_Link",
    "Service_Link",
    "Therapist_Link",
    "Reception_Staff_Link",
    "Payment_Status_New",
    "Payment/Coverage Source",
    "Total_Amount_EUR_New",
    "Final Amount EUR",
    "Total Paid EUR",
    "Balance_Due_EUR",
    "Status_New",
    "Environment",
    "Commission_Calculated",
    "Commission_Ledger_Link",
]

COMMISSION_RULE_FIELDS = [
    "Rule Name",
    "Commission Target",
    "Trigger Event",
    "Calculation Type",
    "Rate Percent",
    "Fixed Amount EUR",
    "Active",
    "Service_Link",
    "Location_Link",
    "Tenant_Link",
]

COMMISSION_LEDGER_FIELDS = [
    "Commission Entry",
    "Commission Type",
    "Source Event",
    "Gross Source Amount EUR",
    "Commission Amount EUR",
    "Payout Status",
    "Entry Date",
    "Environment",
    "Booking_Link",
    "Therapist_Link",
    "Service_Link",
    "Location_Link",
    "Payment_Link",
    "Reception_Staff_Link",
    "Commission_Rule_Link",
    "Tenant_Link",
]

LOCATION_ALIASES = {
    "budva": "01 BUDVA — Santis Club Budva",
    "01 budva": "01 BUDVA — Santis Club Budva",
    "rec1qc31hfqbulhzu": "01 BUDVA — Santis Club Budva",
}

EXCLUDED_STATUSES = {"cancelled", "no-show"}
PAID_COMMISSION_STATUSES = {"paid", "covered by package"}
LIVE_ENABLE_ENV = "SANTIS_COMMISSION_LIVE_ENABLED"


class CompleteCommissionRequest(BaseModel):
    dryRun: bool = False
    forceLive: bool = False
    allowUnpaid: bool = False


def _first_env(keys: tuple[str, ...]) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return None


def _airtable_token() -> str:
    token = _first_env(AIRTABLE_TOKEN_ENV_KEYS)
    if not token:
        raise HTTPException(
            status_code=503,
            detail="Airtable token is not configured. Set AIRTABLE_RECEPTION_WRITE_TOKEN on the backend.",
        )
    return token


def _airtable_base_id() -> str:
    base_id = _first_env(AIRTABLE_BASE_ID_ENV_KEYS)
    if not base_id:
        raise HTTPException(
            status_code=503,
            detail="Airtable base is not configured. Set AIRTABLE_BASE_ID on the backend.",
        )
    return base_id


def _today_in_podgorica() -> str:
    if ZoneInfo is not None:
        return datetime.now(ZoneInfo(TIMEZONE)).date().isoformat()
    return datetime.now(timezone.utc).date().isoformat()


def _escape_formula_text(value: str) -> str:
    return value.replace("'", "\\'")


def _airtable_get(table_id: str, params: list[tuple[str, str]]) -> dict[str, Any]:
    base_id = _airtable_base_id()
    token = _airtable_token()
    url = f"{AIRTABLE_API_URL}/{base_id}/{table_id}?{urlencode(params)}"
    request = Request(url, headers={"Authorization": f"Bearer {token}"})

    try:
        with urlopen(request, timeout=15) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload)
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(status_code=502, detail=f"Airtable read failed: {body[:500]}") from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"Airtable network error: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="Airtable returned invalid JSON") from exc


def _airtable_json_request(
    method: str,
    table_id: str,
    payload: dict[str, Any] | None = None,
    record_id: str | None = None,
    params: list[tuple[str, str]] | None = None,
) -> dict[str, Any]:
    base_id = _airtable_base_id()
    token = _airtable_token()
    suffix = f"/{record_id}" if record_id else ""
    query = f"?{urlencode(params or [])}" if params else ""
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
            payload_text = response.read().decode("utf-8")
            return json.loads(payload_text) if payload_text else {}
    except HTTPError as exc:
        body_text = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(status_code=502, detail=f"Airtable {method} failed: {body_text[:800]}") from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"Airtable network error: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="Airtable returned invalid JSON") from exc


def _airtable_get_record(table_id: str, record_id: str, fields: list[str]) -> dict[str, Any]:
    params: list[tuple[str, str]] = []
    for field_name in fields:
        params.append(("fields[]", field_name))
    return _airtable_json_request("GET", table_id, record_id=record_id, params=params)


def _airtable_list_records(table_id: str, fields: list[str], page_size: int = 100) -> list[dict[str, Any]]:
    params: list[tuple[str, str]] = [("pageSize", str(page_size))]
    for field_name in fields:
        params.append(("fields[]", field_name))

    records: list[dict[str, Any]] = []
    offset: str | None = None
    while True:
        page_params = list(params)
        if offset:
            page_params.append(("offset", offset))
        payload = _airtable_get(table_id, page_params)
        records.extend(payload.get("records", []))
        offset = payload.get("offset")
        if not offset:
            return records


def _airtable_create_record(table_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    payload = {"records": [{"fields": fields}], "typecast": True}
    response = _airtable_json_request("POST", table_id, payload=payload)
    records = response.get("records") or []
    if not records:
        raise HTTPException(status_code=502, detail="Airtable did not return the created record")
    return records[0]


def _airtable_update_record(table_id: str, record_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    return _airtable_json_request("PATCH", table_id, record_id=record_id, payload={"fields": fields, "typecast": True})


def _airtable_list_bookings(selected_date: str, environment: str) -> list[dict[str, Any]]:
    safe_environment = _escape_formula_text(environment)
    safe_date = _escape_formula_text(selected_date)
    formula = (
        "AND("
        f"{{Environment}} = '{safe_environment}',"
        f"DATETIME_FORMAT(SET_TIMEZONE({{Start_DateTime}}, '{TIMEZONE}'), 'YYYY-MM-DD') = '{safe_date}',"
        "NOT(OR({Status_New} = 'Cancelled', {Status_New} = 'No-show'))"
        ")"
    )

    params: list[tuple[str, str]] = [
        ("cellFormat", "string"),
        ("timeZone", TIMEZONE),
        ("userLocale", USER_LOCALE),
        ("pageSize", "100"),
        ("filterByFormula", formula),
        ("sort[0][field]", "Start_DateTime"),
        ("sort[0][direction]", "asc"),
    ]
    for field_name in BOOKING_FIELDS:
        params.append(("fields[]", field_name))

    records: list[dict[str, Any]] = []
    offset: str | None = None
    while True:
        page_params = list(params)
        if offset:
            page_params.append(("offset", offset))
        payload = _airtable_get(BOOKINGS_TABLE_ID, page_params)
        records.extend(payload.get("records", []))
        offset = payload.get("offset")
        if not offset:
            return records


def _normalize(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return ", ".join(_normalize(item) for item in value if item is not None)
    if isinstance(value, dict):
        if "name" in value or "id" in value:
            extracted = value.get("name") or value.get("id")
            return _normalize(extracted) if extracted is not None else ""
        return str(value).strip()
    return str(value).strip()


def _number(value: Any) -> float:
    if value is None or value == "":
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = re.sub(r"[^0-9,.-]", "", str(value)).replace(",", ".")
    if cleaned.count(".") > 1:
        first, *rest = cleaned.split(".")
        cleaned = first + "." + "".join(rest)
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _link_ids(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value] if value.startswith("rec") else []
    if isinstance(value, dict):
        record_id = value.get("id")
        return [record_id] if isinstance(record_id, str) and record_id.startswith("rec") else []
    if isinstance(value, list):
        ids: list[str] = []
        for item in value:
            ids.extend(_link_ids(item))
        return ids
    return []


def _overlaps(left: list[str], right: list[str]) -> bool:
    return bool(set(left).intersection(right))


def _booking_id(value: Any) -> int | str | None:
    normalized = _normalize(value)
    if not normalized:
        return None
    try:
        return int(float(normalized))
    except ValueError:
        return normalized


def _location_filter(location_id: str | None, location_name: str | None, location: str | None) -> tuple[str, str]:
    raw = _normalize(location_id or location_name or location or "budva")
    key = raw.lower()
    canonical = LOCATION_ALIASES.get(key, raw)
    return key, canonical


def _matches_location(fields: dict[str, Any], canonical_location: str, location_key: str) -> bool:
    location_value = _normalize(fields.get("Location_Link"))
    if not location_value:
        return False
    location_lower = location_value.lower()
    canonical_lower = canonical_location.lower()
    return canonical_lower in location_lower or location_key in location_lower


def _normalize_booking(record: dict[str, Any]) -> dict[str, Any]:
    fields = record.get("fields", {})
    payment_status = _normalize(fields.get("Payment_Status_New"))
    balance_due = _number(fields.get("Balance_Due_EUR"))
    total_paid = _number(fields.get("Total Paid EUR"))
    priority = _normalize(fields.get("Reception_Priority"))
    payment_attention = payment_status.lower() == "unpaid" or balance_due > 0

    if payment_attention:
        priority = "Payment Attention"

    return {
        "id": record.get("id"),
        "bookingId": _booking_id(fields.get("Booking ID")),
        "timeDisplay": _normalize(fields.get("Reception Time Display")),
        "startDateTime": _normalize(fields.get("Start_DateTime")),
        "finishDateTime": _normalize(fields.get("Calculated_Finish_DateTime")),
        "clientName": _normalize(fields.get("Client_Link")),
        "serviceName": _normalize(fields.get("Service_Link")),
        "therapistName": _normalize(fields.get("Therapist_Link")),
        "roomName": _normalize(fields.get("Room_Link")),
        "locationName": _normalize(fields.get("Location_Link")),
        "status": _normalize(fields.get("Status_New")),
        "paymentStatus": payment_status,
        "paymentMethod": _normalize(fields.get("Payment Method")),
        "totalPaidEur": total_paid,
        "balanceDueEur": balance_due,
        "receptionReadyStatus": _normalize(fields.get("Reception Ready Status")),
        "therapistShiftGate": _normalize(fields.get("Therapist Shift Gate")),
        "receptionPriority": priority,
        "paymentAttention": payment_attention,
        "environment": _normalize(fields.get("Environment")),
    }


def _active_commission_rules() -> list[dict[str, Any]]:
    rules = _airtable_list_records(COMMISSION_RULES_TABLE_ID, COMMISSION_RULE_FIELDS, page_size=100)
    active_rules: list[dict[str, Any]] = []
    for rule in rules:
        fields = rule.get("fields", {})
        if not fields.get("Active"):
            continue
        if _normalize(fields.get("Trigger Event")).lower() != "booking completed":
            continue
        active_rules.append(rule)
    return active_rules


def _select_commission_rule(booking_fields: dict[str, Any]) -> dict[str, Any] | None:
    booking_tenants = _link_ids(booking_fields.get("Tenant_Link"))
    booking_locations = _link_ids(booking_fields.get("Location_Link"))
    booking_services = _link_ids(booking_fields.get("Service_Link"))

    if not booking_tenants or not booking_locations or not booking_services:
        return None

    for rule in _active_commission_rules():
        rule_fields = rule.get("fields", {})
        rule_tenants = _link_ids(rule_fields.get("Tenant_Link"))
        rule_locations = _link_ids(rule_fields.get("Location_Link"))
        rule_services = _link_ids(rule_fields.get("Service_Link"))

        if not rule_tenants or not _overlaps(rule_tenants, booking_tenants):
            continue
        if not rule_locations or not _overlaps(rule_locations, booking_locations):
            continue
        if not rule_services or not _overlaps(rule_services, booking_services):
            continue
        return rule
    return None


def _find_existing_commission_ledgers(booking_record_id: str) -> list[dict[str, Any]]:
    ledgers = _airtable_list_records(COMMISSION_LEDGER_TABLE_ID, ["Commission Entry", "Booking_Link", "Environment"], page_size=100)
    return [ledger for ledger in ledgers if booking_record_id in _link_ids(ledger.get("fields", {}).get("Booking_Link"))]


def _commission_amount(rule_fields: dict[str, Any], gross_source_amount: float) -> float:
    calculation_type = _normalize(rule_fields.get("Calculation Type")).lower()
    rate = _number(rule_fields.get("Rate Percent"))
    if rate > 1:
        rate = rate / 100
    fixed_amount = _number(rule_fields.get("Fixed Amount EUR"))

    if "fixed" in calculation_type and fixed_amount > 0:
        return round(fixed_amount, 2)
    if "percent" in calculation_type and rate > 0:
        return round(gross_source_amount * rate, 2)
    if fixed_amount > 0:
        return round(fixed_amount, 2)
    return round(gross_source_amount * rate, 2)


def _live_commission_enabled() -> bool:
    return os.getenv(LIVE_ENABLE_ENV, "").strip().lower() in {"1", "true", "yes", "on"}


@router.get("/bookings/today")
def get_reception_bookings_today(
    location_id: str | None = Query(default=None, alias="locationId"),
    location_name: str | None = Query(default=None, alias="locationName"),
    location: str | None = Query(default=None),
    date: str | None = Query(default=None),
    environment: str = Query(default="Live"),
) -> dict[str, Any]:
    selected_date = date or _today_in_podgorica()
    location_key, canonical_location = _location_filter(location_id, location_name, location)

    records = _airtable_list_bookings(selected_date, environment)
    filtered_records = [
        record for record in records if _matches_location(record.get("fields", {}), canonical_location, location_key)
    ]
    bookings = [_normalize_booking(record) for record in filtered_records]
    bookings = [booking for booking in bookings if booking["status"].lower() not in EXCLUDED_STATUSES]

    display_location = bookings[0]["locationName"] if bookings else canonical_location

    return {
        "date": selected_date,
        "timezone": TIMEZONE,
        "location": display_location,
        "environment": environment,
        "count": len(bookings),
        "bookings": bookings,
    }


@router.post("/bookings/{booking_record_id}/complete-with-commission")
def complete_booking_with_commission(
    booking_record_id: str,
    payload: CompleteCommissionRequest | None = None,
) -> dict[str, Any]:
    request_payload = payload or CompleteCommissionRequest()
    booking = _airtable_get_record(BOOKINGS_TABLE_ID, booking_record_id, COMMISSION_BOOKING_FIELDS)
    fields = booking.get("fields", {})

    environment = _normalize(fields.get("Environment")) or "Live"
    status = _normalize(fields.get("Status_New"))
    payment_status = _normalize(fields.get("Payment_Status_New"))
    booking_id = _booking_id(fields.get("Booking ID")) or booking_record_id
    balance_due = _number(fields.get("Balance_Due_EUR"))
    gross_source_amount = (
        _number(fields.get("Total_Amount_EUR_New"))
        or _number(fields.get("Final Amount EUR"))
        or _number(fields.get("Total Paid EUR"))
    )

    if environment.lower() == "archive":
        raise HTTPException(status_code=409, detail="Archived bookings cannot generate commission ledger entries.")
    if environment.lower() == "live" and not request_payload.dryRun:
        if not request_payload.forceLive or not _live_commission_enabled():
            raise HTTPException(
                status_code=409,
                detail=(
                    "Live commission automation is disabled. Use a Test booking for backend validation, "
                    f"or set {LIVE_ENABLE_ENV}=true and forceLive=true only after LOCK-11 approval."
                ),
            )
    if payment_status.lower() not in PAID_COMMISSION_STATUSES and not request_payload.allowUnpaid:
        raise HTTPException(
            status_code=409,
            detail="Booking is not paid or package-covered. Commission ledger creation is blocked.",
        )
    if payment_status.lower() == "paid" and balance_due > 0 and not request_payload.allowUnpaid:
        raise HTTPException(status_code=409, detail="Paid booking still has a balance due. Commission is blocked.")
    if gross_source_amount <= 0:
        raise HTTPException(status_code=409, detail="Booking has no commissionable source amount.")

    linked_ledgers = _link_ids(fields.get("Commission_Ledger_Link"))
    existing_ledgers = _find_existing_commission_ledgers(booking_record_id)
    if fields.get("Commission_Calculated") or linked_ledgers or existing_ledgers:
        existing_ids = linked_ledgers or [ledger.get("id") for ledger in existing_ledgers if ledger.get("id")]
        return {
            "ok": True,
            "idempotent": True,
            "commissionCreated": False,
            "bookingRecordId": booking_record_id,
            "bookingId": booking_id,
            "existingCommissionLedgerIds": existing_ids,
            "message": "Commission already calculated or linked. No duplicate ledger was created.",
        }

    rule = _select_commission_rule(fields)
    if not rule:
        raise HTTPException(
            status_code=409,
            detail="No active tenant/location/service Commission Rule matched this booking.",
        )

    rule_fields = rule.get("fields", {})
    rule_name = _normalize(rule_fields.get("Rule Name")) or rule.get("id")
    commission_target = _normalize(rule_fields.get("Commission Target")) or "Therapist"
    commission_value = _commission_amount(rule_fields, gross_source_amount)
    if commission_value <= 0:
        raise HTTPException(status_code=409, detail="Matched Commission Rule calculated zero commission.")

    ledger_fields: dict[str, Any] = {
        "Commission Entry": f"COMM-{booking_id}-{rule_name}",
        "Commission Type": commission_target,
        "Source Event": "Booking Completed",
        "Gross Source Amount EUR": round(gross_source_amount, 2),
        "Commission Amount EUR": commission_value,
        "Payout Status": "Pending",
        "Entry Date": _today_in_podgorica(),
        "Environment": environment,
        "Booking_Link": [booking_record_id],
        "Service_Link": _link_ids(fields.get("Service_Link")),
        "Location_Link": _link_ids(fields.get("Location_Link")),
        "Commission_Rule_Link": [rule["id"]],
        "Tenant_Link": _link_ids(fields.get("Tenant_Link")),
    }
    therapist_ids = _link_ids(fields.get("Therapist_Link"))
    reception_staff_ids = _link_ids(fields.get("Reception_Staff_Link"))
    if commission_target.lower() == "therapist":
        ledger_fields["Therapist_Link"] = therapist_ids
    elif commission_target.lower() == "reception":
        ledger_fields["Reception_Staff_Link"] = reception_staff_ids
    else:
        ledger_fields["Therapist_Link"] = therapist_ids
        ledger_fields["Reception_Staff_Link"] = reception_staff_ids

    if request_payload.dryRun:
        return {
            "ok": True,
            "dryRun": True,
            "commissionCreated": False,
            "bookingRecordId": booking_record_id,
            "bookingId": booking_id,
            "bookingStatus": status,
            "matchedRuleId": rule.get("id"),
            "matchedRuleName": rule_name,
            "grossSourceAmountEur": round(gross_source_amount, 2),
            "commissionAmountEur": commission_value,
            "wouldCreateLedgerFields": ledger_fields,
        }

    ledger = _airtable_create_record(COMMISSION_LEDGER_TABLE_ID, ledger_fields)
    ledger_id = ledger.get("id")
    if not ledger_id:
        raise HTTPException(status_code=502, detail="Commission Ledger was created but no record ID was returned.")

    booking_update = {
        "Status_New": "Completed",
        "Reception_Status": "Completed",
        "Check_In_Completed": True,
        "Commission_Calculated": True,
        "Commission_Ledger_Link": [ledger_id],
    }
    _airtable_update_record(BOOKINGS_TABLE_ID, booking_record_id, booking_update)

    return {
        "ok": True,
        "commissionCreated": True,
        "bookingRecordId": booking_record_id,
        "bookingId": booking_id,
        "previousStatus": status,
        "newStatus": "Completed",
        "environment": environment,
        "matchedRuleId": rule.get("id"),
        "matchedRuleName": rule_name,
        "commissionLedgerId": ledger_id,
        "payoutStatus": "Pending",
        "grossSourceAmountEur": round(gross_source_amount, 2),
        "commissionAmountEur": commission_value,
        "duplicateProtected": True,
    }
