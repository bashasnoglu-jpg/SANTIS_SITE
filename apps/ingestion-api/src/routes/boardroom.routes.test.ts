import { describe, it, before, after } from "node:test";
import * as assert from "node:assert";
import { buildServer } from "../server.js";
import { TestJwksServer } from "../test-utils/jwks-test-keys.js";
import type { FastifyInstance } from "fastify";

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
    server = buildServer();
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
    const token = await jwksServer.signToken({ sub: "user-123" }, issuer);

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
      sub: "user-123",
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
      sub: "user-123",
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

  it("7. Valid Boardroom-readable JWT -> 501 / ERR_BOARDROOM_AUDIT_LOG_NOT_IMPLEMENTED", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "user-admin",
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

    assert.strictEqual(response.statusCode, 501);
    assert.strictEqual(response.json().code, "ERR_BOARDROOM_AUDIT_LOG_NOT_IMPLEMENTED");
  });

  it("8. Valid JWT with role concierge but capability boardroom:read -> 501", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "user-concierge",
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

    assert.strictEqual(response.statusCode, 501);
    assert.strictEqual(response.json().code, "ERR_BOARDROOM_AUDIT_LOG_NOT_IMPLEMENTED");
  });

  it("9. Valid JWT with role concierge but capability audit-log:read -> 501", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "user-concierge-2",
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

    assert.strictEqual(response.statusCode, 501);
    assert.strictEqual(response.json().code, "ERR_BOARDROOM_AUDIT_LOG_NOT_IMPLEMENTED");
  });

  it("10. Valid JWT with tenantId but not UUID -> 401", async () => {
    const issuer = "http://127.0.0.1:54321/auth/v1";
    const token = await jwksServer.signToken({
      sub: "user-admin",
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
});
