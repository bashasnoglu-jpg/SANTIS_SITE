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

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover - Python < 3.9 fallback
    ZoneInfo = None

router = APIRouter(prefix="/reception", tags=["reception"])

AIRTABLE_API_URL = "https://api.airtable.com/v0"
AIRTABLE_BASE_ID_ENV_KEYS = ("AIRTABLE_BASE_ID", "AIRTABLE_SANTIS_BASE_ID")
AIRTABLE_TOKEN_ENV_KEYS = ("AIRTABLE_PAT", "AIRTABLE_API_KEY")
BOOKINGS_TABLE_ID = os.getenv("AIRTABLE_BOOKINGS_TABLE_ID", "tblocCFVgSNfaLAH6")
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

LOCATION_ALIASES = {
    "budva": "01 BUDVA — Santis Club Budva",
    "01 budva": "01 BUDVA — Santis Club Budva",
    "rec1qc31hfqbulhzu": "01 BUDVA — Santis Club Budva",
}

EXCLUDED_STATUSES = {"cancelled", "no-show"}


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
            detail="Airtable token is not configured. Set AIRTABLE_PAT or AIRTABLE_API_KEY on the backend.",
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
        extracted = value.get("name") or value.get("id")
        if extracted is not None:
            return _normalize(extracted)
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
