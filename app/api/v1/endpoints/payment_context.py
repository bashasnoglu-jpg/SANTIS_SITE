from __future__ import annotations

import json
import logging
import os
import re
from contextvars import ContextVar
from typing import Any, Callable, TypeVar
from uuid import uuid4
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.payment_context_contract import (
    BookingContextSource,
    PaymentContextSource,
    evaluate_payment_context,
)

router = APIRouter(prefix="/payment-context", tags=["payment-context"])
logger = logging.getLogger("santis.payment_context.diagnostics")

AIRTABLE_API_URL = "https://api.airtable.com/v0"
AIRTABLE_BASE_ID_ENV_KEYS = ("AIRTABLE_BASE_ID", "AIRTABLE_SANTIS_BASE_ID")
AIRTABLE_TOKEN_ENV_KEYS = ("AIRTABLE_PAYMENT_CONTEXT_READ_TOKEN",)
PAYMENTS_TABLE_ID = os.getenv("AIRTABLE_PAYMENTS_TABLE_ID", "tblcUltjoMusYcQob")
BOOKINGS_TABLE_ID = os.getenv("AIRTABLE_BOOKINGS_TABLE_ID", "tblocCFVgSNfaLAH6")
AIRTABLE_RECORD_ID_PATTERN = re.compile(r"^rec[A-Za-z0-9]{14}$")
NO_STORE_HEADERS = {"Cache-Control": "no-store"}
INTERNAL_ERROR_DETAIL = {"code": "PAYMENT_CONTEXT_INTERNAL_ERROR"}
INVALID_RESPONSE_DETAIL = {"code": "AIRTABLE_INVALID_RESPONSE"}
T = TypeVar("T")
DIAGNOSTIC_CONTEXT: ContextVar[tuple[str, str] | None] = ContextVar(
    "payment_context_diagnostic_context",
    default=None,
)


def _diagnostic_event(
    *,
    correlation_id: str,
    stage: str,
    exception_class: str,
    status_code: int,
    response: Any | None = None,
) -> None:
    payload: dict[str, Any] = {
        "correlation_id": correlation_id,
        "event": "payment_context_stage_failure",
        "exception_class": exception_class,
        "stage": stage,
        "status_code": status_code,
    }
    if response is not None:
        payload.update(
            {
                "fields_type": type(response.get("fields")).__name__
                if isinstance(response, dict) and "fields" in response
                else "absent",
                "has_fields": isinstance(response, dict) and "fields" in response,
                "has_id": isinstance(response, dict) and "id" in response,
                "response_type": type(response).__name__,
            }
        )
    logger.warning(json.dumps(payload, sort_keys=True, separators=(",", ":")))


def _run_stage(
    *,
    correlation_id: str,
    stage: str,
    operation: Callable[[], T],
) -> T:
    context_token = DIAGNOSTIC_CONTEXT.set((correlation_id, stage))
    try:
        return operation()
    except HTTPException:
        raise
    except Exception as exc:
        _diagnostic_event(
            correlation_id=correlation_id,
            stage=stage,
            exception_class=type(exc).__name__,
            status_code=500,
        )
        _raise_no_store(500, INTERNAL_ERROR_DETAIL)
    finally:
        DIAGNOSTIC_CONTEXT.reset(context_token)


def _diagnostic_exception(exc: Exception, status_code: int) -> None:
    context = DIAGNOSTIC_CONTEXT.get()
    if context is None:
        return
    correlation_id, stage = context
    _diagnostic_event(
        correlation_id=correlation_id,
        stage=stage,
        exception_class=type(exc).__name__,
        status_code=status_code,
    )


def _validated_record_envelope(
    response: Any,
    *,
    correlation_id: str | None = None,
    stage: str | None = None,
) -> dict[str, Any]:
    valid = (
        isinstance(response, dict)
        and isinstance(response.get("id"), str)
        and AIRTABLE_RECORD_ID_PATTERN.fullmatch(response["id"]) is not None
        and isinstance(response.get("fields"), dict)
    )
    if not valid:
        if correlation_id is None or stage is None:
            context = DIAGNOSTIC_CONTEXT.get()
            if context is not None:
                correlation_id, stage = context
        if correlation_id is not None and stage is not None:
            _diagnostic_event(
                correlation_id=correlation_id,
                stage=stage,
                exception_class="InvalidRecordEnvelope",
                status_code=502,
                response=response,
            )
        _raise_no_store(502, INVALID_RESPONSE_DETAIL)
    return response


def _raise_no_store(status_code: int, detail: str | dict[str, Any]) -> None:
    raise HTTPException(
        status_code=status_code,
        detail=detail,
        headers=NO_STORE_HEADERS,
    )


def _first_env(keys: tuple[str, ...]) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return None


def _airtable_token() -> str:
    token = _first_env(AIRTABLE_TOKEN_ENV_KEYS)
    if not token:
        _raise_no_store(503, {"code": "AIRTABLE_TOKEN_NOT_CONFIGURED"})
    return token


def _airtable_base_id() -> str:
    base_id = _first_env(AIRTABLE_BASE_ID_ENV_KEYS)
    if not base_id:
        _raise_no_store(503, {"code": "AIRTABLE_BASE_NOT_CONFIGURED"})
    return base_id


def _airtable_get_record_or_none(
    table_id: str,
    record_id: str,
) -> dict[str, Any] | None:
    # Airtable's retrieve-record endpoint does not accept the fields[] list
    # parameter supported by list-records. Fetch the single record as-is and
    # read only the canonical fields used by this validator below.
    url = f"{AIRTABLE_API_URL}/{_airtable_base_id()}/{table_id}/{record_id}"
    request = Request(url, headers={"Authorization": f"Bearer {_airtable_token()}"})

    try:
        with urlopen(request, timeout=15) as response:
            decoded_response = json.loads(response.read().decode("utf-8"))
            return _validated_record_envelope(decoded_response)
    except HTTPError as exc:
        if exc.code == 404:
            return None
        _diagnostic_exception(exc, 502)
        _raise_no_store(502, {"code": "AIRTABLE_READ_FAILED"})
    except URLError as exc:
        _diagnostic_exception(exc, 502)
        _raise_no_store(502, {"code": "AIRTABLE_NETWORK_ERROR"})
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        _diagnostic_exception(exc, 502)
        _raise_no_store(502, INVALID_RESPONSE_DETAIL)


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
def validate_payment_context(payment_record_id: str) -> JSONResponse:
    """Read Airtable sources and mirror the accepted FI-G2 fail-closed guard.

    This endpoint performs no Airtable writes and creates no financial records.
    A blocked decision is returned as HTTP 409 with the canonical blocker list.
    """

    correlation_id = uuid4().hex

    def validate_record_id() -> None:
        if not AIRTABLE_RECORD_ID_PATTERN.fullmatch(payment_record_id):
            _raise_no_store(
                422,
                {
                    "code": "INVALID_PAYMENT_RECORD_ID",
                    "paymentRecordId": payment_record_id,
                },
            )

    _run_stage(
        correlation_id=correlation_id,
        stage="request_validation",
        operation=validate_record_id,
    )

    payment_record = _run_stage(
        correlation_id=correlation_id,
        stage="payment_read",
        operation=lambda: _airtable_get_record_or_none(
            PAYMENTS_TABLE_ID,
            payment_record_id,
        ),
    )
    if payment_record is None:
        _raise_no_store(
            404,
            {
                "code": "PAYMENT_NOT_FOUND",
                "paymentRecordId": payment_record_id,
            },
        )

    payment = _run_stage(
        correlation_id=correlation_id,
        stage="payment_mapping",
        operation=lambda: _payment_source(
            _validated_record_envelope(
                payment_record,
                correlation_id=correlation_id,
                stage="payment_mapping",
            )
        ),
    )
    booking: BookingContextSource | None = None

    if len(payment.booking_ids) == 1:
        booking_record = _run_stage(
            correlation_id=correlation_id,
            stage="booking_read",
            operation=lambda: _airtable_get_record_or_none(
                BOOKINGS_TABLE_ID,
                payment.booking_ids[0],
            ),
        )
        if booking_record is not None:
            booking = _run_stage(
                correlation_id=correlation_id,
                stage="booking_mapping",
                operation=lambda: _booking_source(
                    _validated_record_envelope(
                        booking_record,
                        correlation_id=correlation_id,
                        stage="booking_mapping",
                    )
                ),
            )

    decision = _run_stage(
        correlation_id=correlation_id,
        stage="contract_evaluation",
        operation=lambda: evaluate_payment_context(payment, booking),
    )
    payload = _run_stage(
        correlation_id=correlation_id,
        stage="response_serialization",
        operation=decision.as_dict,
    )

    if not decision.allowed:
        return _run_stage(
            correlation_id=correlation_id,
            stage="response_serialization",
            operation=lambda: JSONResponse(
                status_code=409,
                content={"detail": payload},
                headers=NO_STORE_HEADERS,
            ),
        )

    return _run_stage(
        correlation_id=correlation_id,
        stage="response_serialization",
        operation=lambda: JSONResponse(content=payload, headers=NO_STORE_HEADERS),
    )
