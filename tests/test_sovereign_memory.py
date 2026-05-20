import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.memory import MemoryNode

client = TestClient(app)

def test_get_memory_nodes():
    response = client.get("/api/v1/memory/nodes")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    
    # Verify shape parsing via pydantic
    MemoryNode(**data[0])

def test_get_specific_memory_node():
    target_date = "2026-03-04"
    response = client.get(f"/api/v1/memory/nodes/{target_date}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["date"] == target_date
    assert data["biometrics"]["hrv"] == 62
    
    MemoryNode(**data)

def test_get_memory_node_not_found():
    response = client.get("/api/v1/memory/nodes/2099-01-01")
    assert response.status_code == 404
    assert response.json()["detail"] == "Memory node not found"
