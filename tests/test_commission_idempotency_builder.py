import pytest

from app.idempotency.commission_builder import (
    CONTRACT_VERSION,
    CommissionIdentityError,
    CommissionIdentityInput,
    build_commission_dry_run,
    build_commission_idempotency_key,
    build_input_fingerprint,
    normalize_commission_state,
    stable_json,
)

TENANT_ID = "recAAAAAAAAAAAAAA"
LOCATION_ID = "recBBBBBBBBBBBBBB"
BOOKING_ID = "recCCCCCCCCCCCCCC"
SEGMENT_ID = "recDDDDDDDDDDDDDD"
THERAPIST_ID = "recEEEEEEEEEEEEEE"
OTHER_THERAPIST_ID = "recFFFFFFFFFFFFFF"
SERVICE_ID = "recGGGGGGGGGGGGGG"
OTHER_SERVICE_ID = "recHHHHHHHHHHHHHH"
RULE_ID = "recIIIIIIIIIIIIII"
OTHER_RULE_ID = "recJJJJJJJJJJJJJJ"


def _identity(**overrides):
    values = {
        "tenant_id": TENANT_ID,
        "environment": "Test",
        "source_anchor_type": "BOOKING",
        "source_anchor_id": BOOKING_ID,
        "beneficiary_type": "THERAPIST",
        "beneficiary_id": THERAPIST_ID,
        "commission_component": "SERVICE_DELIVERY_BASE",
        "source_event": "Booking Completed",
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
        "service_id": SERVICE_ID,
        "commission_rule_id": RULE_ID,
        "source_event": "Booking Completed",
        "commission_component": "SERVICE_DELIVERY_BASE",
        "gross_source_amount": "80",
        "commission_rate": "0.10",
        "fixed_amount": "0",
        "commission_type": "Therapist",
        "calculated_commission_amount": "8",
        "booking_status": "Completed",
        "payment_status": "Paid",
        "payout_status": "Pending",
        "event_date": "2026-06-20",
        "rule_version": "1",
        "manual_override_flag": False,
    }
    values.update(overrides)
    return values


def test_exact_replay_produces_same_key_and_fingerprint():
    identity = _identity()
    state = _state()

    assert build_commission_idempotency_key(identity) == build_commission_idempotency_key(identity)
    assert build_input_fingerprint(state) == build_input_fingerprint(state)


def test_rate_override_keeps_key_but_changes_fingerprint():
    identity = _identity()
    key_before = build_commission_idempotency_key(identity)
    key_after = build_commission_idempotency_key(identity)

    fingerprint_before = build_input_fingerprint(_state(commission_rate="0.10"))
    fingerprint_after = build_input_fingerprint(_state(commission_rate="0.15"))

    assert key_before == key_after
    assert fingerprint_before != fingerprint_after


def test_amount_correction_keeps_key_but_changes_fingerprint():
    identity = _identity()

    assert build_commission_idempotency_key(identity) == build_commission_idempotency_key(identity)
    assert build_input_fingerprint(_state(calculated_commission_amount="8.00")) != build_input_fingerprint(
        _state(calculated_commission_amount="10.00")
    )


def test_rule_change_keeps_key_but_changes_fingerprint():
    identity = _identity()

    assert build_commission_idempotency_key(identity) == build_commission_idempotency_key(identity)
    assert build_input_fingerprint(_state(commission_rule_id=RULE_ID)) != build_input_fingerprint(
        _state(commission_rule_id=OTHER_RULE_ID)
    )


def test_service_change_keeps_key_but_changes_fingerprint():
    identity = _identity()

    assert build_commission_idempotency_key(identity) == build_commission_idempotency_key(identity)
    assert build_input_fingerprint(_state(service_id=SERVICE_ID)) != build_input_fingerprint(
        _state(service_id=OTHER_SERVICE_ID)
    )


def test_different_beneficiary_changes_key():
    assert build_commission_idempotency_key(_identity(beneficiary_id=THERAPIST_ID)) != build_commission_idempotency_key(
        _identity(beneficiary_id=OTHER_THERAPIST_ID)
    )


def test_environment_isolation_changes_key_and_fingerprint():
    assert build_commission_idempotency_key(_identity(environment="Test")) != build_commission_idempotency_key(
        _identity(environment="Live")
    )
    assert build_input_fingerprint(_state(environment="Test")) != build_input_fingerprint(_state(environment="Live"))


def test_component_change_changes_key():
    assert build_commission_idempotency_key(
        _identity(commission_component="SERVICE_DELIVERY_BASE")
    ) != build_commission_idempotency_key(_identity(commission_component="UPSELL_BONUS"))


def test_json_order_does_not_change_fingerprint():
    state = _state()
    reversed_state = dict(reversed(list(state.items())))

    assert build_input_fingerprint(state) == build_input_fingerprint(reversed_state)


def test_display_name_change_does_not_change_fingerprint():
    before = _state(beneficiary_display_name="ARZU")
    after = _state(beneficiary_display_name="Arzu Yılmaz")

    assert build_input_fingerprint(before) == build_input_fingerprint(after)


def test_currency_and_rate_normalization_are_field_aware():
    normalized = normalize_commission_state(
        _state(
            gross_source_amount="80",
            fixed_amount="0.0",
            calculated_commission_amount="8.000",
            commission_rate="0.1",
        )
    )

    assert normalized["gross_source_amount"] == "80.00"
    assert normalized["fixed_amount"] == "0.00"
    assert normalized["calculated_commission_amount"] == "8.00"
    assert normalized["commission_rate"] == "0.100000"


def test_equivalent_decimal_formats_produce_same_fingerprint():
    assert build_input_fingerprint(_state(calculated_commission_amount="8")) == build_input_fingerprint(
        _state(calculated_commission_amount="8.00")
    )
    assert build_input_fingerprint(_state(commission_rate="0.1")) == build_input_fingerprint(
        _state(commission_rate="0.100000")
    )


def test_unambiguous_slash_date_normalizes_to_iso():
    assert build_input_fingerprint(_state(event_date="20/06/2026")) == build_input_fingerprint(
        _state(event_date="2026-06-20")
    )


def test_ambiguous_slash_date_fails_closed():
    with pytest.raises(CommissionIdentityError) as exc_info:
        build_input_fingerprint(_state(event_date="06/07/2026"))

    assert exc_info.value.code == "IDEMPOTENCY_AMBIGUOUS_DATE"
    assert exc_info.value.field == "event_date"


def test_missing_required_identity_fails_closed():
    with pytest.raises(CommissionIdentityError) as exc_info:
        build_commission_idempotency_key(_identity(tenant_id=""))

    assert exc_info.value.code == "IDEMPOTENCY_IDENTITY_INCOMPLETE"
    assert exc_info.value.field == "tenant_id"


def test_display_name_is_not_accepted_as_record_id_fallback():
    with pytest.raises(CommissionIdentityError) as exc_info:
        build_commission_idempotency_key(_identity(beneficiary_id="ARZU"))

    assert exc_info.value.code == "IDEMPOTENCY_INVALID_RECORD_ID"
    assert exc_info.value.field == "beneficiary_id"


def test_unknown_calculation_field_fails_closed():
    with pytest.raises(CommissionIdentityError) as exc_info:
        build_input_fingerprint(_state(untracked_future_parameter="surprise"))

    assert exc_info.value.code == "IDEMPOTENCY_UNKNOWN_CALCULATION_FIELD"
    assert exc_info.value.field == "untracked_future_parameter"


def test_dry_run_is_builder_only_noop_and_not_evaluated():
    result = build_commission_dry_run(_identity(), _state())

    assert result.contract_version == CONTRACT_VERSION
    assert result.idempotency_key is not None
    assert result.input_fingerprint is not None
    assert result.input_fingerprint.startswith("sha256:")
    assert len(result.input_fingerprint) == len("sha256:") + 64
    assert result.comparison_result == "NOT_EVALUATED"
    assert result.decision == "DRY_RUN_BUILT"
    assert result.mutation_type == "NOOP"
    assert result.dry_run is True
    assert result.errors == []


def test_dry_run_returns_structured_fail_closed_error_without_mutation_intent():
    result = build_commission_dry_run(_identity(source_anchor_id=""), _state())

    assert result.idempotency_key is None
    assert result.input_fingerprint is None
    assert result.comparison_result == "ERROR_FAIL_CLOSED"
    assert result.decision == "ERROR"
    assert result.mutation_type == "NOOP"
    assert result.dry_run is True
    assert result.errors[0]["code"] == "IDEMPOTENCY_IDENTITY_INCOMPLETE"
    assert result.errors[0]["field"] == "source_anchor_id"


def test_key_does_not_contain_mutable_calculation_fields():
    key = build_commission_idempotency_key(_identity())

    assert "8.00" not in key
    assert "0.100000" not in key
    assert RULE_ID not in key
    assert SERVICE_ID not in key
    assert "2026-06-20" not in key


def test_stable_json_is_compact_and_deterministic():
    first = stable_json({"b": 2, "a": 1})
    second = stable_json({"a": 1, "b": 2})

    assert first == second == '{"a":1,"b":2}'


def test_current_airtable_source_event_label_normalizes_to_canonical_token():
    key = build_commission_idempotency_key(_identity(source_event="Booking Completed"))

    assert key.endswith("|event=BOOKING_COMPLETED")


def test_segment_anchor_uses_single_source_type_and_source_id():
    key = build_commission_idempotency_key(
        _identity(source_anchor_type="BOOKING_SEGMENT", source_anchor_id=SEGMENT_ID)
    )

    assert f"sourceType=BOOKING_SEGMENT|sourceId={SEGMENT_ID}" in key
    assert "segment=" not in key
