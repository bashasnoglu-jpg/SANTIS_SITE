from fastapi.testclient import TestClient
import server
from app.api import deps
import uuid

class MockTenant:
    id = uuid.UUID('11111111-1111-1111-1111-111111111111')

class MockUser:
    id = uuid.UUID('22222222-2222-2222-2222-222222222222')
    tenant_id = uuid.UUID('11111111-1111-1111-1111-111111111111')
    is_active = True
    is_superuser = True

server.app.dependency_overrides[deps.get_current_tenant] = lambda: MockTenant()
server.app.dependency_overrides[deps.get_current_user] = lambda: MockUser()

client = TestClient(server.app)
try:
    res = client.get('/api/v1/analytics/metrics')
    print('STATUS:', res.status_code)
    print('BODY:', res.text)
except Exception as e:
    import traceback
    traceback.print_exc()
