import type { FastifyReply, FastifyRequest } from "fastify";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

interface WifConfig {
  issuer: string;
  audience: string;
  allowedPrincipal: string;
  jwksUrl: string;
}

let cachedJwks: { url: string; resolver: JWTVerifyGetKey } | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`ERR_MISSING_${name}`);
  return value;
}

function loadWifConfig(): WifConfig {
  const jwksUrl = requiredEnv("WIF_JWKS_URL");
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(jwksUrl);
  } catch {
    throw new Error("ERR_INVALID_WIF_JWKS_URL");
  }
  if (parsedUrl.protocol !== "https:") throw new Error("ERR_INVALID_WIF_JWKS_URL");

  return {
    issuer: requiredEnv("WIF_EXPECTED_ISSUER"),
    audience: requiredEnv("WIF_EXPECTED_AUDIENCE"),
    allowedPrincipal: requiredEnv("WIF_ALLOWED_BFF_PRINCIPAL"),
    jwksUrl: parsedUrl.toString(),
  };
}

function getJwksResolver(jwksUrl: string): JWTVerifyGetKey {
  if (cachedJwks?.url === jwksUrl) return cachedJwks.resolver;
  const resolver = createRemoteJWKSet(new URL(jwksUrl));
  cachedJwks = { url: jwksUrl, resolver };
  return resolver;
}

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const match = /^Bearer ([^\s]+)$/.exec(header);
  return match?.[1] ?? null;
}

export async function verifyWifServiceIdentity(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = bearerToken(request);
  if (!token) {
    await reply.code(401).send({ error: "ERR_SERVICE_IDENTITY_INVALID" });
    return;
  }

  try {
    const config = loadWifConfig();
    const { payload } = await jwtVerify(token, getJwksResolver(config.jwksUrl), {
      issuer: config.issuer,
      audience: config.audience,
    });

    const nowSeconds = Math.floor(Date.now() / 1_000);
    if (
      typeof payload.exp !== "number" ||
      payload.exp <= nowSeconds ||
      typeof payload.sub !== "string" ||
      payload.sub !== config.allowedPrincipal
    ) {
      await reply.code(401).send({ error: "ERR_SERVICE_IDENTITY_INVALID" });
      return;
    }
  } catch {
    // Includes missing configuration, signature/claim rejection, and JWKS fetch failure.
    await reply.code(401).send({ error: "ERR_SERVICE_IDENTITY_INVALID" });
  }
}
