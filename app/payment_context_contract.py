from __future__ import annotations

from dataclasses import dataclass
from typing import Any

CONTRACT_VERSION = "FI-G2-PAYMENT-CONTEXT-RECONCILIATION-v1.0.0"
PASS_RESULT = "PAYMENT_CONTEXT_PASS"
BLOCKED_RESULT = "PAYMENT_CONTEXT_BLOCKED"

ENVIRONMENT_NOT_TEST = "ENVIRONMENT_NOT_TEST"
PAYMENT_BOOKING_CARDINALITY = "PAYMENT_BOOKING_CARDINALITY"
PAYMENT_TENANT_CARDINALITY = "PAYMENT_TENANT_CARDINALITY"
PAYMENT_LOCATION_CARDINALITY = "PAYMENT_LOCATION_CARDINALITY"
UNSUPPORTED_CURRENCY = "UNSUPPORTED_CURRENCY"
CURRENT_SIGNATURE_MISSING = "CURRENT_SIGNATURE_MISSING"
LINKED_BOOKING_NOT_FOUND = "LINKED_BOOKING_NOT_FOUND"
BOOKING_TENANT_CARDINALITY = "BOOKING_TENANT_CARDINALITY"
BOOKING_LOCATION_CARDINALITY = "BOOKING_LOCATION_CARDINALITY"
TENANT_MISMATCH = "TENANT_MISMATCH"
LOCATION_MISMATCH = "LOCATION_MISMATCH"
ENVIRONMENT_MISMATCH = "ENVIRONMENT_MISMATCH"
PAYMENT_CONTEXT_NEVER_RECONCILED = "PAYMENT_CONTEXT_NEVER_RECONCILED"
PAYMENT_CONTEXT_SOURCE_CHANGED = "PAYMENT_CONTEXT_SOURCE_CHANGED"


@dataclass(frozen=True)
class PaymentContextSource:
    payment_record_id: str
    booking_ids: tuple[str, ...]
    tenant_ids: tuple[str, ...]
    location_ids: tuple[str, ...]
    environment: str
    currency: str
    amount_eur: Any
    payment_status: str
    current_signature: str
    reconciled_signature: str


@dataclass(frozen=True)
class BookingContextSource:
    booking_record_id: str
    tenant_ids: tuple[str, ...]
    location_ids: tuple[str, ...]
    environment: str


@dataclass(frozen=True)
class PaymentContextDecision:
    contract_version: str
    allowed: bool
    result_code: str
    blockers: tuple[str, ...]
    payment_record_id: str
    booking_record_id: str | None
    freshness_status: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "contractVersion": self.contract_version,
            "allowed": self.allowed,
            "resultCode": self.result_code,
            "blockers": list(self.blockers),
            "paymentRecordId": self.payment_record_id,
            "bookingRecordId": self.booking_record_id,
            "freshnessStatus": self.freshness_status,
        }


def _blocked(
    payment: PaymentContextSource,
    blockers: list[str],
    booking_record_id: str | None,
    freshness_status: str = "BLOCKED",
) -> PaymentContextDecision:
    return PaymentContextDecision(
        contract_version=CONTRACT_VERSION,
        allowed=False,
        result_code=BLOCKED_RESULT,
        blockers=tuple(blockers),
        payment_record_id=payment.payment_record_id,
        booking_record_id=booking_record_id,
        freshness_status=freshness_status,
    )


def evaluate_payment_context(
    payment: PaymentContextSource,
    booking: BookingContextSource | None,
) -> PaymentContextDecision:
    """Mirror the accepted Airtable FI-G2 guard without mutating any source.

    Structural/context blockers are evaluated first in the same stable order as
    the Airtable reconciliation worker. Freshness is evaluated only when that
    blocker list is empty, preserving single-cause failures such as QA241's
    UNSUPPORTED_CURRENCY result.
    """

    blockers: list[str] = []

    if payment.environment != "Test":
        blockers.append(ENVIRONMENT_NOT_TEST)
    if len(payment.booking_ids) != 1:
        blockers.append(PAYMENT_BOOKING_CARDINALITY)
    if len(payment.tenant_ids) != 1:
        blockers.append(PAYMENT_TENANT_CARDINALITY)
    if len(payment.location_ids) != 1:
        blockers.append(PAYMENT_LOCATION_CARDINALITY)

    normalized_currency = payment.currency.strip().upper()
    if normalized_currency not in {"", "EUR"}:
        blockers.append(UNSUPPORTED_CURRENCY)
    if not payment.current_signature.strip():
        blockers.append(CURRENT_SIGNATURE_MISSING)

    booking_record_id = payment.booking_ids[0] if len(payment.booking_ids) == 1 else None

    if booking_record_id is not None:
        if booking is None:
            blockers.append(LINKED_BOOKING_NOT_FOUND)
        else:
            if len(booking.tenant_ids) != 1:
                blockers.append(BOOKING_TENANT_CARDINALITY)
            if len(booking.location_ids) != 1:
                blockers.append(BOOKING_LOCATION_CARDINALITY)

            if len(payment.tenant_ids) == 1 and len(booking.tenant_ids) == 1:
                if payment.tenant_ids[0] != booking.tenant_ids[0]:
                    blockers.append(TENANT_MISMATCH)
            if len(payment.location_ids) == 1 and len(booking.location_ids) == 1:
                if payment.location_ids[0] != booking.location_ids[0]:
                    blockers.append(LOCATION_MISMATCH)
            if payment.environment != booking.environment:
                blockers.append(ENVIRONMENT_MISMATCH)

    if blockers:
        return _blocked(payment, blockers, booking_record_id)

    reconciled_signature = payment.reconciled_signature.strip()
    current_signature = payment.current_signature.strip()

    if not reconciled_signature:
        return _blocked(
            payment,
            [PAYMENT_CONTEXT_NEVER_RECONCILED],
            booking_record_id,
            freshness_status="NEVER_RECONCILED",
        )
    if current_signature != reconciled_signature:
        return _blocked(
            payment,
            [PAYMENT_CONTEXT_SOURCE_CHANGED],
            booking_record_id,
            freshness_status="SOURCE_CHANGED",
        )

    return PaymentContextDecision(
        contract_version=CONTRACT_VERSION,
        allowed=True,
        result_code=PASS_RESULT,
        blockers=(),
        payment_record_id=payment.payment_record_id,
        booking_record_id=booking_record_id,
        freshness_status="FRESH",
    )
