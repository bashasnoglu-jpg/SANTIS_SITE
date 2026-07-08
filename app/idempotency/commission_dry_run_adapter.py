from __future__ import annotations

import json
import os
import re
from dataclasses import asdict, dataclass
from typing import Any, Mapping, Protocol
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .commission_builder import (
    CommissionBuildResult,
    CommissionIdentityInput,
    build_commission_dry_run,
)

PHASE = "111-C.1D"
ADAPTER_VERSION = "COMMISSION-AIRTABLE-DRYRUN-1.0.0"
AIRTABLE_API_URL = "https://api.airtable.com/v0"
AIRTABLE_BASE_ID_ENV_KEYS = ("AIRTABLE_BASE_ID", "AIRTABLE_SANTIS_BASE_ID")
AIRTABLE_TOKEN_ENV_KEYS = ("AIRTABLE_PAT", "AIRTABLE_API_KEY")

COMMISSION_LEDGER_TABLE_ID = os.getenv("AIRTABLE_COMMISSION_LEDGER_TABLE_ID", "tbliz2cnvA3cyVaLd")
BOOKINGS_TABLE_ID = os.getenv("AIRTABLE_BOOKINGS_TABLE_ID", "tblocCFVgSNfaLAH6")
COMMISSION_RULES_TABLE_ID = os.getenv("AIRTABLE_COMMISSION_RULES_TABLE_ID", "tblukYjjH5K6Ah9i2")
PAYMENTS_TABLE_ID = os.getenv("AIRTABLE_PAYMENTS_TABLE_ID", "tblcUltjoMusYcQob")
BOOKING_SEGMENTS_TABLE_ID = os.getenv("AIRTABLE_BOOKING_SEGMENTS_TABLE_ID", "tblmMwo3LQCdbDB3T")

_RECORD_ID_RE = re.compile(r"^rec[A-Za-z0-9]{14}$")

LEDGER_FIELDS = (
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
    "Booking_Segment_Link",
)

BOOKING_FIELDS = (
    "Tenant_Link",
    "Location_Link",
    "Environment",
    "Service_Link",
    "Therapist_Link",
    "Status_New",
    "Payment_Status_New",
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

PAYMENT_FIELDS = (
    "Booking_Link",
    "Location_Link",
    "Amount_EUR",
    "Payment_Status_New",
    "Payment_Date",
    "Environment",
    "Tenant_Link",
)

SEGMENT_FIELDS = (
    "Booking_Link",
    "Tenant_Link",
    "Location_Link",
    "Environment",
    "Service_Link",
    "Therapist_Link",
    "Commission Eligible",
)

_COMPONENT_MAP = {
    ("THERAPIST", "BOOKING_COMPLETED"): "SERVICE_DELIVERY_BASE",
}


class CommissionDryRunAdapterError(ValueError):
    def __init__(self, code: str, field: str, detail: str) -> None:
        self.code = code
        self.field = field
        self.detail = detail
        super().__init__(f"{code}: {field}: {detail}")


class AirtableReadOnlyClient(Protocol):
    def get_record(self, table_id: str, record_id: str, fields: tuple[str, ...]) -> Mapping[str, Any]: ...


@dataclass(frozen=True, slots=True)
class CommissionAdapterDryRunResult:
    phase: str
    adapter_version: str
    source_ledger_record_id: str
    records_read: list[str]
    idempotency_key: str | None
    input_fingerprint: str | None
    comparison_result: str
    decision: str
    mutation_type: str
    dry_run: bool
    errors: list[dict[str, str]]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class AirtableGetOnlyClient:
    """Minimal Airtable client with a deliberately GET-only public surface."""

    def __init__(self, *, base_id: str | None = None, token: str | None = None, timeout_seconds: int = 15) -> None:
        self._base_id = base_id or _first_env(AIRTABLE_BASE_ID_ENV_KEYS)
        self._token = token or _first_env(AIRTABLE_TOKEN_ENV_KEYS)
        self._timeout_seconds = timeout_seconds
        if not self._base_id:
            raise CommissionDryRunAdapterError("AIRTABLE_CONFIG_MISSING", "base_id", "Airtable base ID is not configured")
        if not self._token:
            raise CommissionDryRunAdapterError("AIRTABLE_CONFIG_MISSING", "token", "Airtable token is not configured")

    def get_record(self, table_id: str, record_id: str, fields: tuple[str, ...]) -> Mapping[str, Any]:
        _require_record_id(record_id, field="record_id")
        params = [("fields[]", field_name) for field_name in fields]
        query = f"?{urlencode(params)}" if params else ""
        url = f"{AIRTABLE_API_URL}/{self._base_id}/{table_id}/{record_id}{query}"
        request = Request(url, method="GET", headers={"Authorization": f"Bearer {self._token}"})
        try:
            with urlopen(request, timeout=self._timeout_seconds) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise CommissionDryRunAdapterError("AIRTABLE_READ_FAILED", record_id, body[:500]) from exc
        except URLError as exc:
            raise CommissionDryRunAdapterError("AIRTABLE_NETWORK_ERROR", record_id, str(exc.reason)) from exc
        except json.JSONDecodeError as exc:
            raise CommissionDryRunAdapterError("AIRTABLE_INVALID_JSON", record_id, "Airtable returned invalid JSON") from exc


class CommissionAirtableDryRunAdapter:
    def __init__(self, client: AirtableReadOnlyClient) -> None:
        self._client = client

    def build_from_ledger_record(self, ledger_record_id: str) -> CommissionAdapterDryRunResult:
        records_read: list[str] = []
        try:
            _require_record_id(ledger_record_id, field="source_ledger_record_id")
            ledger = self._read(COMMISSION_LEDGER_TABLE_ID, ledger_record_id, LEDGER_FIELDS, records_read)
            ledger_fields = _fields(ledger)

            commission_type = _required_select(ledger_fields, "Commission Type")
            source_event = _required_select(ledger_fields, "Source Event")
            component = _resolve_component(commission_type, source_event)

            tenant_id = _required_single_link(ledger_fields, "Tenant_Link")
            location_id = _required_single_link(ledger_fields, "Location_Link")
            environment = _required_select(ledger_fields, "Environment")
            booking_id = _required_single_link(ledger_fields, "Booking_Link")
            therapist_id = _required_single_link(ledger_fields, "Therapist_Link")
            rule_id = _required_single_link(ledger_fields, "Commission_Rule_Link")
            payment_id = _optional_single_link(ledger_fields, "Payment_Link")
            segment_id = _optional_single_link(ledger_fields, "Booking_Segment_Link")

            if _optional_single_link(ledger_fields, "Reception_Staff_Link") is not None:
                raise _error("ADAPTER_UNSUPPORTED_EVENT", "Reception_Staff_Link", "111-C.1D pilot supports therapist booking completion only")

            booking = self._read(BOOKINGS_TABLE_ID, booking_id, BOOKING_FIELDS, records_read)
            rule = self._read(COMMISSION_RULES_TABLE_ID, rule_id, RULE_FIELDS, records_read)
            payment = self._read(PAYMENTS_TABLE_ID, payment_id, PAYMENT_FIELDS, records_read) if payment_id else None
            segment = self._read(BOOKING_SEGMENTS_TABLE_ID, segment_id, SEGMENT_FIELDS, records_read) if segment_id else None

            booking_fields = _fields(booking)
            rule_fields = _fields(rule)
            payment_fields = _fields(payment) if payment else None
            segment_fields = _fields(segment) if segment else None

            _require_equal("tenant_id", tenant_id, _required_single_link(booking_fields, "Tenant_Link"), "Booking")
            _require_equal("tenant_id", tenant_id, _required_single_link(rule_fields, "Tenant_Link"), "Commission Rule")
            _require_equal("location_id", location_id, _required_single_link(booking_fields, "Location_Link"), "Booking")
            _require_equal("environment", environment, _required_select(booking_fields, "Environment"), "Booking")
            _require_equal("therapist_id", therapist_id, _required_single_link(booking_fields, "Therapist_Link"), "Booking")

            rule_location = _optional_single_link(rule_fields, "Location_Link")
            if rule_location is not None:
                _require_equal("location_id", location_id, rule_location, "Commission Rule")

            _require_equal("rule_target", _canonical_token(commission_type), _canonical_token(_required_select(rule_fields, "Commission Target")), "Commission Rule")
            _require_equal("source_event", _canonical_token(source_event), _canonical_token(_required_select(rule_fields, "Trigger Event")), "Commission Rule")
            if rule_fields.get("Active") is not True:
                raise _error("ADAPTER_RULE_INACTIVE", "Commission_Rule_Link", "linked commission rule is not active")

            if payment_fields is not None and payment_id is not None:
                _require_equal("payment_booking_id", booking_id, _required_single_link(payment_fields, "Booking_Link"), "Payment")
                _require_equal("tenant_id", tenant_id, _required_single_link(payment_fields, "Tenant_Link"), "Payment")
                _require_equal("location_id", location_id, _required_single_link(payment_fields, "Location_Link"), "Payment")
                _require_equal("environment", environment, _required_select(payment_fields, "Environment"), "Payment")

            if segment_fields is not None and segment_id is not None:
                _require_equal("segment_booking_id", booking_id, _required_single_link(segment_fields, "Booking_Link"), "Booking Segment")
                _require_equal("tenant_id", tenant_id, _required_single_link(segment_fields, "Tenant_Link"), "Booking Segment")
                _require_equal("location_id", location_id, _required_single_link(segment_fields, "Location_Link"), "Booking Segment")
                _require_equal("environment", environment, _required_select(segment_fields, "Environment"), "Booking Segment")
                _require_equal("therapist_id", therapist_id, _required_single_link(segment_fields, "Therapist_Link"), "Booking Segment")
                if segment_fields.get("Commission Eligible") is not True:
                    raise _error("ADAPTER_SEGMENT_NOT_ELIGIBLE", "Booking_Segment_Link", "segment is not commission eligible")

            service_id = _resolve_service_id(
                _optional_single_link(ledger_fields, "Service_Link"),
                _optional_single_link(booking_fields, "Service_Link"),
                _optional_single_link(rule_fields, "Service_Link"),
                _optional_single_link(segment_fields, "Service_Link") if segment_fields is not None else None,
            )

            source_anchor_type = "BOOKING_SEGMENT" if segment_id else "BOOKING"
            source_anchor_id = segment_id or booking_id
            payment_status = _required_select(payment_fields, "Payment_Status_New") if payment_fields is not None else _optional_select(booking_fields, "Payment_Status_New")

            identity = CommissionIdentityInput(
                tenant_id=tenant_id,
                environment=environment,
                source_anchor_type=source_anchor_type,
                source_anchor_id=source_anchor_id,
                beneficiary_type="THERAPIST",
                beneficiary_id=therapist_id,
                commission_component=component,
                source_event=source_event,
            )

            calculation_state = {
                "tenant_id": tenant_id,
                "environment": environment,
                "location_id": location_id,
                "source_anchor_type": source_anchor_type,
                "source_anchor_id": source_anchor_id,
                "booking_id": booking_id,
                "booking_segment_id": segment_id,
                "payment_id": payment_id,
                "beneficiary_type": "THERAPIST",
                "beneficiary_id": therapist_id,
                "service_id": service_id,
                "commission_rule_id": rule_id,
                "source_event": source_event,
                "commission_component": component,
                "gross_source_amount": ledger_fields.get("Gross Source Amount EUR"),
                "commission_rate": rule_fields.get("Rate Percent"),
                "fixed_amount": rule_fields.get("Fixed Amount EUR"),
                "commission_type": commission_type,
                "calculated_commission_amount": ledger_fields.get("Commission Amount EUR"),
                "booking_status": _optional_select(booking_fields, "Status_New"),
                "payment_status": payment_status,
                "payout_status": _optional_select(ledger_fields, "Payout Status"),
                "event_date": ledger_fields.get("Entry Date"),
                "rule_version": None,
                "manual_override_flag": False,
            }

            builder_result = build_commission_dry_run(identity, calculation_state)
            return _from_builder(ledger_record_id, records_read, builder_result)
        except CommissionDryRunAdapterError as exc:
            return CommissionAdapterDryRunResult(
                phase=PHASE,
                adapter_version=ADAPTER_VERSION,
                source_ledger_record_id=ledger_record_id,
                records_read=records_read,
                idempotency_key=None,
                input_fingerprint=None,
                comparison_result="ERROR_FAIL_CLOSED",
                decision="ERROR",
                mutation_type="NOOP",
                dry_run=True,
                errors=[{"code": exc.code, "field": exc.field, "detail": exc.detail}],
            )

    def _read(self, table_id: str, record_id: str, fields: tuple[str, ...], records_read: list[str]) -> Mapping[str, Any]:
        record = self._client.get_record(table_id, record_id, fields)
        records_read.append(record_id)
        return record


def _first_env(keys: tuple[str, ...]) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return None


def _error(code: str, field: str, detail: str) -> CommissionDryRunAdapterError:
    return CommissionDryRunAdapterError(code=code, field=field, detail=detail)


def _require_record_id(value: str, *, field: str) -> str:
    if not _RECORD_ID_RE.fullmatch(value or ""):
        raise _error("ADAPTER_INVALID_RECORD_ID", field, "expected exact Airtable record ID")
    return value


def _fields(record: Mapping[str, Any] | None) -> Mapping[str, Any]:
    if not record:
        raise _error("ADAPTER_RECORD_MISSING", "record", "Airtable record payload is missing")
    fields = record.get("fields")
    if not isinstance(fields, Mapping):
        raise _error("ADAPTER_INVALID_RECORD", "fields", "Airtable record has no fields mapping")
    return fields


def _canonical_token(value: str) -> str:
    token = re.sub(r"[^A-Za-z0-9]+", "_", value.strip()).strip("_").upper()
    if not token:
        raise _error("ADAPTER_INVALID_ENUM", "enum", "cannot canonicalize enum value")
    return token


def _select_name(value: Any) -> str | None:
    if value is None or value == "":
        return None
    if isinstance(value, str):
        return value.strip() or None
    if isinstance(value, Mapping):
        name = value.get("name")
        return str(name).strip() if name else None
    raise _error("ADAPTER_INVALID_SELECT", "select", "select value must be string or {name: ...}")


def _required_select(fields: Mapping[str, Any] | None, field: str) -> str:
    if fields is None:
        raise _error("ADAPTER_IDENTITY_INCOMPLETE", field, "required select context is missing")
    value = _select_name(fields.get(field))
    if not value:
        raise _error("ADAPTER_IDENTITY_INCOMPLETE", field, "required select value is missing")
    return value


def _optional_select(fields: Mapping[str, Any] | None, field: str) -> str | None:
    if fields is None:
        return None
    return _select_name(fields.get(field))


def _link_ids(value: Any, *, field: str) -> list[str]:
    if value is None or value == "":
        return []
    if not isinstance(value, list):
        raise _error("ADAPTER_INVALID_LINK", field, "linked-record value must be a list")
    ids: list[str] = []
    for item in value:
        if isinstance(item, str):
            record_id = item
        elif isinstance(item, Mapping) and item.get("id"):
            record_id = str(item["id"])
        else:
            raise _error("ADAPTER_INVALID_LINK", field, "linked-record item must be record ID or {id: ...}")
        ids.append(_require_record_id(record_id, field=field))
    return ids


def _required_single_link(fields: Mapping[str, Any], field: str) -> str:
    ids = _link_ids(fields.get(field), field=field)
    if len(ids) != 1:
        raise _error("ADAPTER_LINK_CARDINALITY", field, f"expected exactly 1 linked record, observed {len(ids)}")
    return ids[0]


def _optional_single_link(fields: Mapping[str, Any] | None, field: str) -> str | None:
    if fields is None:
        return None
    ids = _link_ids(fields.get(field), field=field)
    if len(ids) > 1:
        raise _error("ADAPTER_LINK_CARDINALITY", field, f"expected at most 1 linked record, observed {len(ids)}")
    return ids[0] if ids else None


def _require_equal(field: str, expected: str, observed: str, source: str) -> None:
    if expected != observed:
        raise _error("ADAPTER_CONTEXT_MISMATCH", field, f"{source} mismatch: expected {expected!r}, observed {observed!r}")


def _resolve_component(commission_type: str, source_event: str) -> str:
    key = (_canonical_token(commission_type), _canonical_token(source_event))
    component = _COMPONENT_MAP.get(key)
    if component is None:
        raise _error(
            "ADAPTER_UNSUPPORTED_EVENT",
            "commission_component",
            f"no approved component mapping for {key[0]} + {key[1]}",
        )
    return component


def _resolve_service_id(*candidates: str | None) -> str | None:
    non_null = {candidate for candidate in candidates if candidate is not None}
    if len(non_null) > 1:
        raise _error("ADAPTER_CONTEXT_MISMATCH", "service_id", f"conflicting service IDs observed: {sorted(non_null)}")
    return next(iter(non_null), None)


def _from_builder(
    ledger_record_id: str,
    records_read: list[str],
    builder_result: CommissionBuildResult,
) -> CommissionAdapterDryRunResult:
    return CommissionAdapterDryRunResult(
        phase=PHASE,
        adapter_version=ADAPTER_VERSION,
        source_ledger_record_id=ledger_record_id,
        records_read=records_read,
        idempotency_key=builder_result.idempotency_key,
        input_fingerprint=builder_result.input_fingerprint,
        comparison_result=builder_result.comparison_result,
        decision=builder_result.decision,
        mutation_type="NOOP",
        dry_run=True,
        errors=builder_result.errors,
    )
