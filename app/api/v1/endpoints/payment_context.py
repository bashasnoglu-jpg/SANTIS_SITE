from __future__ import annotations

import json
import os
import re
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException

from app.payment_context_contract import (
    BookingContextSource,
    PaymentContextSource,
    evaluate_payment_context,
)

router = APIRouter(prefix="/payment-context", tags=["payment-context"])

AIRTABLE_API_URL = "https://api.airtable.com/v0"
AIRTABLE_BASE_ID_ENV_KEYS = ("AIRTABLE_BASE_ID", "AIRTABLE_SANTIS_BASE_ID")
AIRTABLE_TOKEN_ENV_KEYS = ("AIRTABLE_PAT", "AIRTABLE_API_KEY")
PAYMENTS_TABLE_ID = os.getenv("AIRTABLE_PAYMENTS_TABLE_ID", "tblcUltjoMusYcQob")
BOOKINGS_TABLE_ID = os.getenv("AIRTABLE_BOOKINGS_TABLE_ID", "tblocCFVgSNfaLAH6")
AIRTABLE_RECORD_ID_PATTERN = re.compile(r"^rec[A-Za-z0-9]{14}$")

PAYMENT_FIELDS = [
    "Booking_Link",
    "Tenant_Link",
    "Location_Link",
    "Environment",
    "Payment Currency",
    "Amount_EUR",
    "Payment_Status_New",
    "Payment Context Current Source Signature",
    "Payment Context Reconciled Source Signature",
]

BOOKING_FIELDS = [
    "Tenant_Link",
    "Location_Link",
    "Environment",
]


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


def _airtable_get_record_or_none(
    table_id: str,
    record_id: str,
    fields: list[str],
) -> dict[str, Any] | None:
    params = [("fields[]", field_name) for field_name in fields]
    url = (
        f"{AIRTABLE_API_URL}/{_airtable_base_id()}/{table_id}/{record_id}"
        f"?{urlencode(params)}"
    )
    request = Request(url, headers={"Authorization": f"Bearer {_airtable_token()}"})

    try:
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code == 404:
            return None
        body = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(status_code=502, detail=f"Airtable read failed: {body[:500]}") from exc
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"Airtable network error: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="Airtable returned invalid JSON") from exc


def _text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, dict):
        return str(value.get("name") or value.get("id") or "").strip()
    return str(value).strip()


def _link_ids(value: Any) -> tuple[str, ...]:
    if value is None:
        return ()
    if isinstance(value, str):
        return (value,) if AIRTABLE_RECORD_ID_PATTERN.fullmatch(value) else ()
    if isinstance(value, dict):
        record_id = value.get("id")
        if isinstance(record_id, str) and AIRTABLE_RECORD_ID_PATTERN.fullmatch(record_id):
            return (record_id,)
        return ()
    if isinstance(value, list):
        ids: list[str] = []
        for item in value:
            ids.extend(_link_ids(item))
        return tuple(ids)
    return ()


def _payment_source(record: dict[str, Any]) -> PaymentContextSource:
    fields = record.get("fields", {})
    return PaymentContextSource(
        payment_record_id=record["id"],
        booking_ids=_link_ids(fields.get("Booking_Link")),
        tenant_ids=_link_ids(fields.get("Tenant_Link")),
        location_ids=_link_ids(fields.get("Location_Link")),
        environment=_text(fields.get("Environment")),
        currency=_text(fields.get("Payment Currency")),
        amount_eur=fields.get("Amount_EUR"),
        payment_status=_text(fields.get("Payment_Status_New")),
        current_signature=_text(fields.get("Payment Context Current Source Signature")),
        reconciled_signature=_text(fields.get("Payment Context Reconciled Source Signature")),
    )


def _booking_source(record: dict[str, Any]) -> BookingContextSource:
    fields = record.get("fields", {})
    return BookingContextSource(
        booking_record_id=record["id"],
        tenant_ids=_link_ids(fields.get("Tenant_Link")),
        location_ids=_link_ids(fields.get("Location_Link")),
        environment=_text(fields.get("Environment")),
    )


@router.get("/{payment_record_id}/validate")
def validate_payment_context(payment_record_id: str) -> dict[str, Any]:
    """Read Airtable sources and mirror the accepted FI-G2 fail-closed guard.

    This endpoint performs no Airtable writes and creates no financial records.
    A blocked decision is returned as HTTP 409 with the canonical blocker list.
    """

    if not AIRTABLE_RECORD_ID_PATTERN.fullmatch(payment_record_id):
        raise HTTPException(
            status_code=422,
            detail={
                "code": "INVALID_PAYMENT_RECORD_ID",
                "paymentRecordId": payment_record_id,
            },
        )

    payment_record = _airtable_get_record_or_none(
        PAYMENTS_TABLE_ID,
        payment_record_id,
        PAYMENT_FIELDS,
    )
    if payment_record is None:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "PAYMENT_NOT_FOUND",
                "paymentRecordId": payment_record_id,
            },
        )

    payment = _payment_source(payment_record)
    booking: BookingContextSource | None = None

    if len(payment.booking_ids) == 1:
        booking_record = _airtable_get_record_or_none(
            BOOKINGS_TABLE_ID,
            payment.booking_ids[0],
            BOOKING_FIELDS,
        )
        if booking_record is not None:
            booking = _booking_source(booking_record)

    decision = evaluate_payment_context(payment, booking)
    payload = decision.as_dict()

    if not decision.allowed:
        raise HTTPException(status_code=409, detail=payload)

    return payload
