import type { FastifyReply, FastifyRequest } from "fastify";

export async function enforceFetchMetadata(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const site = request.headers["sec-fetch-site"];
  if (typeof site === "string" && site !== "same-origin") {
    await reply.code(403).send({ error: "ERR_CROSS_SITE_REQUEST_DENIED" });
  }
}
