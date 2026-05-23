import { FastifyRequest, FastifyReply } from "fastify";
import { BoardroomReadableSessionSchema, BoardroomWritableSessionSchema } from "@santis/domain-schema/session.contract.js";
import { verifySupabaseJwt } from "./supabase-jwks.js";
import { createSantisSessionContextFromJwtPayload } from "./session-context.js";
import { ERR_UNAUTHORIZED, ERR_FORBIDDEN } from "./errors.js";
import { SANTIS_SESSION_COOKIE, CSRF_COOKIE, CSRF_HEADER } from "./constants.js";
import "./request-context.js";

async function verifyAndGetSession(request: FastifyRequest) {
  let token: string | undefined;
  let tokenSource: 'bearer' | 'cookie' = 'bearer';

  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
    tokenSource = 'bearer';
  }

  // Fallback to cookie if Bearer is absent
  if (!token && request.cookies && request.cookies[SANTIS_SESSION_COOKIE]) {
    token = request.cookies[SANTIS_SESSION_COOKIE];
    tokenSource = 'cookie';
  }

  if (!token) {
    throw ERR_UNAUTHORIZED();
  }

  // CSRF Guard: Only applies to Cookie Auth and State-Changing methods
  if (tokenSource === 'cookie') {
    const method = request.method.toUpperCase();
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      const csrfCookie = request.cookies[CSRF_COOKIE];
      const csrfHeader = request.headers[CSRF_HEADER];
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        throw ERR_FORBIDDEN();
      }
    }
  }

  const payload = await verifySupabaseJwt(token);
  return createSantisSessionContextFromJwtPayload(payload);
}

export async function boardroomAuthPreHandler(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const sessionContext = await verifyAndGetSession(request);

  const validationResult = BoardroomReadableSessionSchema.safeParse(sessionContext);
  if (!validationResult.success) {
    throw ERR_FORBIDDEN();
  }

  request.santisContext = validationResult.data;
}

export async function boardroomWriteAuthPreHandler(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const sessionContext = await verifyAndGetSession(request);

  const validationResult = BoardroomWritableSessionSchema.safeParse(sessionContext);
  if (!validationResult.success) {
    throw ERR_FORBIDDEN();
  }

  request.santisContext = validationResult.data;
}
