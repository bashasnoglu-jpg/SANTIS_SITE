import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";
import { ERR_INVALID_CONFIGURATION, ERR_UNAUTHORIZED } from "./errors.js";

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;
let issuerCache: string | null = null;

function getSupabaseConfig() {
  const supabaseUrlStr = process.env.SUPABASE_URL;
  if (!supabaseUrlStr) {
    throw ERR_INVALID_CONFIGURATION();
  }

  let supabaseUrl: URL;
  try {
    supabaseUrl = new URL(supabaseUrlStr);
  } catch {
    throw ERR_INVALID_CONFIGURATION();
  }

  const jwksUrlStr = process.env.SUPABASE_JWKS_URL;
  let jwksUrl: URL;
  if (jwksUrlStr) {
    try {
      jwksUrl = new URL(jwksUrlStr);
    } catch {
      throw ERR_INVALID_CONFIGURATION();
    }
  } else {
    jwksUrl = new URL("/auth/v1/.well-known/jwks.json", supabaseUrl);
  }

  const audience = process.env.SUPABASE_JWT_AUDIENCE;
  
  // Ensure we derive the issuer deterministically, avoiding trailing slash issues
  const baseUrlStr = supabaseUrl.origin + supabaseUrl.pathname.replace(/\/$/, "");
  const issuer = new URL("/auth/v1", baseUrlStr).toString();

  return { jwksUrl, issuer, audience };
}

export function getSupabaseJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (jwksCache) {
    return jwksCache;
  }
  const { jwksUrl } = getSupabaseConfig();
  jwksCache = createRemoteJWKSet(jwksUrl);
  return jwksCache;
}

export async function verifySupabaseJwt(token: string): Promise<JWTPayload> {
  const JWKS = getSupabaseJwks();
  const { issuer, audience } = getSupabaseConfig();

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: issuer,
      ...(audience ? { audience } : {})
    });
    return payload;
  } catch (err) {
    throw ERR_UNAUTHORIZED();
  }
}
