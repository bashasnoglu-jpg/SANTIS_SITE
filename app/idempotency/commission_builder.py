from __future__ import annotations

import hashlib
import json
import re
from dataclasses import asdict, dataclass
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any, Mapping

KEY_SCHEMA_VERSION = "v1"
CONTRACT_VERSION = "COMMISSION-IDEM-1.0.0"
NAMESPACE = "COMMISSION"

_RECORD_ID_RE = re.compile(r"^rec[A-Za-z0-9]{14}$")
_CANONICAL_TOKEN_RE = re.compile(r"^[A-Z][A-Z0-9_]*$")

_ENVIRONMENT_ALIASES = {
    "live": "Live",
    "test": "Test",
    "archive": "Archive",
    "sandbox": "Sandbox",
}

_SOURCE_ANCHOR_TYPES = {
    "BOOKING",
    "BOOKING_SEGMENT",
    "PAYMENT",
    "PACKAGE_USAGE",
}

_BENEFICIARY_TYPES = {
    "THERAPIST",
    "RECEPTION_STAFF",
}

_COMMISSION_COMPONENTS = {
    "SERVICE_DELIVERY_BASE",
    "UPSELL_BONUS",
    "RECEPTION_SALE",
    "PACKAGE_USAGE_COMMISSION",
    "PAYMENT_COLLECTION_BONUS",
}

# Current Commission Ledger choices plus contract-approved source events.
_SOURCE_EVENTS = {
    "BOOKING_COMPLETED",
    "PACKAGE_SOLD",
    "PRODUCT_SOLD",
    "GIFT_CARD_SOLD",
    "MEMBERSHIP_SOLD",
    "MANUAL_ADJUSTMENT",
    "PAYMENT_RECEIVED",
    "PACKAGE_USAGE_FINALIZED",
    "SERVICE_SEGMENT_COMPLETED",
}

_RECORD_ID_FIELDS = {
    "tenant_id",
    "location_id",
    "source_anchor_id",
    "booking_id",
    "booking_segment_id",
    "payment_id",
    "beneficiary_id",
    "service_id",
    "commission_rule_id",
}

_CURRENCY_FIELDS = {
    "gross_source_amount",
    "fixed_amount",
    "calculated_commission_amount",
}
_RATE_FIELDS = {"commission_rate"}
_DATE_FIELDS = {"event_date"}
_BOOLEAN_FIELDS = {"manual_override_flag"}
_TEXT_FIELDS = {"rule_version"}

_GENERIC_ENUM_FIELDS = {
    "commission_type",
    "booking_status",
    "payment_status",
    "payout_status",
}

# Presentation-only context is accepted but intentionally excluded from hashing.
_DISPLAY_ONLY_FIELDS = {
    "beneficiary_display_name",
    "service_display_name",
    "rule_display_name",
    "tenant_display_name",
    "location_display_name",
}

_FINGERPRINT_FIELDS = (
    "tenant_id",
    "environment",
    "location_id",
    "source_anchor_type",
    "source_anchor_id",
    "booking_id",
    "booking_segment_id",
    "payment_id",
    "beneficiary_type",
    "beneficiary_id",
    "service_id",
    "commission_rule_id",
    "source_event",
    "commission_component",
    "gross_source_amount",
    "commission_rate",
    "fixed_amount",
    "commission_type",
    "calculated_commission_amount",
    "booking_status",
    "payment_status",
    "payout_status",
    "event_date",
    "rule_version",
    "manual_override_flag",
)

_ALLOWED_INPUT_FIELDS = set(_FINGERPRINT_FIELDS) | _DISPLAY_ONLY_FIELDS

# The fingerprint contains these identity fields, so dry-run must prove that they
# match the key identity. This prevents key=Test/state=Live split-brain output.
_IDENTITY_STATE_FIELDS = (
    "tenant_id",
    "environment",
    "source_anchor_type",
    "source_anchor_id",
    "beneficiary_type",
    "beneficiary_id",
    "commission_component",
    "source_event",
)


class CommissionIdentityError(ValueError):
    """Fail-closed contract error raised by the pure commission builder."""

    def __init__(self, code: str, field: str, detail: str) -> None:
        self.code = code
        self.field = field
        self.detail = detail
        super().__init__(f"{code}: {field}: {detail}")


@dataclass(frozen=True, slots=True)
class CommissionIdentityInput:
    tenant_id: str
    environment: str
    source_anchor_type: str
    source_anchor_id: str
    beneficiary_type: str
    beneficiary_id: str
    commission_component: str
    source_event: str


@dataclass(frozen=True, slots=True)
class CommissionBuildResult:
    namespace: str
    key_schema_version: str
    contract_version: str
    idempotency_key: str | None
    input_fingerprint: str | None
    comparison_result: str
    decision: str
    mutation_type: str
    dry_run: bool
    errors: list[dict[str, str]]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _fail(code: str, field: str, detail: str) -> CommissionIdentityError:
    return CommissionIdentityError(code=code, field=field, detail=detail)


def _is_blank(value: Any) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def _normalize_record_id(value: Any, *, field: str, required: bool) -> str | None:
    if _is_blank(value):
        if required:
            raise _fail(
                "IDEMPOTENCY_IDENTITY_INCOMPLETE",
                field,
                "required Airtable record ID is missing",
            )
        return None

    candidate = str(value).strip()
    if not _RECORD_ID_RE.fullmatch(candidate):
        raise _fail(
            "IDEMPOTENCY_INVALID_RECORD_ID",
            field,
            "expected exact Airtable record ID matching rec + 14 alphanumeric characters",
        )
    return candidate


def _tokenize(value: Any, *, field: str) -> str:
    if _is_blank(value):
        raise _fail("IDEMPOTENCY_INVALID_ENUM", field, "enum value is missing or blank")
    token = re.sub(r"[^A-Za-z0-9]+", "_", str(value).strip()).strip("_").upper()
    if not _CANONICAL_TOKEN_RE.fullmatch(token):
        raise _fail("IDEMPOTENCY_INVALID_ENUM", field, "cannot canonicalize enum value")
    return token


def _normalize_environment(value: Any, *, field: str = "environment") -> str:
    if _is_blank(value):
        raise _fail("IDEMPOTENCY_INVALID_ENUM", field, "environment is missing or blank")
    normalized = _ENVIRONMENT_ALIASES.get(str(value).strip().lower())
    if normalized is None:
        raise _fail(
            "IDEMPOTENCY_INVALID_ENUM",
            field,
            "allowed values: Live, Test, Archive, Sandbox",
        )
    return normalized


def _normalize_known_token(value: Any, *, field: str, allowed: set[str]) -> str:
    token = _tokenize(value, field=field)
    if token not in allowed:
        raise _fail(
            "IDEMPOTENCY_INVALID_ENUM",
            field,
            f"unsupported canonical value: {token}",
        )
    return token


def _normalize_generic_enum(value: Any, *, field: str) -> str | None:
    if _is_blank(value):
        return None
    return _tokenize(value, field=field)


def _normalize_decimal(value: Any, *, field: str, places: int) -> str | None:
    if _is_blank(value):
        return None
    if isinstance(value, bool):
        raise _fail("IDEMPOTENCY_INVALID_DECIMAL", field, "boolean is not a decimal")

    try:
        decimal_value = Decimal(str(value).strip())
    except (InvalidOperation, ValueError):
        raise _fail("IDEMPOTENCY_INVALID_DECIMAL", field, "invalid decimal value") from None

    if not decimal_value.is_finite():
        raise _fail("IDEMPOTENCY_INVALID_DECIMAL", field, "decimal must be finite")

    quantum = Decimal("1").scaleb(-places)
    normalized = decimal_value.quantize(quantum, rounding=ROUND_HALF_UP)
    return format(normalized, f".{places}f")


def _normalize_date(value: Any, *, field: str) -> str | None:
    if _is_blank(value):
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()

    raw = str(value).strip()
    try:
        return date.fromisoformat(raw).isoformat()
    except ValueError:
        pass

    match = re.fullmatch(r"(\d{1,2})/(\d{1,2})/(\d{4})", raw)
    if not match:
        raise _fail("IDEMPOTENCY_INVALID_DATE", field, "expected ISO date or unambiguous slash date")

    first, second, year = (int(part) for part in match.groups())
    if first <= 12 and second <= 12:
        raise _fail(
            "IDEMPOTENCY_AMBIGUOUS_DATE",
            field,
            "slash date is ambiguous without locale; use YYYY-MM-DD",
        )

    if first > 12 and second <= 12:
        day_value, month_value = first, second
    elif second > 12 and first <= 12:
        month_value, day_value = first, second
    else:
        raise _fail("IDEMPOTENCY_INVALID_DATE", field, "invalid slash date")

    try:
        return date(year, month_value, day_value).isoformat()
    except ValueError:
        raise _fail("IDEMPOTENCY_INVALID_DATE", field, "invalid calendar date") from None


def normalize_datetime_utc(value: Any, *, field: str) -> str | None:
    """Normalize an optional aware datetime to UTC ISO 8601 with Z suffix."""
    if _is_blank(value):
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        raw = str(value).strip().replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(raw)
        except ValueError:
            raise _fail("IDEMPOTENCY_INVALID_DATETIME", field, "invalid ISO 8601 datetime") from None
    if dt.tzinfo is None:
        raise _fail(
            "IDEMPOTENCY_INVALID_DATETIME",
            field,
            "timezone-aware datetime is required",
        )
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _normalize_boolean(value: Any, *, field: str) -> bool | None:
    if _is_blank(value):
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "1", "yes"}:
            return True
        if lowered in {"false", "0", "no"}:
            return False
    raise _fail("IDEMPOTENCY_INVALID_BOOLEAN", field, "expected true or false")


def _normalize_text(value: Any) -> str | None:
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized or None


def normalize_commission_state(state: Mapping[str, Any]) -> dict[str, Any]:
    """Return canonical Commission v1 calculation state without side effects."""
    unknown_fields = set(state) - _ALLOWED_INPUT_FIELDS
    if unknown_fields:
        field = sorted(unknown_fields)[0]
        raise _fail(
            "IDEMPOTENCY_UNKNOWN_CALCULATION_FIELD",
            field,
            "field is not part of COMMISSION-IDEM-1.0.0",
        )

    normalized: dict[str, Any] = {}
    for field in _FINGERPRINT_FIELDS:
        value = state.get(field)

        if field in _RECORD_ID_FIELDS:
            normalized[field] = _normalize_record_id(value, field=field, required=False)
        elif field == "environment":
            normalized[field] = None if _is_blank(value) else _normalize_environment(value, field=field)
        elif field == "source_anchor_type":
            normalized[field] = (
                None
                if _is_blank(value)
                else _normalize_known_token(value, field=field, allowed=_SOURCE_ANCHOR_TYPES)
            )
        elif field == "beneficiary_type":
            normalized[field] = (
                None
                if _is_blank(value)
                else _normalize_known_token(value, field=field, allowed=_BENEFICIARY_TYPES)
            )
        elif field == "source_event":
            normalized[field] = (
                None if _is_blank(value) else _normalize_known_token(value, field=field, allowed=_SOURCE_EVENTS)
            )
        elif field == "commission_component":
            normalized[field] = (
                None
                if _is_blank(value)
                else _normalize_known_token(value, field=field, allowed=_COMMISSION_COMPONENTS)
            )
        elif field in _CURRENCY_FIELDS:
            normalized[field] = _normalize_decimal(value, field=field, places=2)
        elif field in _RATE_FIELDS:
            normalized[field] = _normalize_decimal(value, field=field, places=6)
        elif field in _DATE_FIELDS:
            normalized[field] = _normalize_date(value, field=field)
        elif field in _BOOLEAN_FIELDS:
            normalized[field] = _normalize_boolean(value, field=field)
        elif field in _GENERIC_ENUM_FIELDS:
            normalized[field] = _normalize_generic_enum(value, field=field)
        elif field in _TEXT_FIELDS:
            normalized[field] = _normalize_text(value)
        else:  # pragma: no cover - contract map must remain exhaustive
            raise AssertionError(f"Unhandled fingerprint field: {field}")

    return normalized


def stable_json(value: Mapping[str, Any]) -> str:
    """Serialize a mapping deterministically for hashing."""
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    )


def _fingerprint_normalized_state(normalized_state: Mapping[str, Any]) -> str:
    payload = stable_json(normalized_state).encode("utf-8")
    digest = hashlib.sha256(payload).hexdigest()
    return f"sha256:{digest}"


def build_input_fingerprint(state: Mapping[str, Any]) -> str:
    return _fingerprint_normalized_state(normalize_commission_state(state))


def _normalize_identity(identity: CommissionIdentityInput) -> CommissionIdentityInput:
    return CommissionIdentityInput(
        tenant_id=_normalize_record_id(identity.tenant_id, field="tenant_id", required=True) or "",
        environment=_normalize_environment(identity.environment),
        source_anchor_type=_normalize_known_token(
            identity.source_anchor_type,
            field="source_anchor_type",
            allowed=_SOURCE_ANCHOR_TYPES,
        ),
        source_anchor_id=_normalize_record_id(
            identity.source_anchor_id,
            field="source_anchor_id",
            required=True,
        )
        or "",
        beneficiary_type=_normalize_known_token(
            identity.beneficiary_type,
            field="beneficiary_type",
            allowed=_BENEFICIARY_TYPES,
        ),
        beneficiary_id=_normalize_record_id(
            identity.beneficiary_id,
            field="beneficiary_id",
            required=True,
        )
        or "",
        commission_component=_normalize_known_token(
            identity.commission_component,
            field="commission_component",
            allowed=_COMMISSION_COMPONENTS,
        ),
        source_event=_normalize_known_token(
            identity.source_event,
            field="source_event",
            allowed=_SOURCE_EVENTS,
        ),
    )


def _build_key_from_normalized(identity: CommissionIdentityInput) -> str:
    return "|".join(
        [
            f"{NAMESPACE}:{KEY_SCHEMA_VERSION}",
            f"tenant={identity.tenant_id}",
            f"env={identity.environment}",
            f"sourceType={identity.source_anchor_type}",
            f"sourceId={identity.source_anchor_id}",
            f"beneficiaryType={identity.beneficiary_type}",
            f"beneficiaryId={identity.beneficiary_id}",
            f"component={identity.commission_component}",
            f"event={identity.source_event}",
        ]
    )


def build_commission_idempotency_key(identity: CommissionIdentityInput) -> str:
    return _build_key_from_normalized(_normalize_identity(identity))


def _validate_identity_state_coherence(
    identity: CommissionIdentityInput,
    normalized_state: Mapping[str, Any],
) -> None:
    expected = {
        "tenant_id": identity.tenant_id,
        "environment": identity.environment,
        "source_anchor_type": identity.source_anchor_type,
        "source_anchor_id": identity.source_anchor_id,
        "beneficiary_type": identity.beneficiary_type,
        "beneficiary_id": identity.beneficiary_id,
        "commission_component": identity.commission_component,
        "source_event": identity.source_event,
    }

    for field in _IDENTITY_STATE_FIELDS:
        observed = normalized_state.get(field)
        if observed is None:
            raise _fail(
                "IDEMPOTENCY_STATE_IDENTITY_INCOMPLETE",
                field,
                "calculation state must carry the same identity context used by the key",
            )
        if observed != expected[field]:
            raise _fail(
                "IDEMPOTENCY_STATE_IDENTITY_MISMATCH",
                field,
                f"key identity and calculation state disagree: expected {expected[field]!r}, observed {observed!r}",
            )


def build_commission_dry_run(
    identity: CommissionIdentityInput,
    calculation_state: Mapping[str, Any],
) -> CommissionBuildResult:
    """Build key/fingerprint only; no comparator, claim, network, or mutation."""
    try:
        normalized_identity = _normalize_identity(identity)
        normalized_state = normalize_commission_state(calculation_state)
        _validate_identity_state_coherence(normalized_identity, normalized_state)
        key = _build_key_from_normalized(normalized_identity)
        fingerprint = _fingerprint_normalized_state(normalized_state)
    except CommissionIdentityError as exc:
        return CommissionBuildResult(
            namespace=NAMESPACE,
            key_schema_version=KEY_SCHEMA_VERSION,
            contract_version=CONTRACT_VERSION,
            idempotency_key=None,
            input_fingerprint=None,
            comparison_result="ERROR_FAIL_CLOSED",
            decision="ERROR",
            mutation_type="NOOP",
            dry_run=True,
            errors=[{"code": exc.code, "field": exc.field, "detail": exc.detail}],
        )

    return CommissionBuildResult(
        namespace=NAMESPACE,
        key_schema_version=KEY_SCHEMA_VERSION,
        contract_version=CONTRACT_VERSION,
        idempotency_key=key,
        input_fingerprint=fingerprint,
        comparison_result="NOT_EVALUATED",
        decision="DRY_RUN_BUILT",
        mutation_type="NOOP",
        dry_run=True,
        errors=[],
    )
