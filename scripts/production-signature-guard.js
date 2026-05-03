#!/usr/bin/env node
import https from "node:https";
import http from "node:http";
import crypto from "node:crypto";

const API_URL = process.env.SANTIS_API_URL || "https://api.santis.club";
const API_KEY = process.env.SANTIS_TELEMETRY_KEY || "";
const OVERRIDE_TOKEN = process.env.SANTIS_DEPLOY_OVERRIDE_TOKEN || "";
const OVERRIDE_REASON = process.env.SANTIS_DEPLOY_OVERRIDE_REASON || "";

function requestJson(pathname, method = "GET", body) {
  const endpoint = new URL(pathname, API_URL);
  const transport = endpoint.protocol === "http:" ? http : https;

  return new Promise((resolve, reject) => {
    const req = transport.request(endpoint, {
      method,
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        ...(API_KEY ? { "authorization": `Bearer ${API_KEY}` } : {}),
      },
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Invalid JSON response"));
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex").slice(0, 12);
}

async function verifyOverride(token, reason) {
  return requestJson("/api/v1/boardroom/override-token/consume", "POST", { token, reason });
}

async function runGuard() {
  console.log("🔒 Santis OS Guard running...");

  const trend = await requestJson("/api/v1/technical-debt/trend");
  const projection = trend.projection;

  if (projection.currentEuroDebt < 2000 && projection.trendDirection === "STABLE") {
    console.log("✅ Deploy approved.");
    process.exit(0);
  }

  console.warn("🚫 Deploy blocked by Sovereign Guard.");

  if (!OVERRIDE_TOKEN) {
    console.error("❌ No override token.");
    process.exit(1);
  }

  const result = await verifyOverride(OVERRIDE_TOKEN, OVERRIDE_REASON);

  if (result.ok) {
    console.warn(`🟡 Override accepted: ${hashToken(OVERRIDE_TOKEN)}`);
    process.exit(0);
  }

  console.error("❌ Invalid override token.");
  process.exit(1);
}

runGuard().catch(err => {
  console.error("Guard failure:", err.message);
  process.exit(1);
});
