import { SantisSessionContext } from "@santis/domain-schema";

declare module "fastify" {
  interface FastifyRequest {
    santisContext?: SantisSessionContext;
  }
}
