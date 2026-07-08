from __future__ import annotations

from typing import Any, Mapping

from app.idempotency.commission_dry_run_adapter import (
    BOOKING_SEGMENTS_TABLE_ID,
    BOOKINGS_TABLE_ID,
    COMMISSION_LEDGER_TABLE_ID,
    COMMISSION_RULES_TABLE_ID,
    PAYMENTS_TABLE_ID,
    AirtableGetOnlyClient,
    CommissionAirtableDryRunAdapter,
)

LEDGER_ID = "rec6jIPq2rtWnFMe2"
BOOKING_ID = "recYEDkW7R7QnZja5"
PAYMENT_ID = "recG6wCfFz5lp5jSO"
RULE_ID = "recMfir7PJoeOmrUp"
TENANT_ID = "recZsr76UY2kclhMQ"
LOCATION_ID = "rec1qC31hFqbuLHZU"
THERAPIST_ID = "rec4UaeE7vHXWgJcV"
SERVICE_ID = "recAAAAAAAAAAAAAA"
SEGMENT_ID = "recBBBBBBBBBBBBBB"


class FakeReadOnlyClient:
    def __init__(self, records: dict[tuple[str, str], Mapping[str, Any]]) -> None:
        self.records = records
        self.calls: list[tuple[str, str, tuple[str, ...]]] = []

    def get_record(self, table_id: str, record_id: str, fields: tuple[str, ...]) -> Mapping[str, Any]:
        self.calls.append((table_id, record_id, fields))
        return self.records[(table_id, record_id)]


def _record(**fields: Any) -> dict[str, Any]:
    return {"fields": fields}


def _records(*, payment_environment: str = "Test", include_service: bool = False) -> dict[tuple[str, str], Mapping[str, Any]]:
    ledger_fields: dict[str, Any] = {
        "Commission Type": "Therapist",
        "Source Event": "Booking Completed",
        "Gross Source Amount EUR": 80,
        "Commission Amount EUR": 8,
        "Payout Status": "Pending",
        "Entry Date": "2026-06-20",
        "Environment": "Test",
        "Booking_Link": [BOOKING_ID],
        "Therapist_Link": [THERAPIST_ID],
        "Location_Link": [LOCATION_ID],
        "Payment_Link": [PAYMENT_ID],
        "Commission_Rule_Link": [RULE_ID],
        "Tenant_Link": [TENANT_ID],
    }
    booking_fields: dict[str, Any] = {
        "Tenant_Link": [TENANT_ID],
        "Location_Link": [LOCATION_ID],
        "Environment": "Test",
        "Therapist_Link": [THERAPIST_ID],
        "Status_New": "Confirmed",
        "Payment_Status_New": "Paid",
    }
    rule_fields: dict[str, Any] = {
        "Commission Target": "Therapist",
        "Trigger Event": "Booking Completed",
        "Calculation Type": "Percent",
        "Rate Percent": 0.1,
        "Active": True,
        "Location_Link": [LOCATION_ID],
        "Tenant_Link": [TENANT_ID],
    }
    if include_service:
        ledger_fields["Service_Link"] = [SERVICE_ID]
        booking_fields["Service_Link"] = [SERVICE_ID]
        rule_fields["Service_Link"] = [SERVICE_ID]

    return {
        (COMMISSION_LEDGER_TABLE_ID, LEDGER_ID): _record(**ledger_fields),
        (BOOKINGS_TABLE_ID, BOOKING_ID): _record(**booking_fields),
        (COMMISSION_RULES_TABLE_ID, RULE_ID): _record(**rule_fields),
        (PAYMENTS_TABLE_ID, PAYMENT_ID): _record(
            Booking_Link=[BOOKING_ID],
            Location_Link=[LOCATION_ID],
            Amount_EUR=80,
            Payment_Status_New="Paid",
            Payment_Date="2026-06-20",
            Environment=payment_environment,
            Tenant_Link=[TENANT_ID],
        ),
    }


def test_successful_read_only_adapter_builds_key_and_fingerprint():
    client = FakeReadOnlyClient(_records())
    result = CommissionAirtableDryRunAdapter(client).build_from_ledger_record(LEDGER_ID)

    assert result.phase == "111-C.1D"
    assert result.comparison_result == "NOT_EVALUATED"
    assert result.decision == "DRY_RUN_BUILT"
    assert result.mutation_type == "NOOP"
    assert result.dry_run is True
    assert result.errors == []
    assert result.idempotency_key == (
        f"COMMISSION:v1|tenant={TENANT_ID}|env=Test|sourceType=BOOKING|sourceId={BOOKING_ID}"
        f"|beneficiaryType=THERAPIST|beneficiaryId={THERAPIST_ID}"
        "|component=SERVICE_DELIVERY_BASE|event=BOOKING_COMPLETED"
    )
    assert result.input_fingerprint is not None
    assert result.input_fingerprint.startswith("sha256:")
    assert result.records_read == [LEDGER_ID, BOOKING_ID, RULE_ID, PAYMENT_ID]
    assert all(call[0] in {COMMISSION_LEDGER_TABLE_ID, BOOKINGS_TABLE_ID, COMMISSION_RULES_TABLE_ID, PAYMENTS_TABLE_ID} for call in client.calls)


def test_real_observed_pilot_payment_environment_mismatch_fails_closed():
    client = FakeReadOnlyClient(_records(payment_environment="Live"))
    result = CommissionAirtableDryRunAdapter(client).build_from_ledger_record(LEDGER_ID)

    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.decision == "ERROR"
    assert result.mutation_type == "NOOP"
    assert result.idempotency_key is None
    assert result.input_fingerprint is None
    assert result.errors[0]["code"] == "ADAPTER_CONTEXT_MISMATCH"
    assert result.errors[0]["field"] == "environment"
    assert "Payment mismatch" in result.errors[0]["detail"]


def test_missing_service_is_not_guessed_and_still_builds():
    client = FakeReadOnlyClient(_records(include_service=False))
    result = CommissionAirtableDryRunAdapter(client).build_from_ledger_record(LEDGER_ID)

    assert result.errors == []
    assert result.input_fingerprint is not None


def test_conflicting_service_ids_fail_closed():
    records = _records(include_service=True)
    booking = records[(BOOKINGS_TABLE_ID, BOOKING_ID)]
    booking["fields"]["Service_Link"] = ["recCCCCCCCCCCCCCC"]
    result = CommissionAirtableDryRunAdapter(FakeReadOnlyClient(records)).build_from_ledger_record(LEDGER_ID)

    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.errors[0]["code"] == "ADAPTER_CONTEXT_MISMATCH"
    assert result.errors[0]["field"] == "service_id"


def test_multiple_tenant_links_fail_closed():
    records = _records()
    records[(COMMISSION_LEDGER_TABLE_ID, LEDGER_ID)]["fields"]["Tenant_Link"] = [TENANT_ID, "recDDDDDDDDDDDDDD"]
    result = CommissionAirtableDryRunAdapter(FakeReadOnlyClient(records)).build_from_ledger_record(LEDGER_ID)

    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.errors[0]["code"] == "ADAPTER_LINK_CARDINALITY"
    assert result.errors[0]["field"] == "Tenant_Link"


def test_unsupported_event_has_no_component_guess():
    records = _records()
    records[(COMMISSION_LEDGER_TABLE_ID, LEDGER_ID)]["fields"]["Source Event"] = "Product Sold"
    result = CommissionAirtableDryRunAdapter(FakeReadOnlyClient(records)).build_from_ledger_record(LEDGER_ID)

    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.errors[0]["code"] == "ADAPTER_UNSUPPORTED_EVENT"
    assert result.errors[0]["field"] == "commission_component"


def test_rule_trigger_mismatch_fails_closed():
    records = _records()
    records[(COMMISSION_RULES_TABLE_ID, RULE_ID)]["fields"]["Trigger Event"] = "Package Sold"
    result = CommissionAirtableDryRunAdapter(FakeReadOnlyClient(records)).build_from_ledger_record(LEDGER_ID)

    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.errors[0]["code"] == "ADAPTER_CONTEXT_MISMATCH"
    assert result.errors[0]["field"] == "source_event"


def test_booking_therapist_mismatch_fails_closed():
    records = _records()
    records[(BOOKINGS_TABLE_ID, BOOKING_ID)]["fields"]["Therapist_Link"] = ["recEEEEEEEEEEEEEE"]
    result = CommissionAirtableDryRunAdapter(FakeReadOnlyClient(records)).build_from_ledger_record(LEDGER_ID)

    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.errors[0]["code"] == "ADAPTER_CONTEXT_MISMATCH"
    assert result.errors[0]["field"] == "therapist_id"


def test_inactive_rule_fails_closed():
    records = _records()
    records[(COMMISSION_RULES_TABLE_ID, RULE_ID)]["fields"]["Active"] = False
    result = CommissionAirtableDryRunAdapter(FakeReadOnlyClient(records)).build_from_ledger_record(LEDGER_ID)

    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.errors[0]["code"] == "ADAPTER_RULE_INACTIVE"


def test_segment_anchor_reads_segment_and_uses_segment_as_source_identity():
    records = _records(include_service=True)
    records[(COMMISSION_LEDGER_TABLE_ID, LEDGER_ID)]["fields"]["Booking_Segment_Link"] = [SEGMENT_ID]
    records[(BOOKING_SEGMENTS_TABLE_ID, SEGMENT_ID)] = _record(
        Booking_Link=[BOOKING_ID],
        Tenant_Link=[TENANT_ID],
        Location_Link=[LOCATION_ID],
        Environment="Test",
        Service_Link=[SERVICE_ID],
        Therapist_Link=[THERAPIST_ID],
        **{"Commission Eligible": True},
    )
    result = CommissionAirtableDryRunAdapter(FakeReadOnlyClient(records)).build_from_ledger_record(LEDGER_ID)

    assert result.errors == []
    assert f"sourceType=BOOKING_SEGMENT|sourceId={SEGMENT_ID}" in (result.idempotency_key or "")
    assert result.records_read == [LEDGER_ID, BOOKING_ID, RULE_ID, PAYMENT_ID, SEGMENT_ID]


def test_segment_not_commission_eligible_fails_closed():
    records = _records(include_service=True)
    records[(COMMISSION_LEDGER_TABLE_ID, LEDGER_ID)]["fields"]["Booking_Segment_Link"] = [SEGMENT_ID]
    records[(BOOKING_SEGMENTS_TABLE_ID, SEGMENT_ID)] = _record(
        Booking_Link=[BOOKING_ID],
        Tenant_Link=[TENANT_ID],
        Location_Link=[LOCATION_ID],
        Environment="Test",
        Service_Link=[SERVICE_ID],
        Therapist_Link=[THERAPIST_ID],
        **{"Commission Eligible": False},
    )
    result = CommissionAirtableDryRunAdapter(FakeReadOnlyClient(records)).build_from_ledger_record(LEDGER_ID)

    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.errors[0]["code"] == "ADAPTER_SEGMENT_NOT_ELIGIBLE"


def test_invalid_source_record_id_fails_closed_before_any_read():
    client = FakeReadOnlyClient(_records())
    result = CommissionAirtableDryRunAdapter(client).build_from_ledger_record("Booking-124")

    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.errors[0]["code"] == "ADAPTER_INVALID_RECORD_ID"
    assert client.calls == []


def test_runtime_airtable_client_has_no_write_methods():
    assert not hasattr(AirtableGetOnlyClient, "create_record")
    assert not hasattr(AirtableGetOnlyClient, "update_record")
    assert not hasattr(AirtableGetOnlyClient, "delete_record")
    assert not hasattr(AirtableGetOnlyClient, "request")
