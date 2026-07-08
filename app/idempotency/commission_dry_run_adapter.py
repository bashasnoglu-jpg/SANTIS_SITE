from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any, Mapping, Protocol
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from .commission_builder import (
    CommissionBuildResult,
    CommissionIdentityInput,
    build_commission_dry_run,
)

AIRTABLE_API_URL = "https://api.airtable.com/v0"
AIRTABLE_BASE_ID_ENV_KEYS = ("AIRTABLE_BASE_ID", "AIRTABLE_SANTIS_BASE_ID")
AIRTABLE_TOKEN_ENV_KEYS = ("AIRTABLE_PAT", "AIRTABLE_API_KEY")

BOOKINGS_TABLE_ID = "tblocCFVgSNfaLAH6"
COMMISSION_RULES_TABLE_ID = "tblukYjjH5K6Ah9i2"
BOOKING_SEGMENTS_TABLE_ID = "tblmMwo3LQCdbDB3T"

BOOKING_FIELDS = (
    "Tenant_Link",
    "Location_Link",
    "Environment",
    "Therapist_Link",
    "Reception_Staff_Link",
    "Service_Link",
    "Status_New",
    "Payment_Status_New",
    "Payment Method",
    "Total_Amount_EUR_New",
    "Final Amount EUR",
    "Start_DateTime",
)

RULE_FIELDS = (
    "Commission Target",
    "Trigger Event",
    "Calculation Type",
    "Rate Percent",
    "Fixed Amount EUR",
    "Active",
    "Service_Link",
    "Location_Link",
    "Tenant_Link",
)

SEGMENT_FIELDS = (
    "Tenant_Link",
    "Location_Link",
    "Environment",
    "Booking_Link",
    "Service_Link",
    "Therapist_Link",
    "Segment Price EUR",
    "Commission Eligible",
    "Segment Status",
    "Start_DateTime",
)

_COMPONENT_BY_TARGET = {
    "Therapist": "SERVICE_DELIVERY_BASE",
    "Reception": "RECEPTION_SALE",
}

_BENEFICIARY_TYPE_BY_TARGET = {
    "Therapist": "THERAPIST",
    "Reception": "RECEPTION_STAFF",
}


class CommissionDryRunAdapterError(ValueError):
    def __init__(self, code: str, field: str, detail: str) -> None:
        self.code = code
        self.field = field
        self.detail = detail
        super().__init__(f"{code}: {field}: {detail}")


class ReadOnlyAirtableReader(Protocol):
    def get_record(
        self,
        *,
        table_id: str,
        record_id: str,
        fields: tuple[str, ...],
    ) -> Mapping[str, Any]: ...


@dataclass(frozen=True, slots=True)
class CommissionDryRunRequest:
    booking_record_id: str
    commission_rule_record_id: str
    booking_segment_record_id: str | None = None


@dataclass(frozen=True, slots=True)
class CommissionDryRunAdapterResult:
    adapter_version: str
    source: str
    booking_record_id: str
    commission_rule_record_id: str
    booking_segment_record_id: str | None
    builder_result: dict[str, Any]
    mutation_type: str
    dry_run: bool
    read_tables: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class AirtableGetOnlyReader:
    """Minimal Airtable reader that can issue GET requests only.

    There is deliberately no generic request(method=...) surface and no create,
    update, delete, upsert, or batch-write method.
    """

    def __init__(
        self,
        *,
        base_id: str | None = None,
        token: str | None = None,
        timeout_seconds: int = 15,
    ) -> None:
        self._base_id = base_id or _first_env(AIRTABLE_BASE_ID_ENV_KEYS)
        self._token = token or _first_env(AIRTABLE_TOKEN_ENV_KEYS)
        self._timeout_seconds = timeout_seconds
        if not self._base_id:
            raise CommissionDryRunAdapterError(
                "AIRTABLE_BASE_NOT_CONFIGURED",
                "base_id",
                "set AIRTABLE_BASE_ID or AIRTABLE_SANTIS_BASE_ID",
            )
        if not self._token:
            raise CommissionDryRunAdapterError(
                "AIRTABLE_TOKEN_NOT_CONFIGURED",
                "token",
                "set AIRTABLE_PAT or AIRTABLE_API_KEY",
            )

    def get_record(
        self,
        *,
        table_id: str,
        record_id: str,
        fields: tuple[str, ...],
    ) -> Mapping[str, Any]:
        params = [("fields[]", field) for field in fields]
        url = (
            f"{AIRTABLE_API_URL}/{quote(self._base_id, safe='')}/"
            f"{quote(table_id, safe='')}/{quote(record_id, safe='')}"
            f"?{urlencode(params)}"
        )
        request = Request(
            url,
            method="GET",
            headers={"Authorization": f"Bearer {self._token}"},
        )
        try:
            with urlopen(request, timeout=self._timeout_seconds) as response:
                payload = response.read().decode("utf-8")
                return json.loads(payload)
        except HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise CommissionDryRunAdapterError(
                "AIRTABLE_READ_FAILED",
                record_id,
                body[:500],
            ) from exc
        except URLError as exc:
            raise CommissionDryRunAdapterError(
                "AIRTABLE_NETWORK_ERROR",
                record_id,
                str(exc.reason),
            ) from exc
        except json.JSONDecodeError as exc:
            raise CommissionDryRunAdapterError(
                "AIRTABLE_INVALID_JSON",
                record_id,
                "Airtable returned invalid JSON",
            ) from exc


def _first_env(keys: tuple[str, ...]) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return None


def _fields(record: Mapping[str, Any], *, label: str) -> Mapping[str, Any]:
    value = record.get("fields")
    if not isinstance(value, Mapping):
        raise CommissionDryRunAdapterError(
            "AIRTABLE_RECORD_FIELDS_MISSING",
            label,
            "record payload has no fields mapping",
        )
    return value


def _single_link(fields: Mapping[str, Any], name: str, *, required: bool) -> str | None:
    value = fields.get(name)
    if value in (None, "", []):
        if required:
            raise CommissionDryRunAdapterError(
                "ADAPTER_IDENTITY_INCOMPLETE",
                name,
                "required linked record is missing",
            )
        return None
    if not isinstance(value, list) or len(value) != 1 or not isinstance(value[0], str):
        raise CommissionDryRunAdapterError(
            "ADAPTER_CARDINALITY_ERROR",
            name,
            "expected exactly one linked record",
        )
    return value[0]


def _select_name(value: Any, *, field: str, required: bool = False) -> str | None:
    if value in (None, ""):
        if required:
            raise CommissionDryRunAdapterError(
                "ADAPTER_FIELD_MISSING",
                field,
                "required select value is missing",
            )
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, Mapping) and isinstance(value.get("name"), str):
        return str(value["name"])
    raise CommissionDryRunAdapterError(
        "ADAPTER_INVALID_SELECT",
        field,
        "expected select name",
    )


def _decimal_string(value: Any, *, field: str, places: int) -> str | None:
    if value in (None, ""):
        return None
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise CommissionDryRunAdapterError(
            "ADAPTER_INVALID_DECIMAL",
            field,
            "invalid decimal value",
        ) from None
    if not amount.is_finite():
        raise CommissionDryRunAdapterError(
            "ADAPTER_INVALID_DECIMAL",
            field,
            "decimal must be finite",
        )
    quantum = Decimal("1").scaleb(-places)
    return format(amount.quantize(quantum, rounding=ROUND_HALF_UP), f".{places}f")


def _gross_source_amount(
    booking_fields: Mapping[str, Any],
    segment_fields: Mapping[str, Any] | None,
) -> str:
    if segment_fields is not None and segment_fields.get("Segment Price EUR") not in (None, ""):
        value = _decimal_string(
            segment_fields.get("Segment Price EUR"),
            field="Segment Price EUR",
            places=2,
        )
        assert value is not None
        return value

    for field in ("Total_Amount_EUR_New", "Final Amount EUR"):
        if booking_fields.get(field) not in (None, ""):
            value = _decimal_string(booking_fields.get(field), field=field, places=2)
            assert value is not None
            return value

    raise CommissionDryRunAdapterError(
        "ADAPTER_GROSS_SOURCE_AMOUNT_MISSING",
        "gross_source_amount",
        "no segment price or booking amount is available",
    )


def _calculated_commission_amount(
    *,
    gross_source_amount: str,
    calculation_type: str,
    rate_percent: Any,
    fixed_amount: Any,
) -> str:
    gross = Decimal(gross_source_amount)
    if calculation_type == "Percent":
        rate = _decimal_string(rate_percent, field="Rate Percent", places=6)
        if rate is None:
            raise CommissionDryRunAdapterError(
                "ADAPTER_RATE_MISSING",
                "Rate Percent",
                "Percent rule requires Rate Percent",
            )
        result = gross * Decimal(rate)
    elif calculation_type == "Fixed Amount":
        fixed = _decimal_string(fixed_amount, field="Fixed Amount EUR", places=2)
        if fixed is None:
            raise CommissionDryRunAdapterError(
                "ADAPTER_FIXED_AMOUNT_MISSING",
                "Fixed Amount EUR",
                "Fixed Amount rule requires Fixed Amount EUR",
            )
        result = Decimal(fixed)
    else:
        raise CommissionDryRunAdapterError(
            "ADAPTER_UNSUPPORTED_CALCULATION_TYPE",
            "Calculation Type",
            f"read-only adapter supports Percent and Fixed Amount only; observed {calculation_type!r}",
        )

    return format(result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), ".2f")


def _require_equal(field: str, left: str | None, right: str | None) -> None:
    if left != right:
        raise CommissionDryRunAdapterError(
            "ADAPTER_CONTEXT_MISMATCH",
            field,
            f"context mismatch: {left!r} != {right!r}",
        )


def build_commission_dry_run_from_airtable(
    request: CommissionDryRunRequest,
    *,
    reader: ReadOnlyAirtableReader,
) -> CommissionDryRunAdapterResult:
    """Read exact Airtable records, map them to the pure builder, and return NOOP output."""
    booking_record = reader.get_record(
        table_id=BOOKINGS_TABLE_ID,
        record_id=request.booking_record_id,
        fields=BOOKING_FIELDS,
    )
    rule_record = reader.get_record(
        table_id=COMMISSION_RULES_TABLE_ID,
        record_id=request.commission_rule_record_id,
        fields=RULE_FIELDS,
    )
    segment_record: Mapping[str, Any] | None = None
    if request.booking_segment_record_id:
        segment_record = reader.get_record(
            table_id=BOOKING_SEGMENTS_TABLE_ID,
            record_id=request.booking_segment_record_id,
            fields=SEGMENT_FIELDS,
        )

    booking = _fields(booking_record, label="booking")
    rule = _fields(rule_record, label="commission_rule")
    segment = _fields(segment_record, label="booking_segment") if segment_record else None

    if rule.get("Active") is not True:
        raise CommissionDryRunAdapterError(
            "ADAPTER_RULE_NOT_ACTIVE",
            "Active",
            "commission rule must be active",
        )

    tenant_id = _single_link(booking, "Tenant_Link", required=True)
    location_id = _single_link(booking, "Location_Link", required=True)
    environment = _select_name(booking.get("Environment"), field="Environment", required=True)
    service_id = _single_link(booking, "Service_Link", required=True)

    rule_tenant = _single_link(rule, "Tenant_Link", required=True)
    rule_location = _single_link(rule, "Location_Link", required=False)
    rule_service = _single_link(rule, "Service_Link", required=False)
    _require_equal("Tenant_Link", tenant_id, rule_tenant)
    if rule_location is not None:
        _require_equal("Location_Link", location_id, rule_location)
    if rule_service is not None:
        _require_equal("Service_Link", service_id, rule_service)

    target = _select_name(rule.get("Commission Target"), field="Commission Target", required=True)
    if target not in _COMPONENT_BY_TARGET:
        raise CommissionDryRunAdapterError(
            "ADAPTER_UNSUPPORTED_COMMISSION_TARGET",
            "Commission Target",
            f"supported targets are Therapist and Reception; observed {target!r}",
        )

    source_event = _select_name(rule.get("Trigger Event"), field="Trigger Event", required=True)
    calculation_type = _select_name(rule.get("Calculation Type"), field="Calculation Type", required=True)

    source_anchor_type = "BOOKING"
    source_anchor_id = request.booking_record_id
    beneficiary_id: str | None

    if segment is not None:
        segment_booking = _single_link(segment, "Booking_Link", required=True)
        segment_tenant = _single_link(segment, "Tenant_Link", required=True)
        segment_location = _single_link(segment, "Location_Link", required=True)
        segment_environment = _select_name(segment.get("Environment"), field="Environment", required=True)
        segment_service = _single_link(segment, "Service_Link", required=True)
        _require_equal("Booking_Link", request.booking_record_id, segment_booking)
        _require_equal("Tenant_Link", tenant_id, segment_tenant)
        _require_equal("Location_Link", location_id, segment_location)
        _require_equal("Environment", environment, segment_environment)
        _require_equal("Service_Link", service_id, segment_service)
        if segment.get("Commission Eligible") is not True:
            raise CommissionDryRunAdapterError(
                "ADAPTER_SEGMENT_NOT_COMMISSION_ELIGIBLE",
                "Commission Eligible",
                "segment must be explicitly commission eligible",
            )
        source_anchor_type = "BOOKING_SEGMENT"
        source_anchor_id = request.booking_segment_record_id or ""

    if target == "Therapist":
        beneficiary_id = _single_link(
            segment if segment is not None else booking,
            "Therapist_Link",
            required=True,
        )
    else:
        beneficiary_id = _single_link(booking, "Reception_Staff_Link", required=True)

    gross_source_amount = _gross_source_amount(booking, segment)
    calculated_amount = _calculated_commission_amount(
        gross_source_amount=gross_source_amount,
        calculation_type=calculation_type or "",
        rate_percent=rule.get("Rate Percent"),
        fixed_amount=rule.get("Fixed Amount EUR"),
    )

    event_date = None
    start_datetime = (segment or booking).get("Start_DateTime")
    if isinstance(start_datetime, str) and len(start_datetime) >= 10:
        event_date = start_datetime[:10]

    identity = CommissionIdentityInput(
        tenant_id=tenant_id or "",
        environment=environment or "",
        source_anchor_type=source_anchor_type,
        source_anchor_id=source_anchor_id,
        beneficiary_type=_BENEFICIARY_TYPE_BY_TARGET[target or ""],
        beneficiary_id=beneficiary_id or "",
        commission_component=_COMPONENT_BY_TARGET[target or ""],
        source_event=source_event or "",
    )

    state = {
        "tenant_id": tenant_id,
        "environment": environment,
        "location_id": location_id,
        "source_anchor_type": source_anchor_type,
        "source_anchor_id": source_anchor_id,
        "booking_id": request.booking_record_id,
        "booking_segment_id": request.booking_segment_record_id,
        "payment_id": None,
        "beneficiary_type": _BENEFICIARY_TYPE_BY_TARGET[target or ""],
        "beneficiary_id": beneficiary_id,
        "service_id": service_id,
        "commission_rule_id": request.commission_rule_record_id,
        "source_event": source_event,
        "commission_component": _COMPONENT_BY_TARGET[target or ""],
        "gross_source_amount": gross_source_amount,
        "commission_rate": rule.get("Rate Percent") if calculation_type == "Percent" else None,
        "fixed_amount": rule.get("Fixed Amount EUR") if calculation_type == "Fixed Amount" else None,
        "commission_type": target,
        "calculated_commission_amount": calculated_amount,
        "booking_status": _select_name(booking.get("Status_New"), field="Status_New"),
        "payment_status": _select_name(booking.get("Payment_Status_New"), field="Payment_Status_New"),
        "payout_status": None,
        "event_date": event_date,
        "rule_version": "AIRTABLE-RULE-READ-1",
        "manual_override_flag": False,
    }

    builder_result: CommissionBuildResult = build_commission_dry_run(identity, state)
    if builder_result.mutation_type != "NOOP" or builder_result.dry_run is not True:
        raise CommissionDryRunAdapterError(
            "ADAPTER_BUILDER_SAFETY_VIOLATION",
            "builder_result",
            "pure builder returned non-NOOP or non-dry-run output",
        )

    read_tables = [BOOKINGS_TABLE_ID, COMMISSION_RULES_TABLE_ID]
    if segment_record is not None:
        read_tables.append(BOOKING_SEGMENTS_TABLE_ID)

    return CommissionDryRunAdapterResult(
        adapter_version="COMMISSION-AIRTABLE-DRYRUN-1.0.0",
        source="AIRTABLE_READ_ONLY",
        booking_record_id=request.booking_record_id,
        commission_rule_record_id=request.commission_rule_record_id,
        booking_segment_record_id=request.booking_segment_record_id,
        builder_result=builder_result.to_dict(),
        mutation_type="NOOP",
        dry_run=True,
        read_tables=read_tables,
    )
