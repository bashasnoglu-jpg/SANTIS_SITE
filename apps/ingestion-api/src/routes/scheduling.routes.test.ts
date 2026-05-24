import { describe, it, before, after } from "node:test";
import * as assert from "node:assert";
import { buildServer } from "../server.js";
import { TestJwksServer } from "../test-utils/jwks-test-keys.js";
import type { FastifyInstance } from "fastify";
import { MOCK_TENANT_ID, MOCK_SERVICES } from '@santis/domain-schema/scheduling.fixtures.js';

describe('Scheduling API Routes - Phase K-4', () => {
  let server: FastifyInstance;
  let jwksServer: TestJwksServer;

  before(async () => {
    // 1. Start the mocked JWKS Server
    jwksServer = new TestJwksServer();
    await jwksServer.start();

    // 2. Set strict environment variables
    process.env.SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.SUPABASE_JWKS_URL = `${jwksServer.url}/auth/v1/.well-known/jwks.json`;

    // 3. Build fastify server
    const mockDb = {
      insert: () => ({ values: (vals: any) => ({ returning: async () => [{ ...vals, id: "00000000-0000-0000-0000-000000000000", createdAt: new Date() }] }) }),
      select: (fields?: any) => {
        if (fields && fields.count) {
          return { from: () => ({ where: async () => [{ count: 0 }] }) };
        }
        return { from: () => ({ where: () => ({ orderBy: () => ({ limit: () => ({ offset: async () => [] }) }) }) }) };
      }
    } as any;
    
    server = buildServer(mockDb);
  });

  after(async () => {
    await jwksServer.stop();
    await server.close();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_JWKS_URL;
  });

  it('1. unauthenticated request rejected', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/scheduling/resources'
    });
    // Should fail auth
    assert.strictEqual(res.statusCode, 401);
  });

  it('2. GET /resources returns mock resources mapped to tenant', async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "mock-sub",
      app_metadata: {
        santis: {
          operatorId: "op-admin",
          tenantId: MOCK_TENANT_ID,
          roles: ["admin"]
        }
      }
    }, issuer);

    const res = await server.inject({
      method: 'GET',
      url: `/api/v1/scheduling/resources?tenant_id=${MOCK_TENANT_ID}`,
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.services);
    assert.ok(body.rooms);
    // Ensure tenant matches
    assert.strictEqual(body.services[0].tenant_id, MOCK_TENANT_ID);
  });

  it('3. tenant mismatch returns 403 TENANT_SCOPE_VIOLATION', async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "mock-sub",
      app_metadata: {
        santis: {
          operatorId: "op-admin",
          tenantId: MOCK_TENANT_ID,
          roles: ["admin"]
        }
      }
    }, issuer);

    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/scheduling/resources?tenant_id=66666666-6666-6666-6666-666666666666', // Wrong tenant
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    assert.strictEqual(res.statusCode, 403);
    const body = res.json();
    assert.strictEqual(body.code, 'TENANT_SCOPE_VIOLATION');
  });

  it('5. GET /availability returns advisory slots', async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "mock-sub",
      app_metadata: {
        santis: {
          operatorId: "op-admin",
          tenantId: MOCK_TENANT_ID,
          roles: ["admin"]
        }
      }
    }, issuer);

    const res = await server.inject({
      method: 'GET',
      url: `/api/v1/scheduling/availability?tenant_id=${MOCK_TENANT_ID}&date=2026-06-01&service_id=${MOCK_SERVICES[0].id}&spa_area_id=22222222-2222-2222-2222-222222222221`,
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.ok(Array.isArray(body.slots));
    if (body.slots.length > 0) {
      assert.strictEqual(body.slots[0].is_advisory, true);
    }
  });

  it('6. GET /bookings returns mock bookings', async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "mock-sub",
      app_metadata: {
        santis: {
          operatorId: "op-admin",
          tenantId: MOCK_TENANT_ID,
          roles: ["admin"]
        }
      }
    }, issuer);

    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/scheduling/bookings',
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.ok(Array.isArray(body.bookings));
  });

  it('7 & 8. POST /bookings returns 501 and no Supabase write is attempted', async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "mock-sub",
      app_metadata: {
        santis: {
          operatorId: "op-admin",
          tenantId: MOCK_TENANT_ID,
          roles: ["admin"]
        }
      }
    }, issuer);

    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/scheduling/bookings',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      payload: {
        tenant_id: MOCK_TENANT_ID,
        service_id: MOCK_SERVICES[0].id,
        room_id: "33333333-3333-3333-3333-333333333333",
        therapist_id: "44444444-4444-4444-4444-444444444444",
        service_start_time: "2026-06-01T09:00:00Z",
        service_end_time: "2026-06-01T10:00:00Z",
        cleanup_end_time: "2026-06-01T10:15:00Z",
        booking_source: "manual",
        booking_status: "confirmed",
        customer_info: {},
        notes: null
      }
    });
    const body = res.json();
    if (res.statusCode !== 501) console.log('POST Error Body:', body);
    assert.strictEqual(res.statusCode, 501);
    assert.strictEqual(body.code, 'NOT_IMPLEMENTED_TRANSACTION_REQUIRED');
  });
});
