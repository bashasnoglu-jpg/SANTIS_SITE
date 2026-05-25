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
      },
      execute: async () => ({}),
      transaction: async (cb: any) => {
        return cb(mockDb);
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
      (global as any).setCustomSelectHandler(() => { throw new Error("DB Connection Lost"); });

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

      // Restore original env and DB mock
      if (originalEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = originalEnv;
      }

      // Restore the DB mock for subsequent tests
      (global as any).setCustomSelectHandler(() => {
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

      assert.strictEqual(res.statusCode, 503);
      assert.strictEqual(res.json().code, 'DB_HYDRATION_FAILED');
    });
  });

  describe('Phase K-6D-A Hold Route Tests', () => {
    before(() => {
      (global as any).setCustomSelectHandler(() => {
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
                  bookings: MOCK_BOOKINGS.map(b => ({ id: b.id, tenantId: MOCK_TENANT_ID, serviceId: b.service_id, roomId: b.room_id, therapistId: b.therapist_id, serviceStartTime: new Date(b.service_start_time), serviceEndTime: new Date(b.service_end_time), cleanupEndTime: new Date(b.cleanup_end_time), bookingSource: b.booking_source, bookingStatus: b.booking_status, customerInfo: b.customer_info, notes: b.notes, createdAt: new Date(), updatedAt: new Date() })),
                  bookingHolds: []
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
                if (tableStr.includes('booking_holds')) return MOCK_DB_FIXTURES.bookingHolds;
                return [];
              },
              then: function(resolve: any) {
                return this.where().then(resolve);
              }
            };
          }
        };
      });
    });

    after(() => {
      (global as any).clearCustomDbHandlers();
    });
    it('22. POST /booking/hold valid payload returns held=true, mock token, expiresAt', async () => {
      const token = await jwksServer.signToken({
        sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
      }, "http://127.0.0.1:54321/auth/v1");

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/scheduling/booking/hold',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          tenant_id: MOCK_TENANT_ID,
          service_id: "55555555-5555-5555-5555-555555555551",
          room_id: "33333333-3333-3333-3333-333333333331",
          therapist_id: "44444444-4444-4444-4444-444444444441",
          service_start_time: "2026-06-01T14:00:00Z",
          service_end_time: "2026-06-01T15:00:00Z",
          cleanup_end_time: "2026-06-01T15:15:00Z",
        }
      });

      assert.strictEqual(res.statusCode, 200);
      const body = res.json();
      assert.strictEqual(body.held, true);
      assert.strictEqual(body.status, 'active');
      assert.ok(body.holdToken);
      assert.ok(body.holdId);
      assert.notStrictEqual(body.holdToken, body.holdId);
      assert.ok(body.expiresAt);
      assert.strictEqual(body.ttlSeconds, 600);
      assert.strictEqual(body.dryRun, true);
      assert.strictEqual(body.validation.allowed, true);
    });

    it('23. POST /booking/hold conflicting payload returns held=false, validation_failed', async () => {
      const token = await jwksServer.signToken({
        sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
      }, "http://127.0.0.1:54321/auth/v1");

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/scheduling/booking/hold',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          tenant_id: MOCK_TENANT_ID,
          service_id: "55555555-5555-5555-5555-555555555551",
          room_id: "33333333-3333-3333-3333-333333333331", // Overlaps with booking 10:00-11:15
          therapist_id: "44444444-4444-4444-4444-444444444441",
          service_start_time: "2026-06-01T10:30:00Z",
          service_end_time: "2026-06-01T11:30:00Z",
          cleanup_end_time: "2026-06-01T11:45:00Z",
        }
      });

      assert.strictEqual(res.statusCode, 409);
      const body = res.json();
      assert.strictEqual(body.held, false);
      assert.strictEqual(body.status, 'validation_failed');
      assert.strictEqual(body.validation.allowed, false);
      assert.strictEqual(body.validation.conflictCode, 'ROOM_BOOKING_CONFLICT');
      assert.strictEqual(body.dryRun, true);
    });

    it('23a. POST /booking/hold invalid payload returns 400', async () => {
      const token = await jwksServer.signToken({
        sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
      }, "http://127.0.0.1:54321/auth/v1");

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/scheduling/booking/hold',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          tenant_id: MOCK_TENANT_ID,
          // Missing required fields
        }
      });

      assert.strictEqual(res.statusCode, 400);
    });

    it('23b. POST /booking/hold does not call insert/update/delete (read-only hydration only)', async () => {
      let insertCalled = false;
      (global as any).setCustomInsertHandler(() => {
        insertCalled = true;
        return { values: () => ({ returning: async () => [] }) };
      });

      const token = await jwksServer.signToken({
        sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
      }, "http://127.0.0.1:54321/auth/v1");

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/scheduling/booking/hold',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          tenant_id: MOCK_TENANT_ID,
          service_id: "55555555-5555-5555-5555-555555555551",
          room_id: "33333333-3333-3333-3333-333333333331",
          therapist_id: "44444444-4444-4444-4444-444444444441",
          service_start_time: "2026-06-01T14:00:00Z",
          service_end_time: "2026-06-01T15:00:00Z",
          cleanup_end_time: "2026-06-01T15:15:00Z",
        }
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(insertCalled, false, 'No inserts should be performed during hold mock phase');
    });

    it('24. isHoldExpired helper accurately determines if hold is expired', async () => {
      // Dynamic import to avoid messing up the test scope too much
      const { isHoldExpired } = await import('@santis/domain-schema/scheduling.booking-guard.js');

      const now = Date.now();
      const pastStr = new Date(now - 1000).toISOString();
      const futureStr = new Date(now + 1000).toISOString();

      assert.strictEqual(isHoldExpired(pastStr, now), true);
      assert.strictEqual(isHoldExpired(futureStr, now), false);
      assert.strictEqual(isHoldExpired('invalid-date', now), true);
    });

    it('25. POST /booking/confirm is not implemented yet', async () => {
      const token = await jwksServer.signToken({
        sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
      }, "http://127.0.0.1:54321/auth/v1");

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/scheduling/booking/confirm',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          holdToken: 'some-token'
        }
      });

      // Depending on Fastify version and whether the route is registered at all, it's 404
      assert.strictEqual(res.statusCode, 404);
    });

    it('26. hashHoldToken is deterministic and does not return raw token', async () => {
      const { hashHoldToken } = await import('@santis/database');
      const token1 = 'my-secret-token-123';
      const hash1 = hashHoldToken(token1);
      const hash2 = hashHoldToken(token1);

      assert.notStrictEqual(hash1, token1);
      assert.strictEqual(hash1, hash2);
      assert.strictEqual(hash1.length, 64); // SHA-256 is 64 hex chars
    });

    it('27. repository createHold calls insert only in isolated mock', async () => {
      const { SchedulingRepository } = await import('@santis/database');

      let insertCalled = false;
      let insertedValues: any = null;

      const isolatedMockDb: any = {
        insert: () => {
          insertCalled = true;
          return {
            values: (vals: any) => {
              insertedValues = vals;
              return {
                returning: async () => [vals]
              };
            }
          };
        }
      };

      const repo = new SchedulingRepository(isolatedMockDb);
      const holdData = {
        tenantId: MOCK_TENANT_ID,
        serviceId: '55555555-5555-5555-5555-555555555551',
        roomId: '33333333-3333-3333-3333-333333333331',
        therapistId: '44444444-4444-4444-4444-444444444441',
        serviceStartTime: new Date(),
        serviceEndTime: new Date(),
        cleanupEndTime: new Date(),
        holdTokenHash: 'mock-hash',
        status: 'active' as any,
        expiresAt: new Date()
      };

      const result = await repo.createHold(holdData);

      assert.strictEqual(insertCalled, true);
      assert.deepStrictEqual(insertedValues, holdData);
      assert.deepStrictEqual(result, [holdData]);
    });
  });

  describe('Phase K-6D-B2-A Persistent Hold Feature Flag Tests', () => {
    before(() => {
      process.env.ENABLE_PERSISTENT_HOLDS = 'true';
      (global as any).setCustomSelectHandler(() => {
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
                  bookings: MOCK_BOOKINGS.map(b => ({ id: b.id, tenantId: MOCK_TENANT_ID, serviceId: b.service_id, roomId: b.room_id, therapistId: b.therapist_id, serviceStartTime: new Date(b.service_start_time), serviceEndTime: new Date(b.service_end_time), cleanupEndTime: new Date(b.cleanup_end_time), bookingSource: b.booking_source, bookingStatus: b.booking_status, customerInfo: b.customer_info, notes: b.notes, createdAt: new Date(), updatedAt: new Date() })),
                  bookingHolds: []
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
                if (tableStr.includes('booking_holds')) return MOCK_DB_FIXTURES.bookingHolds;
                return [];
              },
              then: function(resolve: any) {
                return this.where().then(resolve);
              }
            };
          }
        };
      });
    });

    after(() => {
      delete process.env.ENABLE_PERSISTENT_HOLDS;
      (global as any).clearCustomDbHandlers();
    });

    it('28. POST /booking/hold with persistent flag ON returns dryRun=false and creates hold in mock', async () => {
      const issuer = "http://127.0.0.1:54321/auth/v1";
      const token = await jwksServer.signToken({
        sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
      }, issuer);

      let insertCalled = false;
      let executeCalled = false;

      (global as any).setCustomInsertHandler(() => {
        insertCalled = true;
        return { values: (vals: any) => ({ returning: async () => [{ ...vals }] }) };
      });

      // We override db.execute locally to check if lock was taken
      const originalExecute = (server as any).db.execute;
      (server as any).db.execute = async (sql: any) => {
        executeCalled = true;
        return {};
      };

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/scheduling/booking/hold',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          tenant_id: MOCK_TENANT_ID,
          service_id: "55555555-5555-5555-5555-555555555551",
          room_id: "33333333-3333-3333-3333-333333333331",
          therapist_id: "44444444-4444-4444-4444-444444444441",
          service_start_time: "2026-06-01T14:00:00Z",
          service_end_time: "2026-06-01T15:00:00Z",
          cleanup_end_time: "2026-06-01T15:15:00Z",
        }
      });

      // Restore
      (server as any).db.execute = originalExecute;

      assert.strictEqual(res.statusCode, 200);
      const body = res.json();
      assert.strictEqual(body.held, true);
      assert.strictEqual(body.status, 'active');
      assert.strictEqual(body.dryRun, false, 'dryRun should be false when persistent flag is ON');
      assert.strictEqual(insertCalled, true, 'Mock DB insert should have been called');
      assert.strictEqual(executeCalled, true, 'Advisory lock should have been taken');
    });

    it('29. POST /booking/hold with persistent flag ON but DB throws returns 503', async () => {
      const issuer = "http://127.0.0.1:54321/auth/v1";
      const token = await jwksServer.signToken({
        sub: "mock", app_metadata: { santis: { operatorId: "op", tenantId: MOCK_TENANT_ID, roles: ["admin"] } }
      }, issuer);

      (global as any).setCustomInsertHandler(() => {
        const error = new Error('mock error') as any;
        error.code = '42P01'; // Mock DB undefined table
        throw error;
      });

      const res = await server.inject({
        method: 'POST',
        url: '/api/v1/scheduling/booking/hold',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        payload: {
          tenant_id: MOCK_TENANT_ID,
          service_id: "55555555-5555-5555-5555-555555555551",
          room_id: "33333333-3333-3333-3333-333333333331",
          therapist_id: "44444444-4444-4444-4444-444444444441",
          service_start_time: "2026-06-01T14:00:00Z",
          service_end_time: "2026-06-01T15:00:00Z",
          cleanup_end_time: "2026-06-01T15:15:00Z",
        }
      });

      assert.strictEqual(res.statusCode, 503);
      assert.strictEqual(res.json().message, "Database hold tables not yet migrated.");
    });
  });
});

