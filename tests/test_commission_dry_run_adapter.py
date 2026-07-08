import pytest

from app.idempotency.commission_dry_run_adapter import (
    BOOKING_SEGMENTS_TABLE_ID,
    BOOKINGS_TABLE_ID,
    COMMISSION_RULES_TABLE_ID,
    CommissionDryRunAdapterError,
    CommissionDryRunRequest,
    build_commission_dry_run_from_airtable,
)

TENANT_ID = "recAAAAAAAAAAAAAA"
OTHER_TENANT_ID = "recBBBBBBBBBBBBBB"
LOCATION_ID = "recCCCCCCCCCCCCCC"
BOOKING_ID = "recDDDDDDDDDDDDDD"
RULE_ID = "recEEEEEEEEEEEEEE"
THERAPIST_ID = "recFFFFFFFFFFFFFF"
RECEPTION_ID = "recGGGGGGGGGGGGGG"
BOOKING_SERVICE_ID = "recHHHHHHHHHHHHHH"
SEGMENT_ID = "recIIIIIIIIIIIIII"
SEGMENT_SERVICE_ID = "recJJJJJJJJJJJJJJ"


class FakeReadOnlyReader:
    def __init__(self, payloads):
        self.payloads = payloads
        self.calls = []

    def get_record(self, *, table_id, record_id, fields):
        self.calls.append((table_id, record_id, tuple(fields)))
        return self.payloads[(table_id, record_id)]


def _booking(**overrides):
    fields = {
        "Tenant_Link": [TENANT_ID],
        "Location_Link": [LOCATION_ID],
        "Environment": "Test",
        "Therapist_Link": [THERAPIST_ID],
        "Reception_Staff_Link": [RECEPTION_ID],
        "Service_Link": [BOOKING_SERVICE_ID],
        "Status_New": "Completed",
        "Payment_Status_New": "Paid",
        "Payment Method": "Cash",
        "Total_Amount_EUR_New": 80,
        "Final Amount EUR": 80,
        "Start_DateTime": "2026-06-20T10:00:00.000Z",
    }
    fields.update(overrides)
    return {"id": BOOKING_ID, "fields": fields}


def _rule(**overrides):
    fields = {
        "Commission Target": "Therapist",
        "Trigger Event": "Booking Completed",
        "Calculation Type": "Percent",
        "Rate Percent": 0.10,
        "Fixed Amount EUR": None,
        "Active": True,
        "Service_Link": [BOOKING_SERVICE_ID],
        "Location_Link": [LOCATION_ID],
        "Tenant_Link": [TENANT_ID],
    }
    fields.update(overrides)
    return {"id": RULE_ID, "fields": fields}


def _segment(**overrides):
    fields = {
        "Tenant_Link": [TENANT_ID],
        "Location_Link": [LOCATION_ID],
        "Environment": "Test",
        "Booking_Link": [BOOKING_ID],
        "Service_Link": [SEGMENT_SERVICE_ID],
        "Therapist_Link": [THERAPIST_ID],
        "Segment Price EUR": 50,
        "Commission Eligible": True,
        "Segment Status": "Completed",
        "Start_DateTime": "2026-06-20T10:30:00.000Z",
    }
    fields.update(overrides)
    return {"id": SEGMENT_ID, "fields": fields}


def _reader(*, booking=None, rule=None, segment=None):
    payloads = {
        (BOOKINGS_TABLE_ID, BOOKING_ID): booking or _booking(),
        (COMMISSION_RULES_TABLE_ID, RULE_ID): rule or _rule(),
    }
    if segment is not None:
        payloads[(BOOKING_SEGMENTS_TABLE_ID, SEGMENT_ID)] = segment
    return FakeReadOnlyReader(payloads)


def test_booking_percent_dry_run_reads_only_booking_and_rule_and_returns_noop():
    reader = _reader()
    result = build_commission_dry_run_from_airtable(
        CommissionDryRunRequest(
            booking_record_id=BOOKING_ID,
            commission_rule_record_id=RULE_ID,
        ),
        reader=reader,
    )

    assert [call[0] for call in reader.calls] == [BOOKINGS_TABLE_ID, COMMISSION_RULES_TABLE_ID]
    assert result.source == "AIRTABLE_READ_ONLY"
    assert result.mutation_type == "NOOP"
    assert result.dry_run is True
    assert result.builder_result["comparison_result"] == "NOT_EVALUATED"
    assert result.builder_result["decision"] == "DRY_RUN_BUILT"
    assert result.builder_result["mutation_type"] == "NOOP"
    assert result.builder_result["dry_run"] is True
    assert result.builder_result["idempotency_key"].startswith("COMMISSION:v1|")
    assert result.builder_result["input_fingerprint"].startswith("sha256:")


def test_percent_rule_calculates_expected_fingerprint_state_without_write_intent():
    reader = _reader()
    result = build_commission_dry_run_from_airtable(
        CommissionDryRunRequest(BOOKING_ID, RULE_ID),
        reader=reader,
    )

    assert result.builder_result["errors"] == []
    assert result.mutation_type == "NOOP"
    assert len(result.builder_result["input_fingerprint"]) == len("sha256:") + 64


def test_fixed_amount_rule_is_supported_and_stays_noop():
    reader = _reader(
        rule=_rule(
            **{
                "Calculation Type": "Fixed Amount",
                "Rate Percent": None,
                "Fixed Amount EUR": 7.5,
            }
        )
    )
    result = build_commission_dry_run_from_airtable(
        CommissionDryRunRequest(BOOKING_ID, RULE_ID),
        reader=reader,
    )

    assert result.builder_result["decision"] == "DRY_RUN_BUILT"
    assert result.mutation_type == "NOOP"


def test_reception_target_uses_reception_beneficiary_identity():
    reader = _reader(rule=_rule(**{"Commission Target": "Reception"}))
    result = build_commission_dry_run_from_airtable(
        CommissionDryRunRequest(BOOKING_ID, RULE_ID),
        reader=reader,
    )

    key = result.builder_result["idempotency_key"]
    assert "beneficiaryType=RECEPTION_STAFF" in key
    assert f"beneficiaryId={RECEPTION_ID}" in key
    assert "component=RECEPTION_SALE" in key


def test_segment_mode_reads_exact_third_table_and_uses_segment_anchor():
    reader = _reader(
        rule=_rule(**{"Service_Link": [SEGMENT_SERVICE_ID]}),
        segment=_segment(),
    )
    result = build_commission_dry_run_from_airtable(
        CommissionDryRunRequest(BOOKING_ID, RULE_ID, SEGMENT_ID),
        reader=reader,
    )

    assert [call[0] for call in reader.calls] == [
        BOOKINGS_TABLE_ID,
        COMMISSION_RULES_TABLE_ID,
        BOOKING_SEGMENTS_TABLE_ID,
    ]
    key = result.builder_result["idempotency_key"]
    assert "sourceType=BOOKING_SEGMENT" in key
    assert f"sourceId={SEGMENT_ID}" in key
    assert result.mutation_type == "NOOP"


def test_segment_service_may_differ_from_parent_booking_service():
    reader = _reader(
        rule=_rule(**{"Service_Link": [SEGMENT_SERVICE_ID]}),
        segment=_segment(),
    )
    result = build_commission_dry_run_from_airtable(
        CommissionDryRunRequest(BOOKING_ID, RULE_ID, SEGMENT_ID),
        reader=reader,
    )

    assert result.builder_result["errors"] == []
    assert result.builder_result["decision"] == "DRY_RUN_BUILT"


def test_segment_rule_service_mismatch_fails_closed():
    reader = _reader(rule=_rule(), segment=_segment())

    with pytest.raises(CommissionDryRunAdapterError) as exc_info:
        build_commission_dry_run_from_airtable(
            CommissionDryRunRequest(BOOKING_ID, RULE_ID, SEGMENT_ID),
            reader=reader,
        )

    assert exc_info.value.code == "ADAPTER_CONTEXT_MISMATCH"
    assert exc_info.value.field == "Service_Link"


def test_segment_must_be_explicitly_commission_eligible():
    reader = _reader(
        rule=_rule(**{"Service_Link": [SEGMENT_SERVICE_ID]}),
        segment=_segment(**{"Commission Eligible": False}),
    )

    with pytest.raises(CommissionDryRunAdapterError) as exc_info:
        build_commission_dry_run_from_airtable(
            CommissionDryRunRequest(BOOKING_ID, RULE_ID, SEGMENT_ID),
            reader=reader,
        )

    assert exc_info.value.code == "ADAPTER_SEGMENT_NOT_COMMISSION_ELIGIBLE"


def test_tenant_mismatch_fails_closed_before_builder():
    reader = _reader(rule=_rule(**{"Tenant_Link": [OTHER_TENANT_ID]}))

    with pytest.raises(CommissionDryRunAdapterError) as exc_info:
        build_commission_dry_run_from_airtable(
            CommissionDryRunRequest(BOOKING_ID, RULE_ID),
            reader=reader,
        )

    assert exc_info.value.code == "ADAPTER_CONTEXT_MISMATCH"
    assert exc_info.value.field == "Tenant_Link"


def test_inactive_rule_fails_closed():
    reader = _reader(rule=_rule(**{"Active": False}))

    with pytest.raises(CommissionDryRunAdapterError) as exc_info:
        build_commission_dry_run_from_airtable(
            CommissionDryRunRequest(BOOKING_ID, RULE_ID),
            reader=reader,
        )

    assert exc_info.value.code == "ADAPTER_RULE_NOT_ACTIVE"


def test_tiered_rule_is_not_silently_guessed():
    reader = _reader(rule=_rule(**{"Calculation Type": "Tiered"}))

    with pytest.raises(CommissionDryRunAdapterError) as exc_info:
        build_commission_dry_run_from_airtable(
            CommissionDryRunRequest(BOOKING_ID, RULE_ID),
            reader=reader,
        )

    assert exc_info.value.code == "ADAPTER_UNSUPPORTED_CALCULATION_TYPE"


def test_manager_target_is_not_silently_mapped():
    reader = _reader(rule=_rule(**{"Commission Target": "Manager"}))

    with pytest.raises(CommissionDryRunAdapterError) as exc_info:
        build_commission_dry_run_from_airtable(
            CommissionDryRunRequest(BOOKING_ID, RULE_ID),
            reader=reader,
        )

    assert exc_info.value.code == "ADAPTER_UNSUPPORTED_COMMISSION_TARGET"


def test_multiple_tenants_fail_cardinality_closed():
    reader = _reader(booking=_booking(**{"Tenant_Link": [TENANT_ID, OTHER_TENANT_ID]}))

    with pytest.raises(CommissionDryRunAdapterError) as exc_info:
        build_commission_dry_run_from_airtable(
            CommissionDryRunRequest(BOOKING_ID, RULE_ID),
            reader=reader,
        )

    assert exc_info.value.code == "ADAPTER_CARDINALITY_ERROR"
    assert exc_info.value.field == "Tenant_Link"


def test_adapter_never_reads_commission_ledger_or_automation_runs():
    reader = _reader()
    result = build_commission_dry_run_from_airtable(
        CommissionDryRunRequest(BOOKING_ID, RULE_ID),
        reader=reader,
    )

    read_table_ids = {call[0] for call in reader.calls}
    assert read_table_ids == {BOOKINGS_TABLE_ID, COMMISSION_RULES_TABLE_ID}
    assert "tbliz2cnvA3cyVaLd" not in read_table_ids
    assert "tblZfL6UuOfxz3On1" not in read_table_ids
    assert result.read_tables == [BOOKINGS_TABLE_ID, COMMISSION_RULES_TABLE_ID]
    assert result.mutation_type == "NOOP"
