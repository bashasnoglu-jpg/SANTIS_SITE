from __future__ import annotations

from io import BytesIO
from urllib.error import HTTPError, URLError

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1.endpoints import payment_context as endpoint
from app.payment_context_contract import (
    BLOCKED_RESULT,
    LOCATION_MISMATCH,
    PASS_RESULT,
    PAYMENT_CONTEXT_SOURCE_CHANGED,
    TENANT_MISMATCH,
    UNSUPPORTED_CURRENCY,
    BookingContextSource,
    PaymentContextSource,
    evaluate_payment_context,
)

contract_app = FastAPI()
contract_app.include_router(endpoint.router, prefix="/api/v1")
client = TestClient(contract_app)

QA240_PAYMENT_ID = "recMyLfFWt5QmNb2Q"
QA241_PAYMENT_ID = "recxjEKYMQDio6cb9"
BOOKING_ID = "recgNYgjIjmx414ry"
TENANT_ID = "recaIh4pTfk9dUUx9"
LOCATION_ID = "rectOSqIQbCPjOPr9"
OTHER_TENANT_ID = "recAAAAAAAAAAAAAA"
OTHER_LOCATION_ID = "recBBBBBBBBBBBBBB"
SIGNATURE = (
    "PAY=recMyLfFWt5QmNb2Q|BKG=recgNYgjIjmx414ry|"
    "TEN=recaIh4pTfk9dUUx9|LOC=rectOSqIQbCPjOPr9|"
    "ENV=Test|CUR=EUR|AMT=50|STATUS=Paid"
)


def _payment(
    *,
    payment_record_id: str = QA240_PAYMENT_ID,
    currency: str = "EUR",
    tenant_ids: tuple[str, ...] = (TENANT_ID,),
    location_ids: tuple[str, ...] = (LOCATION_ID,),
    current_signature: str = SIGNATURE,
    reconciled_signature: str = SIGNATURE,
) -> PaymentContextSource:
    return PaymentContextSource(
        payment_record_id=payment_record_id,
        booking_ids=(BOOKING_ID,),
        tenant_ids=tenant_ids,
        location_ids=location_ids,
        environment="Test",
        currency=currency,
        amount_eur=50,
        payment_status="Paid",
        current_signature=current_signature,
        reconciled_signature=reconciled_signature,
    )


def _booking(
    *,
    tenant_ids: tuple[str, ...] = (TENANT_ID,),
    location_ids: tuple[str, ...] = (LOCATION_ID,),
) -> BookingContextSource:
    return BookingContextSource(
        booking_record_id=BOOKING_ID,
        tenant_ids=tenant_ids,
        location_ids=location_ids,
        environment="Test",
    )


def _set_airtable_env(monkeypatch):
    monkeypatch.setenv("AIRTABLE_BASE_ID", "appTestBase")
    monkeypatch.delenv("AIRTABLE_SANTIS_BASE_ID", raising=False)
    monkeypatch.setenv(
        "AIRTABLE_PAYMENT_CONTEXT_READ_TOKEN",
        "patTestReadOnly",
    )
    monkeypatch.delenv("AIRTABLE_PAT", raising=False)
    monkeypatch.delenv("AIRTABLE_API_KEY", raising=False)


def test_qa240_pass_is_deterministic_and_idempotent():
    first = evaluate_payment_context(_payment(), _booking())
    second = evaluate_payment_context(_payment(), _booking())

    assert first.allowed is True
    assert first.result_code == PASS_RESULT
    assert first.blockers == ()
    assert first.freshness_status == "FRESH"
    assert first.as_dict() == second.as_dict()


def test_qa241_usd_is_single_blocker_and_fails_closed():
    decision = evaluate_payment_context(
        _payment(
            payment_record_id=QA241_PAYMENT_ID,
            currency="USD",
            reconciled_signature="",
        ),
        _booking(),
    )

    assert decision.allowed is False
    assert decision.result_code == BLOCKED_RESULT
    assert decision.blockers == (UNSUPPORTED_CURRENCY,)
    assert decision.freshness_status == "BLOCKED"


def test_exact_tenant_and_location_ids_are_not_interchangeable():
    tenant_decision = evaluate_payment_context(
        _payment(tenant_ids=(OTHER_TENANT_ID,)),
        _booking(),
    )
    location_decision = evaluate_payment_context(
        _payment(location_ids=(OTHER_LOCATION_ID,)),
        _booking(),
    )

    assert tenant_decision.blockers == (TENANT_MISMATCH,)
    assert location_decision.blockers == (LOCATION_MISMATCH,)


def test_changed_canonical_signature_blocks_after_context_passes():
    decision = evaluate_payment_context(
        _payment(reconciled_signature="OLDER-SIGNATURE"),
        _booking(),
    )

    assert decision.allowed is False
    assert decision.blockers == (PAYMENT_CONTEXT_SOURCE_CHANGED,)
    assert decision.freshness_status == "SOURCE_CHANGED"


def test_read_only_endpoint_returns_qa240_pass(monkeypatch):
    payment_record = {
        "id": QA240_PAYMENT_ID,
        "fields": {
            "Booking_Link": [BOOKING_ID],
            "Tenant_Link": [TENANT_ID],
            "Location_Link": [LOCATION_ID],
            "Environment": "Test",
            "Payment Currency": "EUR",
            "Amount_EUR": 50,
            "Payment_Status_New": "Paid",
            "Payment Context Current Source Signature": SIGNATURE,
            "Payment Context Reconciled Source Signature": SIGNATURE,
        },
    }
    booking_record = {
        "id": BOOKING_ID,
        "fields": {
            "Tenant_Link": [TENANT_ID],
            "Location_Link": [LOCATION_ID],
            "Environment": "Test",
        },
    }

    def fake_get(table_id, record_id):
        if table_id == endpoint.PAYMENTS_TABLE_ID and record_id == QA240_PAYMENT_ID:
            return payment_record
        if table_id == endpoint.BOOKINGS_TABLE_ID and record_id == BOOKING_ID:
            return booking_record
        return None

    monkeypatch.setattr(endpoint, "_airtable_get_record_or_none", fake_get)

    response = client.get(f"/api/v1/payment-context/{QA240_PAYMENT_ID}/validate")

    assert response.status_code == 200
    assert response.headers.get("cache-control") == "no-store"
    assert response.json()["resultCode"] == PASS_RESULT
    assert response.json()["blockers"] == []


def test_read_only_endpoint_returns_qa241_blocker_without_mutation(monkeypatch):
    payment_record = {
        "id": QA241_PAYMENT_ID,
        "fields": {
            "Booking_Link": [BOOKING_ID],
            "Tenant_Link": [TENANT_ID],
            "Location_Link": [LOCATION_ID],
            "Environment": "Test",
            "Payment Currency": "USD",
            "Amount_EUR": 50,
            "Payment_Status_New": "Paid",
            "Payment Context Current Source Signature": SIGNATURE.replace("CUR=EUR", "CUR=USD"),
            "Payment Context Reconciled Source Signature": "",
        },
    }
    booking_record = {
        "id": BOOKING_ID,
        "fields": {
            "Tenant_Link": [TENANT_ID],
            "Location_Link": [LOCATION_ID],
            "Environment": "Test",
        },
    }

    calls: list[tuple[str, str]] = []

    def fake_get(table_id, record_id):
        calls.append((table_id, record_id))
        if table_id == endpoint.PAYMENTS_TABLE_ID and record_id == QA241_PAYMENT_ID:
            return payment_record
        if table_id == endpoint.BOOKINGS_TABLE_ID and record_id == BOOKING_ID:
            return booking_record
        return None

    monkeypatch.setattr(endpoint, "_airtable_get_record_or_none", fake_get)

    response = client.get(f"/api/v1/payment-context/{QA241_PAYMENT_ID}/validate")

    assert response.status_code == 409
    assert response.headers.get("cache-control") == "no-store"
    assert response.json()["detail"]["resultCode"] == BLOCKED_RESULT
    assert response.json()["detail"]["blockers"] == [UNSUPPORTED_CURRENCY]
    assert calls == [
        (endpoint.PAYMENTS_TABLE_ID, QA241_PAYMENT_ID),
        (endpoint.BOOKINGS_TABLE_ID, BOOKING_ID),
    ]


def test_invalid_record_id_is_no_store():
    response = client.get("/api/v1/payment-context/not-a-record/validate")

    assert response.status_code == 422
    assert response.headers.get("cache-control") == "no-store"
    assert response.json()["detail"]["code"] == "INVALID_PAYMENT_RECORD_ID"


def test_payment_not_found_is_no_store(monkeypatch):
    monkeypatch.setattr(endpoint, "_airtable_get_record_or_none", lambda *_: None)

    response = client.get(f"/api/v1/payment-context/{QA240_PAYMENT_ID}/validate")

    assert response.status_code == 404
    assert response.headers.get("cache-control") == "no-store"
    assert response.json()["detail"]["code"] == "PAYMENT_NOT_FOUND"


def test_missing_base_configuration_is_no_store(monkeypatch):
    monkeypatch.delenv("AIRTABLE_BASE_ID", raising=False)
    monkeypatch.delenv("AIRTABLE_SANTIS_BASE_ID", raising=False)
    monkeypatch.setenv(
        "AIRTABLE_PAYMENT_CONTEXT_READ_TOKEN",
        "patTestReadOnly",
    )
    monkeypatch.delenv("AIRTABLE_PAT", raising=False)
    monkeypatch.delenv("AIRTABLE_API_KEY", raising=False)

    response = client.get(f"/api/v1/payment-context/{QA240_PAYMENT_ID}/validate")

    assert response.status_code == 503
    assert response.headers.get("cache-control") == "no-store"
    assert response.json()["detail"] == {"code": "AIRTABLE_BASE_NOT_CONFIGURED"}


def test_missing_read_token_ignores_legacy_credentials_without_network(monkeypatch):
    monkeypatch.setenv("AIRTABLE_BASE_ID", "appTestBase")
    monkeypatch.delenv("AIRTABLE_SANTIS_BASE_ID", raising=False)
    monkeypatch.delenv("AIRTABLE_PAYMENT_CONTEXT_READ_TOKEN", raising=False)
    monkeypatch.setenv("AIRTABLE_PAT", "legacyPatCanary")
    monkeypatch.setenv("AIRTABLE_API_KEY", "legacyApiKeyCanary")

    network_calls: list[tuple[tuple[object, ...], dict[str, object]]] = []

    def fail_if_called(*args, **kwargs):
        network_calls.append((args, kwargs))
        raise AssertionError("Airtable network call must not occur")

    monkeypatch.setattr(endpoint, "urlopen", fail_if_called)

    response = client.get(f"/api/v1/payment-context/{QA240_PAYMENT_ID}/validate")

    assert response.status_code == 503
    assert response.headers.get("cache-control") == "no-store"
    assert response.json()["detail"] == {"code": "AIRTABLE_TOKEN_NOT_CONFIGURED"}
    assert network_calls == []


def test_upstream_http_error_is_sanitized_and_no_store(monkeypatch):
    _set_airtable_env(monkeypatch)
    secret_body = b'{"error":"sensitive upstream details"}'

    def raise_http_error(*_args, **_kwargs):
        raise HTTPError(
            url="https://api.airtable.com/test",
            code=500,
            msg="upstream failure",
            hdrs=None,
            fp=BytesIO(secret_body),
        )

    monkeypatch.setattr(endpoint, "urlopen", raise_http_error)

    response = client.get(f"/api/v1/payment-context/{QA240_PAYMENT_ID}/validate")

    assert response.status_code == 502
    assert response.headers.get("cache-control") == "no-store"
    assert response.json()["detail"] == {"code": "AIRTABLE_READ_FAILED"}
    assert "sensitive upstream details" not in response.text


def test_upstream_network_error_is_sanitized_and_no_store(monkeypatch):
    _set_airtable_env(monkeypatch)

    def raise_network_error(*_args, **_kwargs):
        raise URLError("private network details")

    monkeypatch.setattr(endpoint, "urlopen", raise_network_error)

    response = client.get(f"/api/v1/payment-context/{QA240_PAYMENT_ID}/validate")

    assert response.status_code == 502
    assert response.headers.get("cache-control") == "no-store"
    assert response.json()["detail"] == {"code": "AIRTABLE_NETWORK_ERROR"}
    assert "private network details" not in response.text


def test_invalid_upstream_json_is_sanitized_and_no_store(monkeypatch):
    _set_airtable_env(monkeypatch)

    class InvalidJsonResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            return b"not-json"

    monkeypatch.setattr(endpoint, "urlopen", lambda *_args, **_kwargs: InvalidJsonResponse())

    response = client.get(f"/api/v1/payment-context/{QA240_PAYMENT_ID}/validate")

    assert response.status_code == 502
    assert response.headers.get("cache-control") == "no-store"
    assert response.json()["detail"] == {"code": "AIRTABLE_INVALID_RESPONSE"}
    assert "not-json" not in response.text


def test_malformed_upstream_envelope_is_sanitized_and_no_store(monkeypatch):
    _set_airtable_env(monkeypatch)

    class MalformedEnvelopeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            return b"null"

    monkeypatch.setattr(
        endpoint,
        "urlopen",
        lambda *_args, **_kwargs: MalformedEnvelopeResponse(),
    )

    response = client.get(f"/api/v1/payment-context/{QA240_PAYMENT_ID}/validate")

    assert response.status_code == 502
    assert response.headers.get("cache-control") == "no-store"
    assert response.json()["detail"] == {"code": "AIRTABLE_INVALID_RESPONSE"}
    assert "null" not in response.text
