from __future__ import annotations

from typing import Any

LEGACY_FIELD_WRITE_FORBIDDEN = "LEGACY_FIELD_WRITE_FORBIDDEN"

LEGACY_WRITE_DENY_LIST = frozenset(
    {
        "Booking_Date",
        "Start_Time",
        "End_Time",
        "Start Time",
        "Finish_DateTime",
        "Legacy_Client_Text",
        "Legacy_Service_Collaborator",
        "Legacy_Therapist_Select",
        "Legacy_Room_File",
    }
)


class LegacyFieldWriteForbiddenError(ValueError):
    code = LEGACY_FIELD_WRITE_FORBIDDEN

    def __init__(self, blocked_fields: list[str]) -> None:
        self.blocked_fields = tuple(blocked_fields)
        super().__init__(LEGACY_FIELD_WRITE_FORBIDDEN)


def _blocked_fields(fields: dict[str, Any]) -> list[str]:
    return [field for field in fields if field in LEGACY_WRITE_DENY_LIST]


def assert_no_legacy_field_writes(fields: dict[str, Any]) -> None:
    blocked = _blocked_fields(fields)
    if blocked:
        raise LegacyFieldWriteForbiddenError(blocked)


def assert_no_legacy_booking_write_payload(payload: dict[str, Any] | None) -> None:
    """Reject legacy Booking field writes in Airtable single/batch write envelopes."""
    if payload is None:
        return

    blocked: list[str] = []

    direct_fields = payload.get("fields")
    if isinstance(direct_fields, dict):
        blocked.extend(_blocked_fields(direct_fields))

    records = payload.get("records")
    if isinstance(records, list):
        for record in records:
            if not isinstance(record, dict):
                continue
            record_fields = record.get("fields")
            if not isinstance(record_fields, dict):
                continue
            blocked.extend(_blocked_fields(record_fields))

    if blocked:
        # Preserve first-seen order while keeping the error deterministic.
        unique_blocked = list(dict.fromkeys(blocked))
        raise LegacyFieldWriteForbiddenError(unique_blocked)
