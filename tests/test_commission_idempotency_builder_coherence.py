from app.idempotency.commission_builder import (
    CommissionIdentityInput,
    build_commission_dry_run,
)

TENANT_ID = "recAAAAAAAAAAAAAA"
OTHER_TENANT_ID = "recBBBBBBBBBBBBBB"
LOCATION_ID = "recCCCCCCCCCCCCCC"
BOOKING_ID = "recDDDDDDDDDDDDDD"
THERAPIST_ID = "recEEEEEEEEEEEEEE"


def _identity(**overrides):
    values = {
        "tenant_id": TENANT_ID,
        "environment": "Test",
        "source_anchor_type": "BOOKING",
        "source_anchor_id": BOOKING_ID,
        "beneficiary_type": "THERAPIST",
        "beneficiary_id": THERAPIST_ID,
        "commission_component": "SERVICE_DELIVERY_BASE",
        "source_event": "BOOKING_COMPLETED",
    }
    values.update(overrides)
    return CommissionIdentityInput(**values)


def _state(**overrides):
    values = {
        "tenant_id": TENANT_ID,
        "environment": "Test",
        "location_id": LOCATION_ID,
        "source_anchor_type": "BOOKING",
        "source_anchor_id": BOOKING_ID,
        "booking_id": BOOKING_ID,
        "booking_segment_id": None,
        "payment_id": None,
        "beneficiary_type": "THERAPIST",
        "beneficiary_id": THERAPIST_ID,
        "service_id": None,
        "commission_rule_id": None,
        "source_event": "BOOKING_COMPLETED",
        "commission_component": "SERVICE_DELIVERY_BASE",
        "gross_source_amount": "80.00",
        "commission_rate": "0.100000",
        "fixed_amount": "0.00",
        "commission_type": "Therapist",
        "calculated_commission_amount": "8.00",
        "booking_status": "Completed",
        "payment_status": "Paid",
        "payout_status": "Pending",
        "event_date": "2026-06-20",
        "rule_version": "1",
        "manual_override_flag": False,
    }
    values.update(overrides)
    return values


def test_dry_run_fails_closed_when_key_and_state_environment_disagree():
    result = build_commission_dry_run(_identity(environment="Test"), _state(environment="Live"))

    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.decision == "ERROR"
    assert result.mutation_type == "NOOP"
    assert result.errors[0]["code"] == "IDEMPOTENCY_STATE_IDENTITY_MISMATCH"
    assert result.errors[0]["field"] == "environment"


def test_dry_run_fails_closed_when_key_and_state_tenant_disagree():
    result = build_commission_dry_run(_identity(), _state(tenant_id=OTHER_TENANT_ID))

    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.mutation_type == "NOOP"
    assert result.errors[0]["code"] == "IDEMPOTENCY_STATE_IDENTITY_MISMATCH"
    assert result.errors[0]["field"] == "tenant_id"


def test_dry_run_fails_closed_when_state_identity_context_is_missing():
    result = build_commission_dry_run(_identity(), _state(source_anchor_id=None))

    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.decision == "ERROR"
    assert result.mutation_type == "NOOP"
    assert result.errors[0]["code"] == "IDEMPOTENCY_STATE_IDENTITY_INCOMPLETE"
    assert result.errors[0]["field"] == "source_anchor_id"
