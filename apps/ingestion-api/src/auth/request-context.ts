import { SantisSessionContext } from "@santis/domain-schema/session.contract.js";

declare module "fastify" {
  interface FastifyRequest {
    santisContext?: SantisSessionContext;
  }
}
