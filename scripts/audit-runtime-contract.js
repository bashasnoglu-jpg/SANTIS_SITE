import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();

const forbidden = [
  "/api/v1/analytics/metrics",
  "/services",
  "fallback_data.json",
  "fallback-data.json",
  "site_content.json",
  "window.SANTIS_FALLBACK",
];

const targets = [
  "assets/js/api-client.js",
  "admin/santis-core.js",
  "assets/js/modules/page-router.js",
];

let failed = false;

for (const file of targets) {
  const full = path.join(ROOT, file);

  if (!fs.existsSync(full)) continue;

  const content = fs.readFileSync(full, "utf8");

  for (const pattern of forbidden) {
    if (content.includes(pattern)) {
      console.error(`❌ Forbidden runtime dependency found: ${pattern} in ${file}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log("✅ Phase 68 Runtime Contract Audit passed.");
