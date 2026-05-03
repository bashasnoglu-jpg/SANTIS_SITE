#!/usr/bin/env node
/**
 * SANTIS OS — CI Telemetry Bridge
 * Purpose: Converts CI dependency/security findings into Boardroom technical-debt signals.
 * Runtime: ESM, zero external dependencies, non-blocking telemetry transport.
 */
import { execSync } from "node:child_process";
import https from "node:https";
import http from "node:http";

const API_URL = process.env.SANTIS_API_URL || "https://api.santis.club";
const API_KEY = process.env.SANTIS_TELEMETRY_KEY || "";
const CI_RUN_ID = process.env.GITHUB_RUN_ID || `local-${Date.now()}`;
const CI_SHA = process.env.GITHUB_SHA || "unknown-sha";
const CI_REF = process.env.GITHUB_REF_NAME || process.env.GITHUB_REF || "unknown-ref";

console.log("🦅 [SANTIS CI] Telemetry Bridge active. Translating audit findings into Boardroom signals...");

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function runPnpmAudit() {
  try {
    const output = execSync("pnpm audit --json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return safeJsonParse(output, {});
  } catch (error) {
    const stdout = typeof error?.stdout === "string" ? error.stdout : "";
    return safeJsonParse(stdout, {});
  }
}

function readVulnerabilityCounts(auditResult) {
  const meta = auditResult?.metadata?.vulnerabilities || {};

  return {
    critical: Number(meta.critical || 0),
    high: Number(meta.high || 0),
    moderate: Number(meta.moderate || 0),
    low: Number(meta.low || 0),
  };
}

function nowIso() {
  return new Date().toISOString();
}

function createSignal({ type, severity, count, euroUnit, confidence, title, detail, remediation }) {
  return {
    id: `ci-${type}-${CI_RUN_ID}-${Date.now()}`,
    source: "ci",
    type,
    severity,
    title,
    detail: `${detail} Commit: ${CI_SHA}. Ref: ${CI_REF}. Count: ${count}.`,
    detectedAt: nowIso(),
    euroRisk: count * euroUnit,
    confidence,
    remediation,
  };
}

function calculateSignals(counts) {
  const signals = [];

  if (counts.critical > 0) {
    signals.push(createSignal({
      type: "security_advisory",
      severity: "critical",
      count: counts.critical,
      euroUnit: 4500,
      confidence: 0.95,
      title: "Critical dependency advisory detected",
      detail: "CI dependency audit found critical vulnerabilities before deployment.",
      remediation: "Run pnpm audit, upgrade or override the affected dependency, and re-run Sovereign CI.",
    }));
  }

  if (counts.high > 0) {
    signals.push(createSignal({
      type: "dependency_drift",
      severity: "high",
      count: counts.high,
      euroUnit: 1200,
      confidence: 0.85,
      title: "High dependency drift detected",
      detail: "CI dependency audit found high-severity dependency risk.",
      remediation: "Patch dependency graph and confirm pnpm-lock.yaml remains deterministic.",
    }));
  }

  if (counts.moderate > 0) {
    signals.push(createSignal({
      type: "dependency_drift",
      severity: "medium",
      count: counts.moderate,
      euroUnit: 350,
      confidence: 0.72,
      title: "Moderate dependency drift detected",
      detail: "CI dependency audit found moderate-severity dependency risk.",
      remediation: "Schedule dependency update during the next hardening window.",
    }));
  }

  return signals;
}

function transmit(signals) {
  if (signals.length === 0) {
    console.log("✅ [SANTIS CI] No dependency risk signal detected. EURO risk: €0");
    return Promise.resolve();
  }

  if (!API_KEY) {
    console.warn("⚠️ [SANTIS CI] SANTIS_TELEMETRY_KEY is not set. Telemetry skipped without failing CI.");
    return Promise.resolve();
  }

  const endpoint = new URL("/api/v1/technical-debt", API_URL);
  const payload = JSON.stringify({ signals });
  const transport = endpoint.protocol === "http:" ? http : https;

  console.log(`📡 [SANTIS CI] Transmitting ${signals.length} Boardroom signal(s) to ${endpoint.origin}...`);

  return new Promise((resolve) => {
    const req = transport.request(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${API_KEY}`,
        "content-length": Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", chunk => { body += chunk; });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          console.log("🥂 [SANTIS CI] Boardroom telemetry accepted.");
        } else {
          console.warn(`⚠️ [SANTIS CI] Boardroom telemetry rejected with status ${res.statusCode}. ${body}`);
        }
        resolve();
      });
    });

    req.on("error", (error) => {
      console.warn(`⚠️ [SANTIS CI] Telemetry transport failed without blocking CI: ${error.message}`);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

const auditResult = runPnpmAudit();
const counts = readVulnerabilityCounts(auditResult);
const signals = calculateSignals(counts);

await transmit(signals);
