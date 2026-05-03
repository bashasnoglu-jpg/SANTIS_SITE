import { z } from "zod";

const DEVELOPMENT_SESSION_SECRET = "santis-local-development-session-secret-not-for-production";

const SecurityEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SESSION_SECRET: z.string().optional(),
  SESSION_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(86400).default(3600),
});

export type SecurityConfig = z.infer<typeof SecurityEnvSchema>;

let cachedSecurityConfig: SecurityConfig | null = null;

export function resolveSecurityConfig(env: NodeJS.ProcessEnv = process.env): SecurityConfig {
  if (cachedSecurityConfig) {
    return cachedSecurityConfig;
  }

  const parsed = SecurityEnvSchema.safeParse(env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`[Security Config] Invalid environment: ${details}`);
  }

  const data = parsed.data;

  if (data.NODE_ENV === "production" && !data.SESSION_SECRET) {
    throw new Error(`[Security Config] FATAL: SESSION_SECRET must be explicitly provided in production!`);
  }

  if (!data.SESSION_SECRET) {
    data.SESSION_SECRET = DEVELOPMENT_SESSION_SECRET;
    console.warn(`⚠️ [Security Config] Missing SESSION_SECRET in development. Using deterministic local fallback. Set SESSION_SECRET to silence this warning.`);
  }

  cachedSecurityConfig = data;
  return cachedSecurityConfig;
}
