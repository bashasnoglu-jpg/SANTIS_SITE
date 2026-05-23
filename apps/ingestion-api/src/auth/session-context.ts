import { SantisSessionContext, SantisSessionContextSchema } from "@santis/domain-schema/session.contract.js";
import { JWTPayload } from "jose";
import { ERR_UNAUTHORIZED, ERR_TENANT_SCOPE_REQUIRED } from "./errors.js";

export function createSantisSessionContextFromJwtPayload(payload: JWTPayload): SantisSessionContext {
  if (!payload.sub || !payload.exp || !payload.iat) {
    throw ERR_UNAUTHORIZED();
  }

  const appMetadata = payload.app_metadata as Record<string, any> | undefined;
  const santis = appMetadata?.santis;

  if (!santis) {
    throw ERR_UNAUTHORIZED();
  }

  if (!santis.tenantId) {
    throw ERR_TENANT_SCOPE_REQUIRED();
  }

  const rawContext = {
    sessionId: payload.session_id || payload.jti || `${payload.sub}-${payload.iat}`,
    operator: {
      operatorId: payload.sub,
      email: payload.email as string | undefined,
      roles: Array.isArray(santis.roles) ? santis.roles : [],
      capabilities: Array.isArray(santis.capabilities) ? santis.capabilities : []
    },
    tenant: {
      tenantId: santis.tenantId,
      tenantSlug: santis.tenantSlug
    },
    issuedAt: payload.iat,
    expiresAt: payload.exp
  };

  const parsedResult = SantisSessionContextSchema.safeParse(rawContext);
  if (!parsedResult.success) {
    throw ERR_UNAUTHORIZED();
  }

  return parsedResult.data;
}
