from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Iterable

CONTRACT_VERSION = "IDENTITY-WRITE-THROUGH-0.1.0"


def stable_record_ids(value: Any) -> list[str]:
    """Return sorted unique Airtable record IDs from a linked-record value."""
    if not isinstance(value, list):
        return []

    ids: set[str] = set()
    for item in value:
        if isinstance(item, str):
            candidate = item
        elif isinstance(item, dict):
            candidate = item.get("id")
        else:
            candidate = None

        if isinstance(candidate, str) and candidate.startswith("rec"):
            ids.add(candidate)

    return sorted(ids)


def require_record_id(value: str, label: str) -> str:
    if not isinstance(value, str) or not value.startswith("rec"):
        raise ValueError(f"{label} must be an Airtable record ID")
    return value


def canonical_fingerprint(payload: dict[str, Any]) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    digest = hashlib.sha256(encoded.encode("utf-8")).hexdigest()
    return f"sha256:{digest}"


def deterministic_boundary_key(
    *,
    shift_record_id: str,
    expected_staff_ids: Iterable[str],
    new_staff_ids: Iterable[str],
    correlation_id: str,
) -> str:
    require_record_id(shift_record_id, "shift_record_id")
    payload = {
        "contract": CONTRACT_VERSION,
        "shift_record_id": shift_record_id,
        "expected_staff_ids": sorted(set(expected_staff_ids)),
        "new_staff_ids": sorted(set(new_staff_ids)),
        "correlation_id": correlation_id,
    }
    return f"{CONTRACT_VERSION}|SHIFT={shift_record_id}|H={canonical_fingerprint(payload).removeprefix('sha256:')}"


def find_impacted_booking_ids(bookings: list[dict[str, Any]], shift_record_id: str) -> list[str]:
    """Legacy/pure helper for explicit booking collections.

    The A.3G runtime does not use this for discovery; it uses the shift's native
    reverse `Bookings` linked-record field to avoid scanning the Bookings table.
    """
    require_record_id(shift_record_id, "shift_record_id")
    impacted: list[str] = []
    for booking in bookings:
        if shift_record_id in stable_record_ids((booking.get("fields") or {}).get("Staff Shift Link")):
            booking_id = booking.get("id")
            if isinstance(booking_id, str) and booking_id.startswith("rec"):
                impacted.append(booking_id)
    return sorted(set(impacted))


def reverse_impacted_booking_ids(
    shift: dict[str, Any],
    *,
    reverse_field_name: str = "Bookings",
) -> list[str]:
    """Read exact impacted booking IDs from a shift's native reverse link field."""
    require_record_id(str(shift.get("id", "")), "shift.id")
    fields = shift.get("fields") or {}
    return stable_record_ids(fields.get(reverse_field_name))


@dataclass(frozen=True)
class ShiftEvidence:
    shift_record_id: str
    staff_ids: tuple[str, ...]
    source_signature: str

    @property
    def staff_count(self) -> int:
        return len(self.staff_ids)

    @property
    def single_staff_id(self) -> str | None:
        return self.staff_ids[0] if len(self.staff_ids) == 1 else None


def compute_shift_evidence(shift: dict[str, Any]) -> ShiftEvidence:
    shift_id = require_record_id(str(shift.get("id", "")), "shift.id")
    fields = shift.get("fields") or {}
    return ShiftEvidence(
        shift_record_id=shift_id,
        staff_ids=tuple(stable_record_ids(fields.get("Staff_Link"))),
        source_signature=str(fields.get("Shift_Identity_Source_Signature_v0_1") or "").strip(),
    )


@dataclass(frozen=True)
class BookingEvidence:
    booking_record_id: str
    therapist_ids: tuple[str, ...]
    shift_ids: tuple[str, ...]
    linked_shift_staff_ids: tuple[str, ...]
    source_signature: str

    @property
    def shift_link_count(self) -> int:
        return len(self.shift_ids)

    @property
    def linked_shift_single_staff_id(self) -> str | None:
        if len(self.shift_ids) == 1 and len(self.linked_shift_staff_ids) == 1:
            return self.linked_shift_staff_ids[0]
        return None


def compute_booking_evidence(
    booking: dict[str, Any],
    shifts_by_id: dict[str, dict[str, Any]],
) -> BookingEvidence:
    booking_id = require_record_id(str(booking.get("id", "")), "booking.id")
    fields = booking.get("fields") or {}
    therapist_ids = tuple(stable_record_ids(fields.get("Therapist_Link")))
    shift_ids = tuple(stable_record_ids(fields.get("Staff Shift Link")))

    linked_staff: set[str] = set()
    if len(shift_ids) == 1:
        shift = shifts_by_id.get(shift_ids[0])
        if shift is None:
            raise ValueError(f"linked shift not resolved: {shift_ids[0]}")
        linked_staff.update(stable_record_ids((shift.get("fields") or {}).get("Staff_Link")))

    return BookingEvidence(
        booking_record_id=booking_id,
        therapist_ids=therapist_ids,
        shift_ids=shift_ids,
        linked_shift_staff_ids=tuple(sorted(linked_staff)),
        source_signature=str(fields.get("Identity_Source_Signature_v0_1") or "").strip(),
    )


def shift_cache_patch(evidence: ShiftEvidence) -> dict[str, Any]:
    if not evidence.source_signature:
        raise ValueError("shift source signature missing")
    return {
        "Shift_Staff_Record_ID": evidence.single_staff_id,
        "Shift_Staff_Count": evidence.staff_count,
        "Shift_Identity_Reconciled_Source_Signature_v0_1": evidence.source_signature,
    }


def booking_cache_patch(evidence: BookingEvidence) -> dict[str, Any]:
    if not evidence.source_signature:
        raise ValueError("booking source signature missing")
    return {
        "Linked_Shift_Staff_Record_ID": evidence.linked_shift_single_staff_id,
        "Staff_Shift_Link_Count": evidence.shift_link_count,
        "Identity_Reconciled_Source_Signature_v0_1": evidence.source_signature,
    }
