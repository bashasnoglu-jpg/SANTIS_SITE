from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.v1.endpoints import reception
from app.dependencies.reception_auth import ReceptionActor, require_reception_write_actor

router = APIRouter(prefix="/reception", tags=["reception"])
logger = logging.getLogger("santis.reception.security")

# Preserve the existing read-only reception endpoint without mounting the
# original router's unsecured write route.
router.add_api_route(
    "/bookings/today",
    reception.get_reception_bookings_today,
    methods=["GET"],
)


def _audit_security_event(
    *,
    actor: ReceptionActor,
    booking_record_id: str,
    request_id: str | None,
    result: str,
    requested_overrides: dict[str, bool],
    reason: str | None = None,
) -> None:
    payload: dict[str, Any] = {
        "event": "reception_write_security",
        "actor_id": actor.actor_id,
        "role": actor.role,
        "tenant_id": actor.tenant_id,
        "authorized_location_ids": list(actor.allowed_location_ids),
        "booking_record_id": booking_record_id,
        "requested_overrides": requested_overrides,
        "request_id": request_id,
        "result": result,
    }
    if reason:
        payload["reason"] = reason
    logger.info(json.dumps(payload, sort_keys=True, separators=(",", ":")))


def _not_found(
    *,
    actor: ReceptionActor,
    booking_record_id: str,
    request_id: str | None,
    requested_overrides: dict[str, bool],
    reason: str,
) -> None:
    _audit_security_event(
        actor=actor,
        booking_record_id=booking_record_id,
        request_id=request_id,
        result="denied",
        requested_overrides=requested_overrides,
        reason=reason,
    )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")


@router.post("/bookings/{booking_record_id}/complete-with-commission")
def complete_booking_with_commission_secure(
    booking_record_id: str,
    request: Request,
    payload: reception.CompleteCommissionRequest | None = None,
    actor: ReceptionActor = Depends(require_reception_write_actor),
) -> dict[str, Any]:
    request_payload = payload or reception.CompleteCommissionRequest()
    request_id = request.headers.get("X-Request-ID")
    requested_overrides = {
        "forceLive": request_payload.forceLive,
        "allowUnpaid": request_payload.allowUnpaid,
    }

    # Override authorization is checked before any Airtable read/write.
    if request_payload.forceLive and not actor.can_force_live:
        _audit_security_event(
            actor=actor,
            booking_record_id=booking_record_id,
            request_id=request_id,
            result="denied",
            requested_overrides=requested_overrides,
            reason="force_live_not_allowed",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Force-live permission required.",
        )

    if request_payload.allowUnpaid and not actor.can_override_unpaid:
        _audit_security_event(
            actor=actor,
            booking_record_id=booking_record_id,
            request_id=request_id,
            result="denied",
            requested_overrides=requested_overrides,
            reason="unpaid_override_not_allowed",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unpaid override permission required.",
        )

    try:
        booking = reception._airtable_get_record(
            reception.BOOKINGS_TABLE_ID,
            booking_record_id,
            reception.COMMISSION_BOOKING_FIELDS,
        )
    except HTTPException as exc:
        if exc.status_code == 502 and "NOT_FOUND" in str(exc.detail):
            _not_found(
                actor=actor,
                booking_record_id=booking_record_id,
                request_id=request_id,
                requested_overrides=requested_overrides,
                reason="booking_not_found",
            )
        raise
    fields = booking.get("fields", {})
    booking_tenant_ids = reception._link_ids(fields.get("Tenant_Link"))
    booking_location_ids = reception._link_ids(fields.get("Location_Link"))

    if not booking_tenant_ids or actor.tenant_id not in booking_tenant_ids:
        _not_found(
            actor=actor,
            booking_record_id=booking_record_id,
            request_id=request_id,
            requested_overrides=requested_overrides,
            reason="tenant_context_mismatch",
        )

    if not booking_location_ids or not set(booking_location_ids).intersection(actor.allowed_location_ids):
        _not_found(
            actor=actor,
            booking_record_id=booking_record_id,
            request_id=request_id,
            requested_overrides=requested_overrides,
            reason="location_context_mismatch",
        )

    _audit_security_event(
        actor=actor,
        booking_record_id=booking_record_id,
        request_id=request_id,
        result="authorized",
        requested_overrides=requested_overrides,
    )

    return reception.complete_booking_with_commission(
        booking_record_id=booking_record_id,
        payload=request_payload,
    )
