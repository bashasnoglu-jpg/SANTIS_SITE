import { z } from "zod";

const WebSocketGatewayEnvSchema = z.object({
  WS_PORT: z.coerce.number().int().min(1024).max(65535).default(8080),
  WS_HOST: z.string().min(1).default("0.0.0.0"),
  WS_PATH: z.string().startsWith("/").default("/ws"),
});

export type WebSocketGatewayConfig = z.infer<typeof WebSocketGatewayEnvSchema>;

export function resolveWebSocketGatewayConfig(env: NodeJS.ProcessEnv = process.env): WebSocketGatewayConfig {
  const parsed = WebSocketGatewayEnvSchema.safeParse(env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`[WS Gateway Config] Invalid environment: ${details}`);
  }

  return parsed.data;
}
