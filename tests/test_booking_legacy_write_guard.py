from __future__ import annotations

from unittest.mock import Mock

import pytest

from app.api.v1.endpoints import reception
from app.api.v1.endpoints.booking_write_guard import (
    LEGACY_FIELD_WRITE_FORBIDDEN,
    LEGACY_WRITE_DENY_LIST,
    LegacyFieldWriteForbiddenError,
    assert_no_legacy_field_writes,
)


CANONICAL_PAYLOAD = {
    "Start_DateTime": "2026-08-08T10:00:00Z",
    "Client_Link": "recTestClient",
    "Service_Link": "recTestService",
    "Status_New": "Confirmed",
}


@pytest.mark.parametrize("legacy_field", sorted(LEGACY_WRITE_DENY_LIST))
def test_rejects_each_legacy_booking_field(legacy_field: str) -> None:
    payload = {**CANONICAL_PAYLOAD, legacy_field: "test_value"}

    with pytest.raises(LegacyFieldWriteForbiddenError) as exc_info:
        assert_no_legacy_field_writes(payload)

    assert str(exc_info.value) == LEGACY_FIELD_WRITE_FORBIDDEN
    assert exc_info.value.code == LEGACY_FIELD_WRITE_FORBIDDEN
    assert exc_info.value.blocked_fields == (legacy_field,)


def test_rejects_mixed_legacy_and_canonical_fields() -> None:
    payload = {
        **CANONICAL_PAYLOAD,
        "Booking_Date": "2026-01-01",
        "Start_Time": "10:00",
    }

    with pytest.raises(LegacyFieldWriteForbiddenError) as exc_info:
        assert_no_legacy_field_writes(payload)

    assert exc_info.value.blocked_fields == ("Booking_Date", "Start_Time")


def test_passes_canonical_only_payload() -> None:
    assert_no_legacy_field_writes(CANONICAL_PAYLOAD)


def test_passes_existing_canonical_request_unchanged() -> None:
    existing_request = {
        "Start_At": "2026-08-08T10:00:00Z",
        "Tenant_Link": "recTestTenant",
    }

    assert_no_legacy_field_writes(existing_request)


def test_airtable_booking_write_boundary_rejects_before_io(monkeypatch: pytest.MonkeyPatch) -> None:
    base_id = Mock(side_effect=AssertionError("Airtable I/O must not be reached"))
    monkeypatch.setattr(reception, "_airtable_base_id", base_id)

    with pytest.raises(LegacyFieldWriteForbiddenError) as exc_info:
        reception._airtable_json_request(
            "PATCH",
            reception.BOOKINGS_TABLE_ID,
            record_id="recTestBooking",
            payload={"fields": {**CANONICAL_PAYLOAD, "Legacy_Room_File": "legacy-room"}},
        )

    assert exc_info.value.code == LEGACY_FIELD_WRITE_FORBIDDEN
    assert exc_info.value.blocked_fields == ("Legacy_Room_File",)
    base_id.assert_not_called()


def test_airtable_booking_batch_write_boundary_rejects_legacy_field() -> None:
    with pytest.raises(LegacyFieldWriteForbiddenError) as exc_info:
        reception._airtable_json_request(
            "POST",
            reception.BOOKINGS_TABLE_ID,
            payload={
                "records": [
                    {"fields": CANONICAL_PAYLOAD},
                    {"fields": {"Legacy_Client_Text": "legacy client"}},
                ]
            },
        )

    assert exc_info.value.blocked_fields == ("Legacy_Client_Text",)
