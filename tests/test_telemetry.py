import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.v1.endpoints.telemetry import _rate_limit_store

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_rate_limit_state():
    """Testler arasinda rate limit store'u temizler"""
    _rate_limit_store.clear()
    yield
    _rate_limit_store.clear()

def test_telemetry_beacon_valid_payload():
    payload = {
        "event_type": "page_view",
        "session_id": "test-123",
        "client_time": "2026-05-20T08:00:00Z",
        "metadata": {"url": "/test-url"}
    }
    response = client.post("/api/v1/telemetry/beacon", json=payload)
    assert response.status_code == 200
    assert response.json() == {"status": "accepted"}

def test_telemetry_beacon_unknown_fields_ignored():
    payload = {
        "event_type": "click_event",
        "hacker_field": "should be ignored completely",
        "some_random_data": [1, 2, 3]
    }
    response = client.post("/api/v1/telemetry/beacon", json=payload)
    assert response.status_code == 200
    assert response.json() == {"status": "accepted"}

def test_telemetry_beacon_large_payload_rejected():
    large_payload = {
        "event_type": "large_event",
        "metadata": {"big_data": "A" * 60000}  # ~60KB string, exceeds 50KB limit
    }
    response = client.post("/api/v1/telemetry/beacon", json=large_payload)
    assert response.status_code == 413
    assert "too large" in response.json()["detail"].lower()

def test_telemetry_beacon_missing_event_type():
    payload = {
        "session_id": "no-event-type"
    }
    response = client.post("/api/v1/telemetry/beacon", json=payload)
    assert response.status_code == 422
    assert "Invalid payload schema" in response.json()["detail"]

def test_telemetry_beacon_rate_limiting():
    payload = {"event_type": "spam"}
    
    # Send 60 requests (should all pass)
    for _ in range(60):
        response = client.post("/api/v1/telemetry/beacon", json=payload)
        assert response.status_code == 200
        
    # 61st request should be rejected
    response = client.post("/api/v1/telemetry/beacon", json=payload)
    assert response.status_code == 429
    assert "Too many" in response.json()["detail"]
