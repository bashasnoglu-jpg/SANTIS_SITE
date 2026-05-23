import { FastifyRequest, FastifyReply } from "fastify";
import { BoardroomReadableSessionSchema } from "@santis/domain-schema/session.contract.js";
import { verifySupabaseJwt } from "./supabase-jwks.js";
import { createSantisSessionContextFromJwtPayload } from "./session-context.js";
import { ERR_UNAUTHORIZED, ERR_FORBIDDEN } from "./errors.js";
import "./request-context.js";

export async function boardroomAuthPreHandler(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ERR_UNAUTHORIZED();
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw ERR_UNAUTHORIZED();
  }

  // Verify the JWT asymmetrically using JWKS
  const payload = await verifySupabaseJwt(token);

  // Map the payload to the SantisSessionContext
  const sessionContext = createSantisSessionContextFromJwtPayload(payload);

  // Enforce Boardroom Readability capabilities / roles
  const validationResult = BoardroomReadableSessionSchema.safeParse(sessionContext);
  
  if (!validationResult.success) {
    throw ERR_FORBIDDEN();
  }

  // Attach the verified and typed context to the request for downstream handlers
  request.santisContext = validationResult.data;
}
