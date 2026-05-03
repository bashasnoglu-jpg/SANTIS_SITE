import crypto from "node:crypto";
import { ingestTechnicalDebtSignal } from "../technical-debt/technical-debt.ingestion";

const TTL_MS = 15 * 60 * 1000;

const inMemoryTokens = new Map<string, {
  expiresAt: number;
  used: boolean;
  reason: string;
  createdAt: number;
}>();

function generateToken() {
  return `SNT-OVERRIDE-${crypto.randomBytes(6).toString("hex")}`;
}

export function createOverrideToken(reason: string, generatedBy = "boardroom") {
  const token = generateToken();
  const now = Date.now();

  inMemoryTokens.set(token, {
    expiresAt: now + TTL_MS,
    used: false,
    reason,
    createdAt: now,
  });

  return {
    token,
    expiresAt: new Date(now + TTL_MS).toISOString(),
  };
}

export async function consumeOverrideToken(token: string) {
  const entry = inMemoryTokens.get(token);

  if (!entry) return { valid: false, reason: "NOT_FOUND" };
  if (entry.used) return { valid: false, reason: "ALREADY_USED" };
  if (Date.now() > entry.expiresAt) return { valid: false, reason: "EXPIRED" };

  entry.used = true;

  // 🔥 CRITICAL: FEED BACK INTO SYSTEM AS TRAUMA SIGNAL
  await ingestTechnicalDebtSignal({
    id: `forced-bypass-${Date.now()}`,
    source: "boardroom",
    type: "forced_bypass",
    severity: "high",
    title: "Sovereign Override Executed",
    detail: entry.reason,
    detectedAt: new Date().toISOString(),
    euroRisk: 800, // cost of breaking safety envelope
    confidence: 1,
    remediation: "Investigate root cause of override necessity",
  });

  return { valid: true };
}
