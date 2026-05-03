#!/usr/bin/env node
/**
 * SANTIS OS — Production Signature Guard
 * Purpose: Blocks deploys when technical-debt forecast indicates operational risk.
 * Contract: Telemetry failure is observable; guard failure is deploy-blocking.
 */
import https from "node:https";
import http from "node:http";
import crypto from "node:crypto";

const API_URL = process.env.SANTIS_API_URL || "https://api.santis.club";
const API_KEY = process.env.SANTIS_TELEMETRY_KEY || "";
const OVERRIDE_TOKEN = process.env.SANTIS_DEPLOY_OVERRIDE_TOKEN || "";
const OVERRIDE_REASON = process.env.SANTIS_DEPLOY_OVERRIDE_REASON || "";

const FATAL_EURO_THRESHOLD = Number(process.env.SANTIS_FATAL_EURO_THRESHOLD || 5000);
const IMMINENT_BREACH_DAYS = Number(process.env.SANTIS_IMMINENT_BREACH_DAYS || 7);
const VELOCITY_BLOCK_THRESHOLD = Number(process.env.SANTIS_VELOCITY_BLOCK_THRESHOLD || 500);
const RECOVERY_PASS_THRESHOLD = Number(process.env.SANTIS_RECOVERY_PASS_THRESHOLD || 4000);
const OPTIMAL_PASS_THRESHOLD = Number(process.env.SANTIS_OPTIMAL_PASS_THRESHOLD || 2000);

function requestJson(pathname) {
  const endpoint = new URL(pathname, API_URL);
  const transport = endpoint.protocol === "http:" ? http : https;

  return new Promise((resolve, reject) => {
    const req = transport.request(endpoint, {
      method: "GET",
      headers: {
        "accept": "application/json",
        ...(API_KEY ? { "authorization": `Bearer ${API_KEY}` } : {}),
      },
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", chunk => { body += chunk; });
      res.on("end", () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error("Invalid JSON returned by Boardroom trend endpoint"));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

function daysUntil(isoDate) {
  if (!isoDate) return null;
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex").slice(0, 12);
}

function isOverrideAllowed() {
  if (!OVERRIDE_TOKEN) return false;
  if (OVERRIDE_REASON.trim().length < 12) {
    console.error("❌ Override token supplied without sufficient reason. SANTIS_DEPLOY_OVERRIDE_REASON must be explicit.");
    return false;
  }

  console.warn(`⚠️ Sovereign override active. token=${hashToken(OVERRIDE_TOKEN)} reason=${OVERRIDE_REASON}`);
  return true;
}

function evaluate(projection) {
  const breachDays = daysUntil(projection.estimatedBreachDate);

  if (projection.currentEuroDebt >= FATAL_EURO_THRESHOLD) {
    return { pass: false, reason: `Fatal State: currentEuroDebt ${projection.currentEuroDebt} >= ${FATAL_EURO_THRESHOLD}` };
  }

  if (breachDays !== null && breachDays < IMMINENT_BREACH_DAYS && projection.trendDirection === "DEGRADING") {
    return { pass: false, reason: `Imminent Breach: estimated breach in ${breachDays} day(s)` };
  }

  if (projection.debtVelocityEuroPerDay > VELOCITY_BLOCK_THRESHOLD) {
    return { pass: false, reason: `Velocity Anomaly: ${projection.debtVelocityEuroPerDay.toFixed(2)} EUR/day` };
  }

  if (projection.currentEuroDebt > RECOVERY_PASS_THRESHOLD && projection.trendDirection === "IMPROVING") {
    return { pass: true, reason: "Recovery State: high debt but improving trend" };
  }

  if (projection.currentEuroDebt < OPTIMAL_PASS_THRESHOLD && projection.trendDirection === "STABLE") {
    return { pass: true, reason: "Optimal State: low debt and stable trend" };
  }

  return { pass: true, reason: "Risk accepted within sovereign deploy envelope" };
}

try {
  console.log("🔒 [SANTIS] Production Signature Guard evaluating deploy risk...");
  const response = await requestJson(`/api/v1/technical-debt/trend?thresholdEuro=${FATAL_EURO_THRESHOLD}`);
  const projection = response.projection || response;
  const decision = evaluate(projection);

  console.log(`Current Debt: €${projection.currentEuroDebt}`);
  console.log(`Velocity: €${Number(projection.debtVelocityEuroPerDay).toFixed(2)}/day`);
  console.log(`Trend: ${projection.trendDirection}`);
  console.log(`Breach: ${projection.estimatedBreachDate || "none"}`);

  if (decision.pass) {
    console.log(`✅ Deploy signature granted. ${decision.reason}`);
    process.exit(0);
  }

  if (isOverrideAllowed()) {
    console.warn(`🟡 Deploy signature granted by sovereign override. Original block: ${decision.reason}`);
    process.exit(0);
  }

  console.error(`🚫 Deploy signature denied. ${decision.reason}`);
  process.exit(1);
} catch (error) {
  if (isOverrideAllowed()) {
    console.warn(`🟡 Deploy signature granted by override because guard could not evaluate: ${error.message}`);
    process.exit(0);
  }

  console.error(`🚫 Deploy signature denied because guard could not evaluate trend endpoint: ${error.message}`);
  process.exit(1);
}
