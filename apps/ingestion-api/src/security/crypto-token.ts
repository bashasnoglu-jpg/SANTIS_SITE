import crypto from "crypto";
import { resolveSecurityConfig } from "../config/security.config";

export type SessionTokenPayload = {
  sessionId: string;
  role: "guest" | "operator" | "admin";
  exp: number;
};

function getSecret() {
  const config = resolveSecurityConfig();
  return config.SESSION_SECRET as string;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf8").toString("base64url");
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

function createSignature(payloadBase64: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

export function signSessionToken(payload: Omit<SessionTokenPayload, "exp">): string {
  const config = resolveSecurityConfig();
  
  const fullPayload: SessionTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + config.SESSION_TOKEN_TTL_SECONDS,
  };

  const payloadStr = JSON.stringify(fullPayload);
  const encodedPayload = base64UrlEncode(payloadStr);
  const signature = createSignature(encodedPayload, getSecret());

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): SessionTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid token format");
  }

  const [encodedPayload, signature] = parts;
  const expectedSignature = createSignature(encodedPayload, getSecret());
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  // Use timing-safe equal to prevent timing attacks
  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new Error("Invalid token signature");
  }

  const payloadStr = base64UrlDecode(encodedPayload);
  let payload: SessionTokenPayload;
  try {
    payload = JSON.parse(payloadStr);
  } catch (e) {
    throw new Error("Malformed token payload");
  }

  if (Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error("Token expired");
  }

  return payload;
}
