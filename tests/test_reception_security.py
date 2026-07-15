from __future__ import annotations

from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from app.api.v1.endpoints import reception
from app.main import app

client = TestClient(app)
BASE_URL = "/api/v1/reception/bookings"
BOOKING_ID = "recTestBooking"
VALID_TOKEN = "test-reception-token"
TENANT_ID = "recTenantSantis"
LOCATION_ID = "recLocationBudva"


def _auth_header(token: str = VALID_TOKEN) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "X-Request-ID": "test-request-001"}


def _booking_fields(
    *,
    tenant_ids: list[str] | None = None,
    location_ids: list[str] | None = None,
) -> dict[str, object]:
    fields: dict[str, object] = {
        "Booking ID": 240,
        "Tenant_Link": [TENANT_ID] if tenant_ids is None else tenant_ids,
        "Location_Link": [LOCATION_ID] if location_ids is None else location_ids,
        "Environment": "Test",
        "Payment_Status_New": "Paid",
        "Balance_Due_EUR": 0,
        "Total Paid EUR": 100,
    }
    return {"id": BOOKING_ID, "fields": fields}


@pytest.fixture(autouse=True)
def reception_security_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("SANTIS_RECEPTION_WRITE_TOKEN", VALID_TOKEN)
    monkeypatch.setenv("SANTIS_RECEPTION_ACTOR_ID", "test-reception-service")
    monkeypatch.setenv("SANTIS_RECEPTION_ROLE", "reception")
    monkeypatch.setenv("SANTIS_RECEPTION_TENANT_ID", TENANT_ID)
    monkeypatch.setenv("SANTIS_RECEPTION_ALLOWED_LOCATION_IDS", LOCATION_ID)
    monkeypatch.delenv("SANTIS_RECEPTION_CAN_FORCE_LIVE", raising=False)
    monkeypatch.delenv("SANTIS_RECEPTION_CAN_OVERRIDE_UNPAID", raising=False)


def test_complete_booking_requires_auth():
    response = client.post(f"{BASE_URL}/{BOOKING_ID}/complete-with-commission", json={})

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_complete_booking_rejects_invalid_token():
    response = client.post(
        f"{BASE_URL}/{BOOKING_ID}/complete-with-commission",
        headers=_auth_header("invalid-token"),
        json={},
    )

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_complete_booking_fails_closed_when_auth_not_configured(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("SANTIS_RECEPTION_WRITE_TOKEN")

    response = client.post(
        f"{BASE_URL}/{BOOKING_ID}/complete-with-commission",
        headers=_auth_header(),
        json={},
    )

    assert response.status_code == 503


def test_complete_booking_rejects_force_live_without_permission(monkeypatch: pytest.MonkeyPatch):
    get_record = Mock()
    complete = Mock()
    monkeypatch.setattr(reception, "_airtable_get_record", get_record)
    monkeypatch.setattr(reception, "complete_booking_with_commission", complete)

    response = client.post(
        f"{BASE_URL}/{BOOKING_ID}/complete-with-commission",
        headers=_auth_header(),
        json={"forceLive": True},
    )

    assert response.status_code == 403
    get_record.assert_not_called()
    complete.assert_not_called()


def test_complete_booking_rejects_unpaid_override_without_permission(monkeypatch: pytest.MonkeyPatch):
    get_record = Mock()
    complete = Mock()
    monkeypatch.setattr(reception, "_airtable_get_record", get_record)
    monkeypatch.setattr(reception, "complete_booking_with_commission", complete)

    response = client.post(
        f"{BASE_URL}/{BOOKING_ID}/complete-with-commission",
        headers=_auth_header(),
        json={"allowUnpaid": True},
    )

    assert response.status_code == 403
    get_record.assert_not_called()
    complete.assert_not_called()


def test_complete_booking_rejects_wrong_tenant(monkeypatch: pytest.MonkeyPatch):
    get_record = Mock(return_value=_booking_fields(tenant_ids=["recOtherTenant"]))
    complete = Mock()
    monkeypatch.setattr(reception, "_airtable_get_record", get_record)
    monkeypatch.setattr(reception, "complete_booking_with_commission", complete)

    response = client.post(
        f"{BASE_URL}/{BOOKING_ID}/complete-with-commission",
        headers=_auth_header(),
        json={"dryRun": True},
    )

    assert response.status_code == 404
    complete.assert_not_called()


def test_complete_booking_rejects_wrong_location(monkeypatch: pytest.MonkeyPatch):
    get_record = Mock(return_value=_booking_fields(location_ids=["recLocationPodgorica"]))
    complete = Mock()
    monkeypatch.setattr(reception, "_airtable_get_record", get_record)
    monkeypatch.setattr(reception, "complete_booking_with_commission", complete)

    response = client.post(
        f"{BASE_URL}/{BOOKING_ID}/complete-with-commission",
        headers=_auth_header(),
        json={"dryRun": True},
    )

    assert response.status_code == 404
    complete.assert_not_called()


@pytest.mark.parametrize(
    ("tenant_ids", "location_ids"),
    [([], [LOCATION_ID]), ([TENANT_ID], [])],
)
def test_complete_booking_rejects_missing_actor_context_on_booking(
    monkeypatch: pytest.MonkeyPatch,
    tenant_ids: list[str],
    location_ids: list[str],
):
    get_record = Mock(return_value=_booking_fields(tenant_ids=tenant_ids, location_ids=location_ids))
    complete = Mock()
    monkeypatch.setattr(reception, "_airtable_get_record", get_record)
    monkeypatch.setattr(reception, "complete_booking_with_commission", complete)

    response = client.post(
        f"{BASE_URL}/{BOOKING_ID}/complete-with-commission",
        headers=_auth_header(),
        json={"dryRun": True},
    )

    assert response.status_code == 404
    complete.assert_not_called()


def test_complete_booking_allows_authorized_dry_run(monkeypatch: pytest.MonkeyPatch):
    get_record = Mock(return_value=_booking_fields())
    complete = Mock(
        return_value={
            "ok": True,
            "dryRun": True,
            "commissionCreated": False,
            "bookingRecordId": BOOKING_ID,
        }
    )
    monkeypatch.setattr(reception, "_airtable_get_record", get_record)
    monkeypatch.setattr(reception, "complete_booking_with_commission", complete)

    response = client.post(
        f"{BASE_URL}/{BOOKING_ID}/complete-with-commission",
        headers=_auth_header(),
        json={"dryRun": True},
    )

    assert response.status_code == 200
    assert response.json()["dryRun"] is True
    complete.assert_called_once()
