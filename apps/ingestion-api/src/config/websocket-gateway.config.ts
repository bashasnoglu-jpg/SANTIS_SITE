import { z } from "zod";

const WebSocketGatewayEnvSchema = z.object({
  WS_PORT: z.coerce.number().int().min(1024).max(65535).default(8080),
  WS_HOST: z.string().min(1).default("0.0.0.0"),
  WS_PATH: z.string().startsWith("/").default("/ws"),
  WS_ALLOWED_ORIGINS: z.string()
    .default("http://localhost:5173,http://127.0.0.1:5173,http://localhost:5500,http://127.0.0.1:5500,http://localhost:3030,http://127.0.0.1:3030")
    .transform(str => str.split(",").map(s => s.trim()).filter(Boolean)),
  WS_ALLOWED_ORIGIN_PATTERNS: z.string()
    .optional()
    .transform(str => str ? str.split(",").map(s => s.trim()).filter(Boolean) : [])
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
