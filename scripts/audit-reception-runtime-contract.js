import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FRONTEND_FILE = "admin-panel/src/components/boardroom/LiveIntentMonitor.jsx";
const BACKEND_FILE = "app/api/v1/endpoints/reception.py";

const frontendPath = path.join(ROOT, FRONTEND_FILE);
const backendPath = path.join(ROOT, BACKEND_FILE);

let failed = false;

function fail(message) {
  console.error(`❌ ${message}`);
  failed = true;
}

function pass(message) {
  console.log(`✅ ${message}`);
}

function readRequiredFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} is missing: ${path.relative(ROOT, filePath)}`);
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
}

function requireIncludes(content, pattern, label) {
  if (!content.includes(pattern)) {
    fail(`${label} is missing required contract: ${pattern}`);
    return;
  }

  pass(`${label} contains ${pattern}`);
}

function requireNotIncludes(content, pattern, label) {
  if (content.includes(pattern)) {
    fail(`${label} leaks forbidden runtime contract detail: ${pattern}`);
    return;
  }

  pass(`${label} does not contain ${pattern}`);
}

const frontend = readRequiredFile(frontendPath, FRONTEND_FILE);
const backend = readRequiredFile(backendPath, BACKEND_FILE);

if (frontend) {
  requireIncludes(frontend, "ReceptionLiveToday", FRONTEND_FILE);
  requireIncludes(frontend, "/api/v1/reception/bookings/today", FRONTEND_FILE);
  requireIncludes(frontend, "new URLSearchParams", FRONTEND_FILE);
  requireIncludes(frontend, "locationName", FRONTEND_FILE);
  requireIncludes(frontend, "date: selectedDate", FRONTEND_FILE);
  requireIncludes(frontend, "environment: 'Live'", FRONTEND_FILE);
  requireIncludes(frontend, "LOCATION_OPTIONS", FRONTEND_FILE);
  requireIncludes(frontend, "value: 'budva'", FRONTEND_FILE);
  requireIncludes(frontend, "value: 'kotor'", FRONTEND_FILE);
  requireIncludes(frontend, "value: 'tivat'", FRONTEND_FILE);
  requireIncludes(frontend, "type=\"date\"", FRONTEND_FILE);
  requireIncludes(frontend, "setRefreshToken", FRONTEND_FILE);
  requireIncludes(frontend, "Son güncelleme", FRONTEND_FILE);
  requireIncludes(frontend, "formatUpdatedAt", FRONTEND_FILE);
  requireIncludes(frontend, "response.ok", FRONTEND_FILE);
  requireIncludes(frontend, "AbortController", FRONTEND_FILE);

  requireNotIncludes(frontend, "AIRTABLE_PAT", FRONTEND_FILE);
  requireNotIncludes(frontend, "AIRTABLE_API_KEY", FRONTEND_FILE);
  requireNotIncludes(frontend, "AIRTABLE_BASE_ID", FRONTEND_FILE);
  requireNotIncludes(frontend, "api.airtable.com", FRONTEND_FILE);
  requireNotIncludes(frontend, "Authorization", FRONTEND_FILE);
  requireNotIncludes(frontend, "Bearer", FRONTEND_FILE);
}

if (backend) {
  requireIncludes(backend, "router = APIRouter(prefix=\"/reception\"", BACKEND_FILE);
  requireIncludes(backend, "@router.get(\"/bookings/today\")", BACKEND_FILE);
  requireIncludes(backend, "alias=\"locationName\"", BACKEND_FILE);
  requireIncludes(backend, "date: str | None", BACKEND_FILE);
  requireIncludes(backend, "environment: str = Query(default=\"Live\")", BACKEND_FILE);
  requireIncludes(backend, "AIRTABLE_TOKEN_ENV_KEYS", BACKEND_FILE);
}

if (failed) {
  console.error("❌ Reception runtime contract audit failed.");
  process.exit(1);
}

console.log("✅ Reception runtime contract audit passed.");
