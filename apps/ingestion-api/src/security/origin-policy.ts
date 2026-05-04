import { CorsOptionsDelegate, CorsOptions } from "cors";
import { Request } from "express";

let cachedOriginsStr: string | undefined;
let cachedOriginsSet: Set<string> = new Set();
let cachedPatterns: string[] = [];

/**
 * Validates if the given origin is allowed based on exact matches (ALLOWED_ORIGINS)
 * and optional regex patterns (WS_ALLOWED_ORIGIN_PATTERNS).
 */
export const isOriginAllowed = (origin: string, patterns: string[] = []): boolean => {
  const currentOriginsStr = process.env.ALLOWED_ORIGINS || "";

  // Rebuild exact match Set if env var changed (e.g., hot reload or first run)
  if (currentOriginsStr !== cachedOriginsStr) {
    if (!currentOriginsStr) {
      console.warn('⚠️ [Origin Policy] ALLOWED_ORIGINS environment variable is empty or not set!');
    }

    cachedOriginsSet = new Set<string>(
      currentOriginsStr.split(",").map((o: string) => {
        let trimmed = o.trim();
        if (trimmed.endsWith("/")) {
          trimmed = trimmed.slice(0, -1);
        }
        return trimmed;
      }).filter((o: string) => o.length > 0)
    );
    cachedOriginsStr = currentOriginsStr;
  }

  let normalizedOrigin = origin.trim();
  if (normalizedOrigin.endsWith("/")) {
    normalizedOrigin = normalizedOrigin.slice(0, -1);
  }

  // 1. O(1) Exact Match
  if (cachedOriginsSet.has(normalizedOrigin)) {
    return true;
  }

  // 2. O(N) Pattern Match (Regex)
  for (const pattern of patterns) {
    try {
      if (new RegExp(pattern).test(normalizedOrigin)) {
        return true;
      }
    } catch (err) {
      console.error(`🚨 [Origin Policy] Invalid regex pattern: ${pattern}`, err);
    }
  }

  return false;
};

/**
 * Express CORS Delegate to handle dynamic origin resolution.
 */
export const dynamicCorsDelegate: CorsOptionsDelegate<Request> = (
  req,
  callback: (error: Error | null, options?: CorsOptions) => void,
) => {
  const origin = req.header("Origin");

  const corsOptions: CorsOptions = {
    credentials: true,
    optionsSuccessStatus: 204,
  };

  if (origin === undefined) {
    corsOptions.origin = false;
    return callback(null, corsOptions);
  }

  // HTTP requests only use exact matching based on ALLOWED_ORIGINS
  if (isOriginAllowed(origin)) {
    corsOptions.origin = true;
  } else {
    corsOptions.origin = false;

    console.warn(JSON.stringify({
      event: "CORS_REJECTED",
      severity: "WARNING",
      timestamp: new Date().toISOString(),
      ip: req.ip || req.socket?.remoteAddress,
      origin: origin,
      path: req.originalUrl || req.path,
      method: req.method
    }));
  }

  callback(null, corsOptions);
};
