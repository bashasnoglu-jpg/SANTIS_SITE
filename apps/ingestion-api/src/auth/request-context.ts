import { SantisSessionContext } from "@santis/domain-schema/session.contract";

declare module "fastify" {
  interface FastifyRequest {
    santisContext?: SantisSessionContext;
  }
}
