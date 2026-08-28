from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


def test_vercel_runtime_entrypoint_imports_and_serves_required_routes():
    health = client.get("/health")
    invalid_payment = client.get(
        "/api/v1/payment-context/not-a-record/validate"
    )

    assert health.status_code == 200
    assert health.json() == {"status": "ok"}

    assert invalid_payment.status_code == 422
    assert invalid_payment.headers.get("cache-control") == "no-store"
    assert invalid_payment.json()["detail"]["code"] == "INVALID_PAYMENT_RECORD_ID"
