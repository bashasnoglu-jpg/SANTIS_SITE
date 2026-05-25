import { describe, it, before, after } from "node:test";
import * as assert from "node:assert";
import { buildServer } from "../server.js";
import { TestJwksServer } from "../test-utils/jwks-test-keys.js";
import type { FastifyInstance } from "fastify";
import { 
  MOCK_TENANT_ID, MOCK_SERVICES, MOCK_SPA_AREA, MOCK_LOCATION, MOCK_ROOMS,
  MOCK_THERAPISTS, MOCK_SERVICE_ROOM_COMPATIBILITIES, MOCK_SERVICE_THERAPIST_COMPATIBILITIES,
  MOCK_OPERATING_HOURS, MOCK_SHIFTS, MOCK_BLOCKERS, MOCK_BOOKINGS
} from '@santis/domain-schema/scheduling.fixtures.js';

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
    let customSelectHandler: any = null;
    let customInsertHandler: any = null;
    
    // Make these globally accessible to tests
    (global as any).setCustomSelectHandler = (fn: any) => { customSelectHandler = fn; };
    (global as any).setCustomInsertHandler = (fn: any) => { customInsertHandler = fn; };
    (global as any).clearCustomDbHandlers = () => { customSelectHandler = null; customInsertHandler = null; };

    const mockDb = {
      insert: () => {
        if (customInsertHandler) return customInsertHandler();
        return { values: (vals: any) => ({ returning: async () => [{ ...vals, id: "00000000-0000-0000-0000-000000000000", createdAt: new Date() }] }) };
      },
      update: () => { if (customInsertHandler) return customInsertHandler(); return {}; },
      delete: () => { if (customInsertHandler) return customInsertHandler(); return {}; },
      select: (fields?: any) => {
        if (customSelectHandler) return customSelectHandler(fields);
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
    console.log(res.json()); if (res.statusCode !== 200) throw new Error(JSON.stringify(res.json())); assert.strictEqual(res.statusCode, 200);
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
      url: `/api/v1/scheduling/availability?tenant_id=${MOCK_TENANT_ID}&date=2026-06-01&service_id=${MOCK_SERVICES[0].id}&spa_area_id=${MOCK_SPA_AREA.id}`,
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.ok(Array.isArray(body.slots));
    assert.ok(body.slots.length > 0, 'Should return at least one slot');
    assert.strictEqual(body.slots[0].is_advisory, true, 'Slots must be advisory');
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

  it('9. POST /bookings tenant mismatch returns 403 TENANT_SCOPE_VIOLATION', async () => {
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
        tenant_id: "66666666-6666-6666-6666-666666666666", // Wrong tenant
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
    assert.strictEqual(res.statusCode, 403);
    const body = res.json();
    assert.strictEqual(body.code, 'TENANT_SCOPE_VIOLATION');
  });



  it('15. POST /booking/validate invalid payload returns 400', async () => {
    const token = await jwksServer.signToken({
      sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
    }, "http://127.0.0.1:54321/auth/v1");

    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/scheduling/booking/validate',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: {
        tenant_id: MOCK_TENANT_ID,
        // Missing fields to trigger 400
      }
    });
    assert.strictEqual(res.statusCode, 400);
  });


  describe('Phase K-6B DB Hydration Tests', () => {
    let selectCalled = false;
    let insertCalled = false;

    before(() => {
      (global as any).setCustomInsertHandler(() => { 
        insertCalled = true; 
        return { values: () => ({ returning: async () => [] }) }; 
      });

      (global as any).setCustomSelectHandler(() => {
        selectCalled = true;
        return {
          from: (tableObj: any) => {
            const tableName = tableObj[Symbol.for('drizzle:Name')] || tableObj.config?.name || Object.keys(tableObj).find(k => tableObj[k] && typeof tableObj[k] === 'object' && tableObj[k].name);
            return {
              where: async () => {
                const tableStr = String(tableName);
                const MOCK_DB_FIXTURES = {
                  locations: [{ tenantId: MOCK_TENANT_ID, id: MOCK_LOCATION.id, name: MOCK_LOCATION.name, timezone: MOCK_LOCATION.timezone, createdAt: new Date(), updatedAt: new Date() }],
                  spaAreas: [{ tenantId: MOCK_TENANT_ID, id: MOCK_SPA_AREA.id, locationId: MOCK_LOCATION.id, name: MOCK_SPA_AREA.name, defaultSlotIntervalMinutes: 15, createdAt: new Date(), updatedAt: new Date() }],
                  treatmentRooms: MOCK_ROOMS.map(r => ({ tenantId: MOCK_TENANT_ID, id: r.id, spaAreaId: r.spa_area_id, name: r.name, roomType: r.room_type, capacity: r.capacity, isActive: true, createdAt: new Date(), updatedAt: new Date() })),
                  therapists: MOCK_THERAPISTS.map(t => ({ tenantId: MOCK_TENANT_ID, id: t.id, locationId: t.location_id, name: t.name, isActive: true, createdAt: new Date(), updatedAt: new Date() })),
                  services: MOCK_SERVICES.map(s => ({ tenantId: MOCK_TENANT_ID, id: s.id, name: s.name, durationMinutes: s.duration_minutes, cleanupMinutes: s.cleanup_minutes, isActive: true, createdAt: new Date(), updatedAt: new Date() })),
                  serviceRoomCompatibilities: MOCK_SERVICE_ROOM_COMPATIBILITIES.map(c => ({ tenantId: MOCK_TENANT_ID, serviceId: c.service_id, roomId: c.room_id })),
                  serviceTherapistCompatibilities: MOCK_SERVICE_THERAPIST_COMPATIBILITIES.map(c => ({ tenantId: MOCK_TENANT_ID, serviceId: c.service_id, therapistId: c.therapist_id })),
                  operatingHours: MOCK_OPERATING_HOURS.map(o => ({ id: o.id, tenantId: MOCK_TENANT_ID, locationId: o.location_id, dayOfWeek: o.day_of_week, openTime: o.open_time, closeTime: o.close_time })),
                  therapistShifts: MOCK_SHIFTS.map(s => ({ id: s.id, tenantId: MOCK_TENANT_ID, therapistId: s.therapist_id, locationId: s.location_id, startsAt: new Date(s.starts_at), endsAt: new Date(s.ends_at), recurrenceRule: s.recurrence_rule })),
                  blockers: MOCK_BLOCKERS.map(b => ({ id: b.id, tenantId: MOCK_TENANT_ID, roomId: b.room_id, therapistId: b.therapist_id, startsAt: new Date(b.starts_at), endsAt: new Date(b.ends_at), reason: b.reason })),
                  bookings: MOCK_BOOKINGS.map(b => ({ id: b.id, tenantId: MOCK_TENANT_ID, serviceId: b.service_id, roomId: b.room_id, therapistId: b.therapist_id, serviceStartTime: new Date(b.service_start_time), serviceEndTime: new Date(b.service_end_time), cleanupEndTime: new Date(b.cleanup_end_time), bookingSource: b.booking_source, bookingStatus: b.booking_status, customerInfo: b.customer_info, notes: b.notes, createdAt: new Date(), updatedAt: new Date() }))
                };
                if (tableStr.includes('locations')) return MOCK_DB_FIXTURES.locations;
                if (tableStr.includes('spa_areas')) return MOCK_DB_FIXTURES.spaAreas;
                if (tableStr.includes('treatment_rooms')) return MOCK_DB_FIXTURES.treatmentRooms;
                if (tableStr.includes('therapists')) return MOCK_DB_FIXTURES.therapists;
                if (tableStr.includes('services')) return MOCK_DB_FIXTURES.services;
                if (tableStr.includes('service_room_compatibilities')) return MOCK_DB_FIXTURES.serviceRoomCompatibilities;
                if (tableStr.includes('service_therapist_compatibilities')) return MOCK_DB_FIXTURES.serviceTherapistCompatibilities;
                if (tableStr.includes('operating_hours')) return MOCK_DB_FIXTURES.operatingHours;
                if (tableStr.includes('therapist_shifts')) return MOCK_DB_FIXTURES.therapistShifts;
                if (tableStr.includes('blockers')) return MOCK_DB_FIXTURES.blockers;
                if (tableStr.includes('bookings')) return MOCK_DB_FIXTURES.bookings;
                return [];
              }
            };
          }
        };
      });
    });

    after(() => {
      (global as any).clearCustomDbHandlers();
    });

    it('17. hydrated context path calls SELECT/read methods only and NO insert/update/delete', async () => {
      selectCalled = false;
      insertCalled = false;
      const token = await jwksServer.signToken({
        sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
      }, "http://127.0.0.1:54321/auth/v1");

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/scheduling/booking/validate',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          tenant_id: MOCK_TENANT_ID,
          service_id: "55555555-5555-5555-5555-555555555551",
          room_id: "33333333-3333-3333-3333-333333333331",
          therapist_id: "44444444-4444-4444-4444-444444444441",
          service_start_time: "2026-06-01T14:00:00Z",
          service_end_time: "2026-06-01T15:00:00Z",
          cleanup_end_time: "2026-06-01T15:15:00Z",
          booking_source: "manual",
          booking_status: "draft",
          customer_info: {},
          notes: null
        }
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(selectCalled, true);
      assert.strictEqual(insertCalled, false);
      const body = res.json();
      assert.strictEqual(body.allowed, true);
      assert.strictEqual(body.severity, 'info');
      assert.strictEqual(body.dryRun, true);
      assert.ok(body.decisionTrace.length > 0);
    });

    it('18. room booking conflict from hydrated DB context returns allowed=false', async () => {
      const token = await jwksServer.signToken({
        sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
      }, "http://127.0.0.1:54321/auth/v1");

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/scheduling/booking/validate',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          tenant_id: MOCK_TENANT_ID,
          service_id: "55555555-5555-5555-5555-555555555551",
          room_id: "33333333-3333-3333-3333-333333333331", // Massage 1 (has booking 10:00-11:15)
          therapist_id: "44444444-4444-4444-4444-444444444441", // Aria (compatible with Deep Tissue)
          service_start_time: "2026-06-01T10:30:00Z", // Overlaps room booking
          service_end_time: "2026-06-01T11:30:00Z",
          cleanup_end_time: "2026-06-01T11:45:00Z",
          booking_source: "manual",
          booking_status: "draft",
          customer_info: {},
          notes: null
        }
      });
      assert.strictEqual(res.statusCode, 200);
      const body = res.json();
      assert.strictEqual(body.allowed, false);
      assert.strictEqual(body.conflictCode, 'ROOM_BOOKING_CONFLICT');
      assert.strictEqual(body.severity, 'critical');
      assert.strictEqual(body.affectedResource, 'room');
      assert.strictEqual(body.dryRun, true);
    });

    it('19. blocker conflict from hydrated DB context returns allowed=false (THERAPIST_BLOCKED)', async () => {
      const token = await jwksServer.signToken({
        sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
      }, "http://127.0.0.1:54321/auth/v1");

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/scheduling/booking/validate',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          tenant_id: MOCK_TENANT_ID,
          service_id: "55555555-5555-5555-5555-555555555551",
          room_id: "33333333-3333-3333-3333-333333333332", // VIP Suite
          therapist_id: "44444444-4444-4444-4444-444444444441", // Aria (has lunch blocker 12:00-13:00)
          service_start_time: "2026-06-01T12:30:00Z", // Overlaps blocker
          service_end_time: "2026-06-01T13:30:00Z",
          cleanup_end_time: "2026-06-01T13:45:00Z",
          booking_source: "manual",
          booking_status: "draft",
          customer_info: {},
          notes: null
        }
      });
      assert.strictEqual(res.statusCode, 200);
      const body = res.json();
      assert.strictEqual(body.allowed, false);
      assert.strictEqual(body.conflictCode, 'THERAPIST_BLOCKED');
      assert.strictEqual(body.severity, 'critical');
      assert.strictEqual(body.affectedResource, 'blocker');
      assert.strictEqual(body.dryRun, true);
    });

    it('20. therapist shift mismatch from hydrated DB context returns allowed=false', async () => {
      const token = await jwksServer.signToken({
        sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
      }, "http://127.0.0.1:54321/auth/v1");

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/scheduling/booking/validate',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          tenant_id: MOCK_TENANT_ID,
          service_id: "55555555-5555-5555-5555-555555555551",
          room_id: "33333333-3333-3333-3333-333333333332", // VIP Suite
          therapist_id: "44444444-4444-4444-4444-444444444441", // Aria (Shift ends 17:00)
          service_start_time: "2026-06-01T18:00:00Z", // Outside shift
          service_end_time: "2026-06-01T19:00:00Z",
          cleanup_end_time: "2026-06-01T19:15:00Z",
          booking_source: "manual",
          booking_status: "draft",
          customer_info: {},
          notes: null
        }
      });
      assert.strictEqual(res.statusCode, 200);
      const body = res.json();
      assert.strictEqual(body.allowed, false);
      assert.strictEqual(body.conflictCode, 'THERAPIST_OUTSIDE_SHIFT');
      assert.strictEqual(body.severity, 'warning');
      assert.strictEqual(body.affectedResource, 'therapist');
      assert.strictEqual(body.dryRun, true);
    });

    it('21. production-mode hydration failure returns safe 503 error, not mock success', async () => {
      // Override NODE_ENV for this test to bypass mock fallback
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Break the db to force hydration error
      const brokenDb = {
        select: () => { throw new Error("DB Connection Lost"); }
      };
      (server as any).db = brokenDb;

      const token = await jwksServer.signToken({
        sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
      }, "http://127.0.0.1:54321/auth/v1");

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/scheduling/booking/validate',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          tenant_id: MOCK_TENANT_ID,
          service_id: "55555555-5555-5555-5555-555555555551",
          room_id: "33333333-3333-3333-3333-333333333331",
          therapist_id: "44444444-4444-4444-4444-444444444441",
          service_start_time: "2026-06-01T11:00:00Z",
          service_end_time: "2026-06-01T12:00:00Z",
          cleanup_end_time: "2026-06-01T12:15:00Z",
          booking_source: "manual",
          booking_status: "draft",
          customer_info: {},
          notes: null
        }
      });

      // Restore original env
      process.env.NODE_ENV = originalEnv;

      assert.strictEqual(res.statusCode, 503);
      assert.strictEqual(res.json().code, 'DB_HYDRATION_FAILED');
    });
  });
});
