import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";
import { ERR_INVALID_CONFIGURATION, ERR_UNAUTHORIZED } from "./errors.js";

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

export function getSupabaseJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (jwksCache) {
    return jwksCache;
  }

  const jwksUrlStr = process.env.SUPABASE_JWKS_URL;
  const supabaseUrlStr = process.env.SUPABASE_URL;

  let finalUrl: URL;

  if (jwksUrlStr) {
    finalUrl = new URL(jwksUrlStr);
  } else if (supabaseUrlStr) {
    finalUrl = new URL("/auth/v1/.well-known/jwks.json", supabaseUrlStr);
  } else {
    throw ERR_INVALID_CONFIGURATION();
  }

  jwksCache = createRemoteJWKSet(finalUrl);
  return jwksCache;
}

export async function verifySupabaseJwt(token: string): Promise<JWTPayload> {
  const JWKS = getSupabaseJwks();
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      // Depending on Supabase settings, audience or issuer checks can be added here
    });
    return payload;
  } catch (err) {
    throw ERR_UNAUTHORIZED();
  }
}
