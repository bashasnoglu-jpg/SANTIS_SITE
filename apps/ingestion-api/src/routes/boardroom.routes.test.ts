import { describe, it, before, after } from "node:test";
import * as assert from "node:assert";
import { buildServer } from "../server.js";
import { TestJwksServer } from "../test-utils/jwks-test-keys.js";
import type { FastifyInstance } from "fastify";
import { SANTIS_SESSION_COOKIE, CSRF_COOKIE } from "../auth/constants.js";

describe("Boardroom Routes - Auth PreHandler Integration", () => {
  let server: FastifyInstance;
  let jwksServer: TestJwksServer;

  before(async () => {
    // 1. Start the mocked JWKS Server
    jwksServer = new TestJwksServer();
    await jwksServer.start();

    // 2. Set strict environment variables matching our J-K Env Policy
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

  it("1. Missing Authorization header -> 401", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log",
    });

    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(response.json().code, "ERR_UNAUTHORIZED");
  });

  it("2. Malformed Authorization header -> 401", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: "Token foo" },
    });

    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(response.json().code, "ERR_UNAUTHORIZED");
  });

  it("3. Invalid/Expired JWT -> 401", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: "Bearer invalid.token.signature" },
    });

    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(response.json().code, "ERR_UNAUTHORIZED");
  });

  it("4. Valid JWT missing app_metadata.santis -> 401", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({ sub: "11111111-1111-1111-1111-111111111111" }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(response.json().code, "ERR_UNAUTHORIZED");
  });

  it("5. Valid JWT missing tenantId -> 403 / ERR_TENANT_SCOPE_REQUIRED", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "11111111-1111-1111-1111-111111111111",
      app_metadata: {
        santis: {
          operatorId: "op-123",
          roles: ["admin"],
        }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.strictEqual(response.statusCode, 403);
    assert.strictEqual(response.json().code, "ERR_TENANT_SCOPE_REQUIRED");
  });

  it("6. Valid JWT lacking admin/boardroom/audit-log:read -> 403 / ERR_FORBIDDEN", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "11111111-1111-1111-1111-111111111111",
      app_metadata: {
        santis: {
          operatorId: "op-123",
          tenantId: "11111111-1111-1111-1111-111111111111",
          roles: ["concierge"],
        }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.strictEqual(response.statusCode, 403);
    assert.strictEqual(response.json().code, "ERR_FORBIDDEN");
  });

  it("7. Valid Boardroom-readable JWT -> 200 / Empty Array", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: {
          operatorId: "op-admin",
          tenantId: "22222222-2222-2222-2222-222222222222",
          roles: ["admin"],
        }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = response.json();
    assert.deepStrictEqual(body.data, []);
    assert.strictEqual(body.meta.total, 0);
  });

  it("8. Valid JWT with role concierge but capability boardroom:read -> 200", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "22222222-2222-2222-2222-222222222222",
      app_metadata: {
        santis: {
          operatorId: "op-concierge",
          tenantId: "33333333-3333-3333-3333-333333333333",
          roles: ["concierge"],
          capabilities: ["boardroom:read"]
        }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = response.json();
    assert.deepStrictEqual(body.data, []);
  });

  it("9. Valid JWT with role concierge but capability audit-log:read -> 200", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "33333333-3333-3333-3333-333333333333",
      app_metadata: {
        santis: {
          operatorId: "op-concierge-2",
          tenantId: "44444444-4444-4444-4444-444444444444",
          roles: ["concierge"],
          capabilities: ["audit-log:read"]
        }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.strictEqual(response.statusCode, 200);
    const body = response.json();
    assert.deepStrictEqual(body.data, []);
  });

  it("10. Valid JWT with tenantId but not UUID -> 401", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: {
          operatorId: "op-admin",
          tenantId: "invalid-uuid-format", // Not a UUID
          roles: ["admin"],
        }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(response.json().code, "ERR_UNAUTHORIZED");
  });

  it("11. Truly Expired JWT -> 401", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "44444444-4444-4444-4444-444444444444",
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      app_metadata: {
        santis: {
          operatorId: "op-expired",
          tenantId: "55555555-5555-5555-5555-555555555555",
          roles: ["admin"],
        }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: `Bearer ${token}` },
    });

    assert.strictEqual(response.statusCode, 401);
    assert.strictEqual(response.json().code, "ERR_UNAUTHORIZED");
  });

  it("12. Read-only capability cannot POST -> 403", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: {
          operatorId: "op-read-only",
          tenantId: "22222222-2222-2222-2222-222222222222",
          roles: ["concierge"],
          capabilities: ["audit-log:read"]
        }
      }
    }, issuer);

    const response = await server.inject({
      method: "POST",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        actorType: "user",
        action: "auth.login",
        payload: {}
      }
    });

    assert.strictEqual(response.statusCode, 403);
    assert.strictEqual(response.json().code, "ERR_FORBIDDEN");
  });

  it("13. Write capability/admin can POST -> 201", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: {
          operatorId: "op-admin",
          tenantId: "22222222-2222-2222-2222-222222222222",
          roles: ["admin"]
        }
      }
    }, issuer);

    const response = await server.inject({
      method: "POST",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        actorType: "user",
        action: "auth.login",
        payload: {}
      }
    });

    assert.strictEqual(response.statusCode, 201);
  });

  it("14. Forbidden payload key returns 400", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: {
          operatorId: "op-admin",
          tenantId: "22222222-2222-2222-2222-222222222222",
          roles: ["admin"]
        }
      }
    }, issuer);

    const response = await server.inject({
      method: "POST",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        actorType: "user",
        action: "auth.login",
        payload: {
          password: "mysecretpassword"
        }
      }
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.json().error, "Validation Error");
  });

  it("15. Body tenantId spoofing is ignored", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const realTenantId = "22222222-2222-2222-2222-222222222222";
    const fakeTenantId = "99999999-9999-9999-9999-999999999999";
    
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: {
          operatorId: "op-admin",
          tenantId: realTenantId,
          roles: ["admin"]
        }
      }
    }, issuer);

    const response = await server.inject({
      method: "POST",
      url: "/api/v1/boardroom/audit-log",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        tenantId: fakeTenantId, // Try to spoof
        actorType: "user",
        action: "auth.login",
        payload: {}
      }
    });

    assert.strictEqual(response.statusCode, 201);
    const createdLog = response.json();
    assert.strictEqual(createdLog.tenantId, realTenantId); // Spoofed tenantId should be replaced with real
  });

  it("16. Fastify server fails to boot if db is not injected", async () => {
    try {
      // Build server without passing mockDb
      const badServer = buildServer();
      await badServer.ready();
      assert.fail("Server should have thrown an error during boot because db is not injected");
    } catch (err: any) {
      assert.strictEqual(err.message, "server.db is not injected");
    }
  });

  it(`17. Missing Bearer but valid ${SANTIS_SESSION_COOKIE} works -> 200`, async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: {
          operatorId: "op-admin",
          tenantId: "22222222-2222-2222-2222-222222222222",
          roles: ["admin"],
        }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log",
      cookies: {
        [SANTIS_SESSION_COOKIE]: token
      }
    });

    assert.strictEqual(response.statusCode, 200);
    const body = response.json();
    assert.deepStrictEqual(body.data, []);
  });

  it("18. POST /api/v1/boardroom/login without token fails -> 401", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/api/v1/boardroom/login",
      payload: { passcode: "1234" } // Legacy passcode
    });

    assert.strictEqual(response.statusCode, 401);
  });

  it("18.1. POST /api/v1/boardroom/login with invalid token fails -> 401", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/api/v1/boardroom/login",
      payload: { token: "invalid.token.here" }
    });

    assert.strictEqual(response.statusCode, 401);
  });

  it("18.2. POST /api/v1/boardroom/login with valid token issues cookies -> 200", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: { operatorId: "op-admin", tenantId: "22222222-2222-2222-2222-222222222222", roles: ["admin"] }
      }
    }, issuer);

    const response = await server.inject({
      method: "POST",
      url: "/api/v1/boardroom/login",
      payload: { token }
    });

    assert.strictEqual(response.statusCode, 200);
    const cookies = response.cookies;

    const sessionCookie = cookies.find((c: any) => c.name === SANTIS_SESSION_COOKIE);
    assert.ok(sessionCookie);
    assert.strictEqual(sessionCookie.value, token);
    assert.strictEqual(sessionCookie.httpOnly, true);
    assert.strictEqual(sessionCookie.secure, true);
    assert.strictEqual(sessionCookie.sameSite, 'Strict');

    const csrfCookie = cookies.find((c: any) => c.name === CSRF_COOKIE);
    assert.ok(csrfCookie);
    assert.ok(csrfCookie.value.length > 10);
    assert.ok(!csrfCookie.httpOnly); // Must be readable
    assert.strictEqual(csrfCookie.secure, true);
    assert.strictEqual(csrfCookie.sameSite, 'Strict');
  });

  it("18.3. GET /api/v1/boardroom/csrf issues refresh CSRF cookie -> 200", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: { operatorId: "op-admin", tenantId: "22222222-2222-2222-2222-222222222222", roles: ["admin"] }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/csrf",
      cookies: {
        [SANTIS_SESSION_COOKIE]: token
      }
    });

    assert.strictEqual(response.statusCode, 200);
    const cookies = response.cookies;
    const csrfCookie = cookies.find((c: any) => c.name === CSRF_COOKIE);
    assert.ok(csrfCookie);
    assert.ok(csrfCookie.value.length > 10);
  });

  it("19. POST /api/v1/boardroom/logout clears cookies -> 200", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/api/v1/boardroom/logout"
    });

    assert.strictEqual(response.statusCode, 200);
    const cookies = response.cookies;

    // Find santis_session cookie
    const sessionCookie = cookies.find((c: any) => c.name === SANTIS_SESSION_COOKIE);
    assert.ok(sessionCookie, `${SANTIS_SESSION_COOKIE} must be present in response`);
    assert.strictEqual(sessionCookie.value, ""); // Cleared

    // Find csrf_token cookie
    const csrfCookie = cookies.find((c: any) => c.name === CSRF_COOKIE);
    assert.ok(csrfCookie, `${CSRF_COOKIE} must be present in response`);
    assert.strictEqual(csrfCookie.value, ""); // Cleared
  });

  it("20. POST /api/v1/boardroom/audit-log with cookie auth but no CSRF fails -> 403", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: { operatorId: "op-admin", tenantId: "22222222-2222-2222-2222-222222222222", roles: ["admin"] }
      }
    }, issuer);

    const response = await server.inject({
      method: "POST",
      url: "/api/v1/boardroom/audit-log",
      cookies: {
        [SANTIS_SESSION_COOKIE]: token
      },
      payload: { actorType: "user", action: "auth.login", payload: {} }
    });

    assert.strictEqual(response.statusCode, 403);
    assert.strictEqual(response.json().code, "ERR_FORBIDDEN");
  });

  it("21. POST /api/v1/boardroom/audit-log with cookie auth and mismatched CSRF fails -> 403", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: { operatorId: "op-admin", tenantId: "22222222-2222-2222-2222-222222222222", roles: ["admin"] }
      }
    }, issuer);

    const response = await server.inject({
      method: "POST",
      url: "/api/v1/boardroom/audit-log",
      headers: {
        "x-csrf-token": "wrong-token"
      },
      cookies: {
        [SANTIS_SESSION_COOKIE]: token,
        [CSRF_COOKIE]: "correct-token"
      },
      payload: { actorType: "user", action: "auth.login", payload: {} }
    });

    assert.strictEqual(response.statusCode, 403);
    assert.strictEqual(response.json().code, "ERR_FORBIDDEN");
  });

  it("22. POST /api/v1/boardroom/audit-log with matching CSRF cookie/header passes -> 201", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: { operatorId: "op-admin", tenantId: "22222222-2222-2222-2222-222222222222", roles: ["admin"] }
      }
    }, issuer);

    const response = await server.inject({
      method: "POST",
      url: "/api/v1/boardroom/audit-log",
      headers: {
        "x-csrf-token": "valid-csrf-token"
      },
      cookies: {
        [SANTIS_SESSION_COOKIE]: token,
        [CSRF_COOKIE]: "valid-csrf-token"
      },
      payload: { actorType: "user", action: "auth.login", payload: {} }
    });

    assert.strictEqual(response.statusCode, 201);
  });
  it("23. GET /api/v1/boardroom/audit-log accepts valid query parameters (limit, offset, action)", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: { operatorId: "op-admin", tenantId: "22222222-2222-2222-2222-222222222222", roles: ["admin"] }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log?limit=10&offset=5&action=auth.login",
      headers: { authorization: `Bearer ${token}` }
    });

    assert.strictEqual(response.statusCode, 200);
    const body = response.json();
    assert.deepStrictEqual(body.data, []);
    assert.strictEqual(body.meta.limit, 10);
    assert.strictEqual(body.meta.offset, 5);
  });

  it("24. GET /api/v1/boardroom/audit-log accepts startDate and endDate filters", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: { operatorId: "op-admin", tenantId: "22222222-2222-2222-2222-222222222222", roles: ["admin"] }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log?startDate=2026-05-01T00:00:00Z&endDate=2026-05-31T23:59:59Z",
      headers: { authorization: `Bearer ${token}` }
    });

    assert.strictEqual(response.statusCode, 200);
  });

  it("25. GET /api/v1/boardroom/audit-log rejects invalid action filter -> 400", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: { operatorId: "op-admin", tenantId: "22222222-2222-2222-2222-222222222222", roles: ["admin"] }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log?action=invalid.action.type",
      headers: { authorization: `Bearer ${token}` }
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.json().error, "Invalid Query");
  });

  it("26. GET /api/v1/boardroom/audit-log rejects startDate > endDate -> 400", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "00000000-0000-4000-8000-000000000000",
      app_metadata: {
        santis: { operatorId: "op-admin", tenantId: "22222222-2222-2222-2222-222222222222", roles: ["admin"] }
      }
    }, issuer);

    const response = await server.inject({
      method: "GET",
      url: "/api/v1/boardroom/audit-log?startDate=2026-06-01T00:00:00Z&endDate=2026-05-01T00:00:00Z",
      headers: { authorization: `Bearer ${token}` }
    });

    assert.strictEqual(response.statusCode, 400);
    assert.strictEqual(response.json().error, "Invalid Query");
  });
});
