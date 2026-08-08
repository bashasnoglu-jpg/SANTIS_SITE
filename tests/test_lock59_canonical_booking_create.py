import pytest
from fastapi import HTTPException

from app.api.v1.endpoints import reception_booking_create as lock59

CONFIG_ID = "recAAAAAAAAAAAAAA"
TENANT_ID = "recBBBBBBBBBBBBBB"
LOCATION_ID = "recCCCCCCCCCCCCCC"
CLIENT_ID = "recDDDDDDDDDDDDDD"
SERVICE_ID = "recEEEEEEEEEEEEEE"
THERAPIST_ID = "recFFFFFFFFFFFFFF"
ROOM_ID = "recGGGGGGGGGGGGGG"
WRONG_LOCATION_ID = "recHHHHHHHHHHHHHH"
WRONG_TENANT_ID = "recIIIIIIIIIIIIII"


def _records(*, environment="Test", therapist_location=LOCATION_ID, booking_create_enabled=True):
    return {
        (lock59.BRANCH_CONFIG_TABLE_ID, CONFIG_ID): {
            "id": CONFIG_ID,
            "fields": {
                "Board Name": "Budva LOCK-59 Test",
                "Branch Code": "BUDVA",
                "Tenant_Link": [TENANT_ID],
                "Location_Link": [LOCATION_ID],
                "Environment": environment,
                "Board Status": "Ready for Test" if environment == "Test" else "Active",
                "QA Status": "Ready for Test" if environment == "Test" else "QA PASS",
                "Booking_Create_Enabled": booking_create_enabled,
            },
        },
        (lock59.THERAPISTS_TABLE_ID, THERAPIST_ID): {
            "id": THERAPIST_ID,
            "fields": {
                "Name": "Test Therapist",
                "Tenant_Link": [TENANT_ID],
                "Location_Link": [therapist_location],
                "Environment": environment,
                "Active": True,
                "Status": "Active",
            },
        },
        (lock59.ROOMS_TABLE_ID, ROOM_ID): {
            "id": ROOM_ID,
            "fields": {
                "Name": "Test Room",
                "Tenant_Link": [TENANT_ID],
                "Location_Link": [LOCATION_ID],
                "Environment": environment,
                "Room_Status": "Available",
                "Status": "Active",
            },
        },
        (lock59.SERVICES_TABLE_ID, SERVICE_ID): {
            "id": SERVICE_ID,
            "fields": {
                "Name": "Test Service",
                "Tenant_Link": [TENANT_ID],
                "Location_Link": [LOCATION_ID],
                "Environment": environment,
                "Active": True,
                "Status": "Active",
            },
        },
        (lock59.CLIENTS_TABLE_ID, CLIENT_ID): {
            "id": CLIENT_ID,
            "fields": {
                "Full Name": "Test Client",
                "Tenant_Link": [TENANT_ID],
                "Environment": environment,
                "Status": "Active",
            },
        },
    }


def _install_fake_airtable(monkeypatch, records):
    def fake_get_record(table_id, record_id, fields):
        del fields
        return records[(table_id, record_id)]

    monkeypatch.setattr(lock59, "_airtable_get_record", fake_get_record)


def _payload(**overrides):
    values = {
        "branchConfigId": CONFIG_ID,
        "clientId": CLIENT_ID,
        "serviceId": SERVICE_ID,
        "therapistId": THERAPIST_ID,
        "roomId": ROOM_ID,
        "startDateTime": "2026-07-08T10:30:00+02:00",
        "status": "Draft",
        "dryRun": True,
    }
    values.update(overrides)
    return lock59.CanonicalBookingCreateRequest(**values)


def test_dry_run_writes_canonical_links_and_only_owned_branch_guard(monkeypatch):
    _install_fake_airtable(monkeypatch, _records())

    result = lock59.create_canonical_booking(_payload())
    fields = result["wouldCreateFields"]

    assert result["ok"] is True
    assert result["dryRun"] is True
    assert result["bookingCreated"] is False
    assert fields["Tenant_Link"] == [TENANT_ID]
    assert fields["Location_Link"] == [LOCATION_ID]
    assert fields["Therapist_Link"] == [THERAPIST_ID]
    assert fields["Room_Link"] == [ROOM_ID]
    assert fields["Branch_Config_Link"] == [CONFIG_ID]
    assert fields["Environment"] == "Test"
    assert fields["Branch_Guard_Status"] == "PASS"
    assert fields["Branch_Guard_Reason"].startswith("PASS - Canonical tenant/location/environment")
    assert fields["Guard_Checked_At"]
    assert result["evidence"]["branchGuard"]["status"] == "PASS"
    assert result["evidence"]["legacySelectorFieldsWritten"] == []
    assert not any("_Therapist_Select" in key or "_Room_Select" in key for key in fields)
    assert "Booking_Conflict_Status" not in fields
    assert "Therapist_Capability_Status" not in fields
    assert "Room_Capability_Status" not in fields
    assert "Quarantine_Status" not in fields


def test_wrong_branch_therapist_is_blocked_before_booking_write(monkeypatch):
    _install_fake_airtable(monkeypatch, _records(therapist_location=WRONG_LOCATION_ID))

    with pytest.raises(HTTPException) as exc_info:
        lock59.create_canonical_booking(_payload())

    assert exc_info.value.status_code == 409
    assert "Therapist location mismatch" in exc_info.value.detail


def test_wrong_branch_room_is_blocked_before_booking_write(monkeypatch):
    records = _records()
    records[(lock59.ROOMS_TABLE_ID, ROOM_ID)]["fields"]["Location_Link"] = [WRONG_LOCATION_ID]
    _install_fake_airtable(monkeypatch, records)

    with pytest.raises(HTTPException) as exc_info:
        lock59.create_canonical_booking(_payload())

    assert exc_info.value.status_code == 409
    assert "Room location mismatch" in exc_info.value.detail


def test_wrong_branch_service_is_blocked_before_booking_write(monkeypatch):
    records = _records()
    records[(lock59.SERVICES_TABLE_ID, SERVICE_ID)]["fields"]["Location_Link"] = [WRONG_LOCATION_ID]
    _install_fake_airtable(monkeypatch, records)

    with pytest.raises(HTTPException) as exc_info:
        lock59.create_canonical_booking(_payload())

    assert exc_info.value.status_code == 409
    assert "Service location mismatch" in exc_info.value.detail


def test_service_environment_leak_is_blocked_before_booking_write(monkeypatch):
    records = _records()
    records[(lock59.SERVICES_TABLE_ID, SERVICE_ID)]["fields"]["Environment"] = "Live"
    _install_fake_airtable(monkeypatch, records)

    with pytest.raises(HTTPException) as exc_info:
        lock59.create_canonical_booking(_payload())

    assert exc_info.value.status_code == 409
    assert "Service environment mismatch" in exc_info.value.detail


def test_wrong_tenant_resource_is_blocked(monkeypatch):
    records = _records()
    records[(lock59.THERAPISTS_TABLE_ID, THERAPIST_ID)]["fields"]["Tenant_Link"] = [WRONG_TENANT_ID]
    _install_fake_airtable(monkeypatch, records)

    with pytest.raises(HTTPException) as exc_info:
        lock59.create_canonical_booking(_payload())

    assert exc_info.value.status_code == 409
    assert "Therapist tenant mismatch" in exc_info.value.detail


def test_environment_leak_is_blocked(monkeypatch):
    records = _records()
    records[(lock59.ROOMS_TABLE_ID, ROOM_ID)]["fields"]["Environment"] = "Live"
    _install_fake_airtable(monkeypatch, records)

    with pytest.raises(HTTPException) as exc_info:
        lock59.create_canonical_booking(_payload())

    assert exc_info.value.status_code == 409
    assert "Room environment mismatch" in exc_info.value.detail


def test_config_rejects_multiple_canonical_locations(monkeypatch):
    records = _records()
    records[(lock59.BRANCH_CONFIG_TABLE_ID, CONFIG_ID)]["fields"]["Location_Link"] = [
        LOCATION_ID,
        WRONG_LOCATION_ID,
    ]
    _install_fake_airtable(monkeypatch, records)

    with pytest.raises(HTTPException) as exc_info:
        lock59.create_canonical_booking(_payload())

    assert exc_info.value.status_code == 409
    assert "must contain exactly one canonical record link" in exc_info.value.detail


def test_real_write_is_disabled_by_default_even_after_preflight(monkeypatch):
    _install_fake_airtable(monkeypatch, _records())
    monkeypatch.delenv(lock59.CANONICAL_CREATE_ENABLE_ENV, raising=False)

    created = []

    def fake_create_record(table_id, fields):
        created.append((table_id, fields))
        return {"id": "recZZZZZZZZZZZZZZ"}

    monkeypatch.setattr(lock59, "_airtable_create_record", fake_create_record)

    with pytest.raises(HTTPException) as exc_info:
        lock59.create_canonical_booking(_payload(dryRun=False))

    assert exc_info.value.status_code == 409
    assert lock59.CANONICAL_CREATE_ENABLE_ENV in exc_info.value.detail
    assert created == []


def test_disabled_branch_config_blocks_real_write(monkeypatch):
    _install_fake_airtable(monkeypatch, _records(booking_create_enabled=False))
    monkeypatch.setenv(lock59.CANONICAL_CREATE_ENABLE_ENV, "true")

    created = []

    def fake_create_record(table_id, fields):
        created.append((table_id, fields))
        return {"id": "recZZZZZZZZZZZZZZ"}

    monkeypatch.setattr(lock59, "_airtable_create_record", fake_create_record)

    with pytest.raises(HTTPException) as exc_info:
        lock59.create_canonical_booking(_payload(dryRun=False))

    assert exc_info.value.status_code == 409
    assert "Booking_Create_Enabled is false" in exc_info.value.detail
    assert created == []


def test_live_write_needs_separate_force_and_live_enable_gate(monkeypatch):
    _install_fake_airtable(monkeypatch, _records(environment="Live"))
    monkeypatch.setenv(lock59.CANONICAL_CREATE_ENABLE_ENV, "true")
    monkeypatch.delenv(lock59.LIVE_CREATE_ENABLE_ENV, raising=False)

    with pytest.raises(HTTPException) as exc_info:
        lock59.create_canonical_booking(_payload(dryRun=False, forceLive=False))

    assert exc_info.value.status_code == 409
    assert "forceLive=true" in exc_info.value.detail
